type InternalImageCopy = {
  lessonId: string;
  sceneText: string;
};

type InternalImageClipboard = InternalImageCopy & {
  fingerprint: Promise<string | null>;
};

let internalImageClipboard: InternalImageClipboard | null = null;

async function fingerprintImage(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Keeps the editable representation in this running app without exposing it as
 * text/plain to other applications. The exported PNG remains the only system
 * clipboard representation.
 */
export function rememberInternalImageCopy(copy: InternalImageCopy, image: Promise<Blob>) {
  internalImageClipboard = {
    ...copy,
    fingerprint: image.then(fingerprintImage).catch(() => null),
  };
}

/** Returns editable scene data only while the system clipboard still contains the exact exported PNG. */
export async function internalSceneForPastedImage(image: Blob): Promise<InternalImageCopy | null> {
  const remembered = internalImageClipboard;
  if (!remembered) return null;

  const [expected, actual] = await Promise.all([
    remembered.fingerprint,
    fingerprintImage(image).catch(() => null),
  ]);
  if (remembered !== internalImageClipboard || !expected || expected !== actual) return null;
  return { lessonId: remembered.lessonId, sceneText: remembered.sceneText };
}

export function clearInternalImageCopyForTest() {
  internalImageClipboard = null;
}
