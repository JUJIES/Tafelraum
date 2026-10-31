"""Make three real local comparison images. Does not change Tafelraum or its archive."""
import argparse
import ctypes
import ctypes.util
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import time

import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
Image.MAX_IMAGE_PIXELS = 30_000_000


def sha(data):
    return hashlib.sha256(data).hexdigest()


def baseline(rgb, node):
    rgba = np.concatenate([rgb, np.full((*rgb.shape[:2], 1), 255, dtype=np.uint8)], axis=2)
    started = time.perf_counter()
    result = subprocess.run(
        [node, '--experimental-strip-types', str(HERE / 'baseline.mjs')],
        input=rgba.tobytes(), capture_output=True, check=True, timeout=120,
    )
    if len(result.stdout) != rgba.nbytes:
        raise RuntimeError('Baseline returned an unexpected byte count.')
    output = np.frombuffer(result.stdout, dtype=np.uint8).reshape(rgba.shape)
    if not np.all(output[:, :, 3] == 255):
        raise RuntimeError('Baseline changed opacity.')
    return output[:, :, :3], {
        'implementation': 'exact production enhanceScanPixels',
        'sourceSha256': sha((ROOT / 'prototypes/surface-shell-a-b/src/canvas/scan-enhancement.ts').read_bytes()),
        'node': subprocess.check_output([node, '--version'], text=True).strip(),
        'operationMs': round((time.perf_counter() - started) * 1000, 2),
        'timingScope': 'includes Node process startup and raw-pixel IPC',
    }


def opencv(rgb):
    import cv2
    started = time.perf_counter()
    height, width = rgb.shape[:2]
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    light = lab[:, :, 0].astype(np.float32)
    ratio = min(1.0, 1200 / max(height, width))
    small = cv2.resize(light, None, fx=ratio, fy=ratio, interpolation=cv2.INTER_AREA)
    # Estimate the slowly changing paper illumination, then lift dim regions.
    paper = cv2.morphologyEx(small, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    paper = cv2.GaussianBlur(paper, (0, 0), 10)
    paper = cv2.resize(paper, (width, height), interpolation=cv2.INTER_LINEAR)
    gain = np.clip(245.0 / np.maximum(paper, 32), 1.0, 1.65)
    corrected = np.clip(light * (1 + (gain - 1) * 0.8), 0, 255).astype(np.uint8)
    local = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8)).apply(corrected)
    lab[:, :, 0] = np.clip(corrected.astype(np.float32) * 0.85 + local.astype(np.float32) * 0.15, 0, 255).astype(np.uint8)
    output = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return output, {
        'implementation': 'opencv-paper-light-v1', 'opencvVersion': cv2.__version__,
        'parameters': {'backgroundMaxSide': 1200, 'closingKernel': 31, 'backgroundSigma': 10,
                       'paperTarget': 245, 'maximumGain': 1.65, 'illuminationBlend': 0.8,
                       'claheClip': 1.5, 'claheGrid': [8, 8], 'claheBlend': 0.15},
        'operationMs': round((time.perf_counter() - started) * 1000, 2),
        'timingScope': 'already imported OpenCV; no file decoding/encoding',
    }


