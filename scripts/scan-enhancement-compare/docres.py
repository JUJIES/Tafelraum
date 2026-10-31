"""Append a real DocRes task to an existing comparison; never changes A/B/C."""
import argparse
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import platform
import resource
import shutil
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
UPSTREAM_COMMIT = 'd3e3a18c7c7ad10e4615ca2eb6a10f83128d8560'
WEIGHTS_SHA = '1d6a89d754fe1e58ffd1865eab0ef3f03344798d39197b2d9a77ce4fbc8c02fd'
WEIGHTS_URL = 'https://huggingface.co/DaVinciCode/doctra-docres-main/blob/bda6419b1ccb2a63f1f34de2adfc237986587205/docres.pkl'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def functions_from(path, names, namespace, max_size=None):
    """Run only the inspected official task functions, avoiding unrelated MBD imports."""
    parsed = ast.parse(path.read_text())
    selected = [node for node in parsed.body if isinstance(node, ast.FunctionDef) and node.name in names]
    if {node.name for node in selected} != set(names):
        raise ValueError(f'Missing upstream functions: {names}')
    if max_size is not None:
        assignments = [node for function in selected for node in ast.walk(function)
                       if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == 'MAX_SIZE' for target in node.targets)]
        if len(assignments) != 1 or assignments[0].value.value != 1600:
            raise ValueError('Upstream MAX_SIZE contract changed.')
        assignments[0].value = ast.Constant(value=max_size)
    module = ast.fix_missing_locations(ast.Module(body=selected, type_ignores=[]))
    exec(compile(module, str(path), 'exec'), namespace)


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--weights', type=Path, required=True)
    parser.add_argument('--device', choices=['mps', 'cpu'], default='mps')
    parser.add_argument('--task', choices=['deshadowing', 'appearance', 'dewarping'], default='deshadowing')
    parser.add_argument('--mbd-weights', type=Path)
    parser.add_argument('--max-size', type=int, default=1600)
    args = parser.parse_args()
    base, output, repo, weights = [path.resolve() for path in [args.base, args.output, args.repo, args.weights]]
    if not base.is_relative_to(ROOT / 'output') or not output.is_relative_to(ROOT / 'output') or output.exists():
        parser.error('Use an existing base and a fresh output under ignored output/.')
    if args.max_size < 256 or args.max_size > 1600 or args.max_size % 8:
        parser.error('max-size must be a multiple of 8 between 256 and 1600.')
    commit = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()
    # Importing the inspected architecture creates Python bytecode caches.
    # Validate all tracked sources; generated, untracked caches are not source edits.
    if commit != UPSTREAM_COMMIT or subprocess.check_output(['git', '-C', str(repo), 'status', '--porcelain', '--untracked-files=no'], text=True).strip():
        parser.error('Expected the pinned, unchanged official DocRes checkout.')
    if digest(weights) != WEIGHTS_SHA:
        parser.error('Weights hash differs from the recorded checkpoint.')
    manifest_path = base / 'comparison.json'
    manifest_hash = digest(manifest_path)
    data = json.loads(manifest_path.read_text())
    if data['format'] != 'tafelraum-scan-comparison-v1' or [item['id'] for item in data['variants']] != ['a', 'b', 'c']:
        parser.error('Expected the original A/B/C comparison.')
    original_path = base / 'images/original.png'
    original_hash = digest(original_path)
    for item in data['variants']:
        if item['image'] != f"images/{item['id']}.png" or digest(base / item['image']) != item['sha256']:
            parser.error('A base variant differs from its recorded hash.')

    import cv2
    import numpy as np
    import torch
    from PIL import Image
    with Image.open(original_path) as image:
        original = np.array(image.convert('RGB'))
    if hashlib.sha256(original.tobytes()).hexdigest() != data['normalizedPixelSha256']:
        parser.error('Original pixels differ from the base comparison.')
    if args.device == 'mps' and not torch.backends.mps.is_available():
        parser.error('MPS unavailable; explicitly select CPU for a separate run.')
    device = torch.device(args.device)
    precision = torch.float16 if args.device == 'mps' and args.task != 'dewarping' else torch.float32
    spec = importlib.util.spec_from_file_location('docres_official_restormer', repo / 'models/restormer_arch.py')
    architecture = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(architecture)
    model = architecture.Restormer(inp_channels=6, out_channels=3, dim=48,
                                  num_blocks=[2, 3, 3, 4], num_refinement_blocks=4,
                                  heads=[1, 2, 4, 8], ffn_expansion_factor=2.66,
                                  bias=False, LayerNorm_type='WithBias', dual_pixel_task=True)
    load_started = time.perf_counter()
    checkpoint = torch.load(weights, map_location='cpu', weights_only=True)
    state = checkpoint['model_state']
    if not all(key.startswith('module.') for key in state):
        raise ValueError('Unexpected checkpoint keys.')
    model.load_state_dict({key[7:]: value for key, value in state.items()}, strict=True)
    del state, checkpoint
    model.eval().to(device=device, dtype=precision)
    def validate_prediction(_module, _inputs, prediction):
        if not torch.isfinite(prediction).all().item():
            raise ValueError('DocRes produced non-finite model output before image conversion.')
    model.register_forward_hook(validate_prediction)
    parameters = sum(parameter.numel() for parameter in model.parameters())
    if args.device == 'mps':
        torch.mps.synchronize()
    load_ms = round((time.perf_counter() - load_started) * 1000, 2)

    namespace = {'cv2': cv2, 'np': np, 'torch': torch, 'DEVICE': device}
    functions_from(repo / 'data/preprocess/crop_merge_image.py', ['stride_integral'], namespace)
    mbd_details = {}
    if args.task == 'dewarping':
        if not args.mbd_weights:
            parser.error('Dewarping requires --mbd-weights.')
        from mbd import document_mask
        import types
        utility = {'np': np}
        functions_from(repo / 'utils.py', ['getBasecoord'], utility)
        namespace['utils'] = types.SimpleNamespace(getBasecoord=utility['getBasecoord'])
        def infer_mask(image, _upstream_path):
            mask, detail = document_mask(image, repo, args.mbd_weights.resolve(), device)
            mbd_details.update(detail)
            cv2.imwrite(str(output / 'images/mask.png'), mask)
            return mask
        namespace['net1_net2_infer_single_im'] = infer_mask
        functions_from(repo / 'inference.py', ['dewarp_prompt', 'dewarping'], namespace)
    else:
        prompt_name = 'deshadow_prompt' if args.task == 'deshadowing' else 'appearance_prompt'
        functions_from(repo / 'inference.py', [prompt_name, args.task], namespace, args.max_size)
    # CPU uses float32; MPS retains upstream float16. No spatial/pixel filter change.
    if args.device == 'cpu' and args.task != 'dewarping':
        source = ast.parse((repo / 'inference.py').read_text())
        task = next(node for node in source.body if isinstance(node, ast.FunctionDef) and node.name == args.task)
        class CpuPrecision(ast.NodeTransformer):
            def visit_Attribute(self, node):
                self.generic_visit(node)
                if node.attr == 'half':
                    node.attr = 'float'
                return node
            def visit_Assign(self, node):
                self.generic_visit(node)
                if any(isinstance(target, ast.Name) and target.id == 'MAX_SIZE' for target in node.targets):
                    node.value = ast.Constant(value=args.max_size)
                return node
        module = ast.fix_missing_locations(ast.Module(body=[CpuPrecision().visit(task)], type_ignores=[]))
        exec(compile(module, str(repo / 'inference.py'), 'exec'), namespace)

    output.mkdir(parents=True)
    (output / 'images').mkdir()
    print(json.dumps({'stage': 'inference', 'task': args.task, 'device': args.device, 'precision': str(precision),
                      'maxSize': args.max_size, 'parameters': parameters}), flush=True)
    inference_started = time.perf_counter()
    # Upstream function owns no_grad; preserve its exact task path.
    *_, bgr = namespace[args.task](model, str(original_path))
    if args.device == 'mps':
        torch.mps.synchronize()
    operation_ms = round((time.perf_counter() - inference_started) * 1000, 2)
    if bgr.shape != original.shape or bgr.dtype != np.uint8 or not np.isfinite(bgr).all():
        raise ValueError('DocRes changed image dimensions or returned invalid pixels.')
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    target = output / 'images/d.png'
    Image.fromarray(rgb).save(target)
    with Image.open(target) as image:
        image.verify()
    details = {'id': 'd', 'label': 'D · DocRes', 'image': 'images/d.png',
               'implementation': f'official DocRes {args.task}, inspected task functions with Mac adapter' + (' and official MBD inference' if args.task == 'dewarping' else ''),
               'sha256': digest(target), 'bytes': target.stat().st_size,
               'changedPixels': int(np.any(rgb != original, axis=2).sum()),
               'upstreamCommit': commit, 'inferenceSha256': digest(repo / 'inference.py'),
               'architectureSha256': digest(repo / 'models/restormer_arch.py'),
               'weightsUrl': WEIGHTS_URL, 'weightsSha256': digest(weights), 'checkpointBytes': weights.stat().st_size,
               'parameterCount': parameters, 'parameterBytesFp32': parameters * 4,
               'torchVersion': torch.__version__, 'opencvVersion': cv2.__version__,
               'device': args.device, 'precision': str(precision),
               'parameters': {'task': args.task, 'maxSize': 256 if args.task == 'dewarping' else args.max_size, 'upstreamDefaultMaxSize': 256 if args.task == 'dewarping' else 1600,
                              'geometryCorrection': args.task == 'dewarping', 'appearancePass': args.task == 'appearance',
                              'chainedTasks': False},
               'modelLoadMs': load_ms, 'operationMs': operation_ms,
               'timingScope': 'cold single task; decode, prompt, device transfer, inference and full-resolution reconstruction; MPS synchronized; no PNG encode',
               'peakProcessRssBytes': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == 'darwin' else 1024),
               'memoryScope': 'process high-water RSS, not total unified GPU memory',
               'totalScriptMs': round((time.perf_counter() - started) * 1000, 2)}
    if args.device == 'mps':
        details['mpsAllocatedAfterBytes'] = torch.mps.current_allocated_memory()
        details['mpsDriverAllocatedAfterBytes'] = torch.mps.driver_allocated_memory()
    if mbd_details:
        details['mbd'] = mbd_details
    for item in data['variants']:
        shutil.copyfile(base / item['image'], output / item['image'])
        if digest(output / item['image']) != item['sha256']:
            raise ValueError('Copied base variant changed.')
    shutil.copyfile(original_path, output / 'images/original.png')
    data['variants'].append(details)
    data['initialVariant'] = 'd'
    data['baseComparisonManifestSha256'] = manifest_hash
    data['baseOriginalFileSha256'] = original_hash
    data['limitations'] = ['single input example; no proof for arbitrary classroom photos',
                           'checkpoint from recorded mirror; no direct author-hosted hash available',
                           'timings have different scopes; not a speed ranking',
                           'DocRes process RSS measured, unified GPU peak not measured',
                           'experimental MPS/CPU adapter, no native app integration']
    data['docresEnvironment'] = {'platform': platform.platform(), 'python': platform.python_version()}
    for filename in ['index.html', 'viewer.css', 'viewer.js']:
        shutil.copyfile(HERE / filename, output / filename)
    if digest(manifest_path) != manifest_hash or digest(original_path) != original_hash:
        raise ValueError('Base comparison changed during inference.')
    (output / 'comparison.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'docres': details}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
