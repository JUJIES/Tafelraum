const fullRotation = Math.PI * 2;
const fineRotationSnap = Math.PI / 12;
const rightAngleRotationSnap = Math.PI / 2;
const rightAngleRotationSnapThreshold = 4 * Math.PI / 180;

function normalizeRotation(angle: number) {
  const normalized = angle % fullRotation;
  if (Object.is(normalized, -0) || Math.abs(normalized) < Number.EPSILON * 10) return 0;
  return normalized < 0 ? normalized + fullRotation : normalized;
}

export function snapImageRotation(angle: number, useFineGrid: boolean) {
  if (useFineGrid) {
    return normalizeRotation(Math.round(angle / fineRotationSnap) * fineRotationSnap);
  }

  const nearestRightAngle = Math.round(angle / rightAngleRotationSnap) * rightAngleRotationSnap;
  return Math.abs(angle - nearestRightAngle) <= rightAngleRotationSnapThreshold
    ? normalizeRotation(nearestRightAngle)
    : normalizeRotation(angle);
}
