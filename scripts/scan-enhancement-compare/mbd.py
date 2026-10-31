"""Mac adapter for the pinned DocRes MBD inference (no change to prediction math)."""
import hashlib
import importlib
from pathlib import Path
import sys
import types

MBD_SHA = '7c2dc15a6b0e613adf7c3a794891f44caef544b92c5898ac610ae689e9cd9085'


def document_mask(image, repo, weights, device):
    import cv2
    import numpy as np
    import torch
    import torch.nn.functional as F
    if hashlib.sha256(Path(weights).read_bytes()).hexdigest() != MBD_SHA:
        raise ValueError('Unexpected MBD checkpoint hash.')
    # Only DeepLab is needed; the upstream model collection __init__ imports
    # unrelated training architectures and torchvision. Use its package path.
    package = types.ModuleType('model')
    package.__path__ = [str(Path(repo) / 'data/MBD/model')]
    sys.modules['model'] = package
    architecture = importlib.import_module('model.deep_lab_model.deeplab')
    model = architecture.DeepLab(num_classes=1, backbone='resnet', output_stride=16,
                                 sync_bn=None, freeze_bn=False)
    checkpoint = torch.load(weights, map_location='cpu', weights_only=True)
    state = checkpoint['model_state']
    if not all(key.startswith('module.') for key in state):
        raise ValueError('Unexpected MBD state keys.')
    model.load_state_dict({key[7:]: value for key, value in state.items()}, strict=True)
    del checkpoint, state
    model.eval().to(device)
    height, width = image.shape[:2]
    prepared = cv2.resize(image, (448, 448))
    prepared = cv2.GaussianBlur(prepared, (15, 15), 0, 0)
    prepared = cv2.cvtColor(prepared, cv2.COLOR_BGR2RGB)
    prepared = torch.from_numpy((prepared.astype(float) / 255).transpose(2, 0, 1)[None]).float().to(device)
    with torch.no_grad():
        pred = model(prepared)
        if not torch.isfinite(pred).all().item():
            raise ValueError('Non-finite MBD prediction.')
        mask = F.interpolate(pred[:, 0, :, :].unsqueeze(1), (height, width))
        mask = (mask[0, 0].cpu().numpy() * 255).astype(np.uint8)
    kernel = np.ones((3, 3))
    mask = cv2.dilate(mask, kernel, iterations=3)
    mask = cv2.erode(mask, kernel, iterations=3)
    mask[mask > 100] = 255
    mask[mask < 100] = 0
    return mask, {'weightsSha256': MBD_SHA, 'checkpointBytes': Path(weights).stat().st_size,
                  'parameters': sum(parameter.numel() for parameter in model.parameters()),
                  'inputSize': 448, 'device': str(device), 'precision': 'torch.float32',
                  'foregroundFraction': float(np.mean(mask != 0))}
