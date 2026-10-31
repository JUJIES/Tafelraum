"""One local, bounded DocRes appearance job. No archive or network access.

Official task/architecture: https://github.com/ZZZHANG-jx/DocRes (MIT).
Only the pinned, unchanged checkout and recorded checkpoints are accepted.
"""
import ast
import base64
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys

COMMIT = 'd3e3a18c7c7ad10e4615ca2eb6a10f83128d8560'
SHA = '1d6a89d754fe1e58ffd1865eab0ef3f03344798d39197b2d9a77ce4fbc8c02fd'


def rectangle(mask, margin=0.02):
    """Bounding box includes every detected page pixel plus a safety margin."""
    import numpy as np
    height, width = mask.shape
    ys, xs = np.nonzero(mask)
    if not len(xs) or len(xs) < width * height * 0.1:
        return dict(x=0, y=0, width=1, height=1), True
    left = max(0, float(xs.min()) / width - margin)
    top = max(0, float(ys.min()) / height - margin)
    right = min(1, float(xs.max() + 1) / width + margin)
    bottom = min(1, float(ys.max() + 1) / height + margin)
    touches = xs.min() == 0 or ys.min() == 0 or xs.max() == width - 1 or ys.max() == height - 1
    return dict(x=left, y=top, width=right-left, height=bottom-top), bool(touches)


def functions(path, names, namespace, source=None):
    selected = [node for node in ast.parse(path.read_text()).body
                if isinstance(node, ast.FunctionDef) and node.name in names]
    if {node.name for node in selected} != set(names):
        raise ValueError('Unexpected DocRes source functions.')
    class Adapt(ast.NodeTransformer):
        def visit_Assign(self, node):
            self.generic_visit(node)
            if any(isinstance(target, ast.Name) and target.id == 'MAX_SIZE' for target in node.targets):
                if not isinstance(node.value, ast.Constant) or node.value.value != 1600:
                    raise ValueError('Unexpected DocRes size contract.')
                node.value = ast.Constant(value=1024)
            return node
        def visit_Call(self, node):
            self.generic_visit(node)
            if source is not None and isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name) and node.func.value.id == 'cv2' and node.func.attr == 'imread':
                return ast.Call(func=ast.Attribute(value=ast.Name(id='source', ctx=ast.Load()), attr='copy', ctx=ast.Load()), args=[], keywords=[])
            return node
    module = ast.fix_missing_locations(Adapt().visit(ast.Module(body=selected, type_ignores=[])))
    if source is not None:
        namespace['source'] = source
    exec(compile(module, str(path), 'exec'), namespace)


def decode_image(value):
    import cv2
    import numpy as np
    from PIL import Image, ImageOps
    if not isinstance(value, str) or not value.startswith(('data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,')):
        raise ValueError('Expected a PNG, JPEG or WebP image.')
    raw = base64.b64decode(value.split(',', 1)[1], validate=True)
    Image.MAX_IMAGE_PIXELS = 16_000_000
    with Image.open(io.BytesIO(raw)) as image:
        if image.width * image.height > 16_000_000 or max(image.size) > 10000:
            raise ValueError('Image exceeds 16 megapixels or 10000 pixels per side.')
        image = ImageOps.exif_transpose(image).convert('RGBA')
        white = Image.new('RGBA', image.size, 'white')
        white.alpha_composite(image)
        return cv2.cvtColor(np.array(white.convert('RGB')), cv2.COLOR_RGB2BGR)


def encode_image(image):
    import cv2
    ok, encoded = cv2.imencode('.png', image)
    if not ok:
        raise ValueError('PNG encoding failed.')
    return 'data:image/png;base64,' + base64.b64encode(encoded).decode('ascii')


def run(config, request):
    source = decode_image(request.get('dataURL', ''))
    if request.get('operation') == 'perspective':
        from perspective import rectify_pair
        original = decode_image(request.get('originalDataURL', ''))
        original, enhanced = rectify_pair(original, source, request.get('quad'))
        return dict(dataURL=encode_image(enhanced), originalDataURL=encode_image(original),
                    width=enhanced.shape[1], height=enhanced.shape[0])
    import cv2
    import numpy as np
    import torch
    from mbd import document_mask
    repo = Path(config['repo'])
    if subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip() != COMMIT or subprocess.check_output(['git', '-C', str(repo), 'status', '--porcelain', '--untracked-files=no'], text=True).strip():
        raise ValueError('Pinned DocRes source has changed.')
    if hashlib.sha256(Path(config['weights']).read_bytes()).hexdigest() != SHA:
        raise ValueError('Unexpected DocRes checkpoint.')
    if not torch.backends.mps.is_available():
        raise ValueError('This personal pilot requires an Apple Silicon Mac with MPS.')
    device = torch.device('mps')
    mask, _ = document_mask(source, repo, config['mbdWeights'], device)
    rect, uncertain = rectangle(mask)
    torch.mps.synchronize()
    torch.mps.empty_cache()
    spec = importlib.util.spec_from_file_location('docres_restormer', repo / 'models/restormer_arch.py')
    architecture = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(architecture)
    model = architecture.Restormer(inp_channels=6, out_channels=3, dim=48,
                                  num_blocks=[2, 3, 3, 4], num_refinement_blocks=4,
                                  heads=[1, 2, 4, 8], ffn_expansion_factor=2.66,
                                  bias=False, LayerNorm_type='WithBias', dual_pixel_task=True)
    checkpoint = torch.load(config['weights'], map_location='cpu', weights_only=True)
    state = checkpoint['model_state']
    if not all(key.startswith('module.') for key in state):
        raise ValueError('Unexpected DocRes state keys.')
    model.load_state_dict({key[7:]: val for key, val in state.items()}, strict=True)
    del checkpoint, state
    model.eval().to(device=device, dtype=torch.float16)
    def finite(_module, _args, prediction):
        if not torch.isfinite(prediction).all().item():
            raise ValueError('Non-finite DocRes prediction.')
    model.register_forward_hook(finite)
    namespace = dict(cv2=cv2, np=np, torch=torch, DEVICE=device)
    functions(repo / 'data/preprocess/crop_merge_image.py', ['stride_integral'], namespace)
    functions(repo / 'inference.py', ['appearance_prompt', 'appearance'], namespace, source)
    *_, result = namespace['appearance'](model, None)
    if result.shape != source.shape or result.dtype != np.uint8:
        raise ValueError('Unexpected DocRes output dimensions.')
    return dict(dataURL=encode_image(result),
                width=result.shape[1], height=result.shape[0], rect=rect, uncertain=uncertain)


if __name__ == '__main__':
    try:
        config = json.loads(Path(sys.argv[1]).read_text())
        incoming = sys.stdin.buffer.read(80_000_001)
        if len(incoming) > 80_000_000:
            raise ValueError('Input too large.')
        result = run(config, json.loads(incoming))
        print(json.dumps(result), flush=True)
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
