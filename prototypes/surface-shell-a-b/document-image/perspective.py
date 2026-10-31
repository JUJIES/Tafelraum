"""Deterministic four-point perspective correction; no neural inference."""
import math


def rectify_pair(source, enhanced, quad):
    import cv2
    import numpy as np
    if source.shape != enhanced.shape:
        raise ValueError('Source and enhanced image dimensions differ.')
    if not isinstance(quad, list) or len(quad) != 4:
        raise ValueError('Four corners required.')
    try:
        points = np.array([[p['x'], p['y']] for p in quad], dtype=np.float64)
    except (KeyError, TypeError, ValueError):
        raise ValueError('Invalid corners.')
    if points.shape != (4, 2) or not np.isfinite(points).all() or np.min(points) < 0 or np.max(points) > 1:
        raise ValueError('Corners outside image.')
    for i in range(4):
        a, b, c = points[i], points[(i+1) % 4], points[(i+2) % 4]
        ab, bc = b-a, c-b
        if ab[0]*bc[1]-ab[1]*bc[0] <= 0.00001:
            raise ValueError('Corners cross or form a degenerate quadrilateral.')
    height, width = source.shape[:2]
    points *= (width-1, height-1)
    top, right, bottom, left = [float(np.linalg.norm(points[(i+1) % 4]-points[i])) for i in range(4)]
    target_width, target_height = math.ceil(max(top, bottom))+1, math.ceil(max(left, right))+1
    if min(target_width, target_height) < 8:
        raise ValueError('Selected document is too small.')
    # Perspective diagonal edge lengths may exceed a source axis. Keep the same
    # bounded image budget without inventing an A4 aspect ratio.
    scale = min(1, 10000/max(target_width, target_height), math.sqrt(16_000_000/(target_width*target_height)))
    target_width, target_height = max(8, int(target_width*scale)), max(8, int(target_height*scale))
    destination = np.float32([[0,0],[target_width-1,0],[target_width-1,target_height-1],[0,target_height-1]])
    transform = cv2.getPerspectiveTransform(points.astype(np.float32), destination)
    if not np.isfinite(transform).all() or np.linalg.cond(transform) > 1e12:
        raise ValueError('Unstable perspective transform.')
    def warp(image):
        return cv2.warpPerspective(image, transform, (target_width,target_height),
                                   flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return warp(source), warp(enhanced)
