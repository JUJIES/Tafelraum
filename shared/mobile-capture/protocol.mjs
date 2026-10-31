// Portable browser/Node contract. No archive paths, host credentials or persistence.
export const CAPTURE_LIMITS = Object.freeze({
  fileBytes: 20 * 1024 * 1024,
  encryptedBytes: 20 * 1024 * 1024 + 4096,
  sessionMs: 2 * 60 * 60 * 1000,
  transferMs: 90_000,
  pollMs: 15_000,
  receiverGraceMs: 25_000,
  sessions: 8,
  totalBytes: 64 * 1024 * 1024,
});
export const CAPTURE_TYPES = Object.freeze({
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
});
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
export const captureId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{22,80}$/.test(value);
export function toBase64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function fromBase64(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_encoding');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
}
export function newSecret() { return toBase64(crypto.getRandomValues(new Uint8Array(32))); }
export async function encryptCapture(secret, purpose, bytes) {
  const rawKey = fromBase64(secret);
  if (rawKey.length !== 32) throw new Error('invalid_key');
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:encoder.encode(purpose)}, key, bytes));
  const result = new Uint8Array(iv.length + ciphertext.length);
  result.set(iv); result.set(ciphertext, iv.length);
  return result;
}
export async function decryptCapture(secret, purpose, bytes) {
  if (bytes.length < 28) throw new Error('invalid_ciphertext');
  const rawKey = fromBase64(secret);
  if (rawKey.length !== 32) throw new Error('invalid_key');
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:bytes.subarray(0,12), additionalData:encoder.encode(purpose)}, key, bytes.subarray(12)));
}
export const jsonBytes = value => encoder.encode(JSON.stringify(value));
export const parseBytes = bytes => JSON.parse(decoder.decode(bytes));
export function packCapture(metadata, bytes) {
  if (!CAPTURE_TYPES[metadata?.mime] || !Number.isSafeInteger(bytes.length) || bytes.length < 1 || bytes.length > CAPTURE_LIMITS.fileBytes) throw new Error('unsupported_file');
  const capturedAt = metadata.capturedAt ?? Date.now();
  if (!Number.isSafeInteger(capturedAt) || capturedAt < 0 || capturedAt > 8_640_000_000_000_000) throw new Error('unsupported_file');
  const name=metadata.mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document' && typeof metadata.name==='string' ? metadata.name : undefined;
  if(name!==undefined && (!name.trim()||name.length>180||/[\\/\0]/.test(name)))throw new Error('unsupported_file');
  const header = jsonBytes({mime:metadata.mime,capturedAt,...(name?{name}:{})});
  const result = new Uint8Array(4 + header.length + bytes.length);
  new DataView(result.buffer).setUint32(0,header.length);
  result.set(header,4); result.set(bytes,4+header.length);
  return result;
}
export function unpackCapture(bytes) {
  if (bytes.length < 5 || bytes.length > CAPTURE_LIMITS.encryptedBytes) throw new Error('unsupported_file');
  const length = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0);
  if (length > 2048 || length + 4 >= bytes.length) throw new Error('unsupported_file');
  const metadata = parseBytes(bytes.subarray(4,4+length));
  const file = bytes.subarray(4+length);
  if (!CAPTURE_TYPES[metadata?.mime] || !Number.isSafeInteger(metadata.capturedAt) || metadata.capturedAt < 0 || metadata.capturedAt > 8_640_000_000_000_000 || file.length > CAPTURE_LIMITS.fileBytes || !file.length) throw new Error('unsupported_file');
  const starts = expected => expected.every((value,index) => file[index] === value);
  const valid = metadata.mime === 'image/jpeg' ? starts([255,216,255])
    : metadata.mime === 'image/png' ? starts([137,80,78,71,13,10,26,10])
    : metadata.mime === 'image/webp' ? decoder.decode(file.subarray(0,4)) === 'RIFF' && decoder.decode(file.subarray(8,12)) === 'WEBP'
    : metadata.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? starts([80,75,3,4])
    : starts([37,80,68,70,45]);
  if (!valid) throw new Error('unsupported_file');
  if(metadata.name!==undefined && (typeof metadata.name!=='string'||!metadata.name.trim()||metadata.name.length>180||/[\\/\0]/.test(metadata.name)))throw new Error('unsupported_file');
  return {mime:metadata.mime,capturedAt:metadata.capturedAt,bytes:file,...(metadata.name?{name:metadata.name}:{})};
}