def leptonica(input_png, output_png, library):
    name = library or ctypes.util.find_library('leptonica') or ctypes.util.find_library('lept')
    if not name:
        raise RuntimeError('Leptonica missing. Supply --leptonica /path/to/library.')
    lib = ctypes.CDLL(name)
    pointer = ctypes.c_void_p
    lib.pixRead.argtypes = [ctypes.c_char_p]; lib.pixRead.restype = pointer
    lib.pixCleanBackgroundToWhite.argtypes = [pointer, pointer, pointer, ctypes.c_float, ctypes.c_int, ctypes.c_int]
    lib.pixCleanBackgroundToWhite.restype = pointer
    lib.pixWrite.argtypes = [ctypes.c_char_p, pointer, ctypes.c_int]; lib.pixWrite.restype = ctypes.c_int
    lib.pixDestroy.argtypes = [ctypes.POINTER(pointer)]; lib.pixDestroy.restype = None
    lib.getLeptonicaVersion.restype = pointer
    lib.lept_free.argtypes = [pointer]; lib.lept_free.restype = None
    version_pointer = lib.getLeptonicaVersion()
    try:
        version = ctypes.string_at(version_pointer).decode()
    finally:
        lib.lept_free(version_pointer)
    source = pointer(lib.pixRead(os.fsencode(input_png)))
    if not source.value:
        raise RuntimeError('Leptonica could not decode the normalized PNG.')
    output = pointer()
    try:
        started = time.perf_counter()
        # Upstream documented cleanup defaults, preserving RGB output.
        output = pointer(lib.pixCleanBackgroundToWhite(source, None, None, 1.0, 70, 190))
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        if not output.value or lib.pixWrite(os.fsencode(output_png), output, 3) != 0:
            raise RuntimeError('Leptonica cleanup failed.')
    finally:
        if output.value:
            lib.pixDestroy(ctypes.byref(output))
        lib.pixDestroy(ctypes.byref(source))
    with Image.open(output_png) as image:
        result = np.array(image.convert('RGB'))
    return result, {
        'implementation': 'pixCleanBackgroundToWhite', 'leptonicaVersion': version,
        'parameters': {'gamma': 1.0, 'blackValue': 70, 'whiteValue': 190},
        'operationMs': elapsed, 'timingScope': 'cleanup only, already loaded library and decoded PIX',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--label', default='Handschriftliche Seite')
    parser.add_argument('--source-url')
    parser.add_argument('--source-credit')
    parser.add_argument('--node', default=shutil.which('node'))
    parser.add_argument('--leptonica')
    args = parser.parse_args()
    source = args.input.resolve(strict=True)
    output = args.output.resolve()
    if not output.is_relative_to(ROOT / 'output'):
        parser.error('Comparison output must stay under the ignored repository output/ directory.')
    if output.exists():
        parser.error('Use a fresh output directory; existing comparisons are not replaced.')
    if not args.node:
        parser.error('Node >=22 with type stripping is required for the exact baseline.')
    source_hash = sha(source.read_bytes())
    with Image.open(source) as image:
        oriented = ImageOps.exif_transpose(image)
        if oriented.width * oriented.height > 30_000_000:
            parser.error('Image exceeds 30 megapixels.')
        # Share exactly one RGB decode and orientation across all candidates.
        rgb = np.array(oriented.convert('RGB'))
    output.mkdir(parents=True)
    images = output / 'images'; images.mkdir()
    normalized = images / 'original.png'
    Image.fromarray(rgb).save(normalized)
    variants = []
    methods = [('a', 'A · Bisherig', lambda: baseline(rgb, args.node)),
               ('b', 'B · OpenCV', lambda: opencv(rgb)),
               ('c', 'C · Leptonica', lambda: leptonica(normalized, images / 'c.png', args.leptonica))]
    for key, label, run in methods:
        pixels, details = run()
        if pixels.shape != rgb.shape or pixels.dtype != np.uint8:
            raise RuntimeError(f'{label}: dimensions or pixel format changed.')
        target = images / f'{key}.png'
        Image.fromarray(pixels).save(target)
        with Image.open(target) as check:
            check.verify()
        changed = np.any(pixels != rgb, axis=2)
        variants.append({'id': key, 'label': label, 'image': f'images/{key}.png',
                         'sha256': sha(target.read_bytes()), 'bytes': target.stat().st_size,
                         'changedPixels': int(changed.sum()), **details})
    if sha(source.read_bytes()) != source_hash:
        raise RuntimeError('Source changed while comparison was running.')
    if len({item['sha256'] for item in variants}) != 3:
        raise RuntimeError('The three methods did not produce distinct files.')
    manifest = {'format': 'tafelraum-scan-comparison-v1', 'label': args.label,
                'width': rgb.shape[1], 'height': rgb.shape[0], 'original': 'images/original.png',
                'sourceSha256': source_hash, 'sourceUrl': args.source_url,
                'sourceCredit': args.source_credit, 'normalizedPixelSha256': sha(rgb.tobytes()),
                'sourceUnchanged': True, 'variants': variants,
                'environment': {'platform': platform.platform(), 'python': platform.python_version(), 'numpy': np.__version__},
                'limitations': ['single document, user decision pending', 'no AI method included',
                               'timings have different scopes; not a speed ranking', 'memory not measured',
                               'Python OpenCV result; browser/WASM integration not tested']}
    (output / 'comparison.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    for filename in ['index.html', 'viewer.css', 'viewer.js']:
        shutil.copyfile(HERE / filename, output / filename)
    print(json.dumps({'output': str(output), 'variants': 3, 'sourceUnchanged': True}))


if __name__ == '__main__':
    main()
