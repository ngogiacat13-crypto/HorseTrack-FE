export const MAX_UPLOAD_MB = 4;
const MAX_PICK_MB = 25;
const IMAGE_TARGET_BYTES = 3.5 * 1048576;
const IMAGE_MAX_SIDE = 2400;
const MIN_KB = 5;
const SIGNATURES: { ext: RegExp; bytes: number[]; kind: 'PDF' | 'PNG' | 'JPG' }[] = [
  { ext: /\.pdf$/i, bytes: [0x25, 0x50, 0x44, 0x46], kind: 'PDF' },
  { ext: /\.png$/i, bytes: [0x89, 0x50, 0x4e, 0x47], kind: 'PNG' },
  { ext: /\.jpe?g$/i, bytes: [0xff, 0xd8, 0xff], kind: 'JPG' },
];

const contentKind = async (f: File) => {
  const sig = SIGNATURES.find((s) => s.ext.test(f.name));
  if (!sig) return null;
  const head = new Uint8Array(await f.slice(0, sig.bytes.length).arrayBuffer());
  return sig.bytes.every((b, i) => head[i] === b) ? sig.kind : null;
};

const loadImage = (f: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
  img.src = url;
});

const shrinkImage = async (f: File) => {
  const img = await loadImage(f);
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= IMAGE_TARGET_BYTES) return new File([blob], f.name.replace(/\.(png|jpe?g)$/i, '.jpg'), { type: 'image/jpeg' });
  }
  return null;
};

export const needsShrink = (f: File) => f.size > MAX_UPLOAD_MB * 1048576 && /\.(png|jpe?g)$/i.test(f.name);

export const prepareDoc = async (picked: File, label: string): Promise<File> => {
  if (!/\.(pdf|jpe?g|png)$/i.test(picked.name)) throw new Error(`${label}: chỉ nhận PDF, JPG hoặc PNG.`);
  if (picked.size > MAX_PICK_MB * 1048576) throw new Error(`${label}: tệp quá lớn (tối đa ${MAX_PICK_MB} MB trước khi nén).`);
  if (picked.size < MIN_KB * 1024) throw new Error(`${label}: tệp quá nhỏ (dưới ${MIN_KB} KB) — có thể bị lỗi hoặc không đọc được, hãy chụp/quét lại và gửi lại.`);
  const kind = await contentKind(picked);
  if (!kind) throw new Error(`${label}: nội dung tệp không phải PDF/JPG/PNG thật (có thể đổi đuôi hoặc tệp hỏng) — hãy gửi lại giấy tờ hợp lệ.`);
  if (picked.size <= MAX_UPLOAD_MB * 1048576) return picked;
  if (kind === 'PDF') throw new Error(`${label}: PDF tối đa ${MAX_UPLOAD_MB} MB — hãy nén PDF hoặc chụp giấy tờ thành ảnh JPG.`);
  const small = await shrinkImage(picked).catch(() => null);
  if (!small) throw new Error(`${label}: không nén được ảnh xuống dưới ${MAX_UPLOAD_MB} MB — hãy chụp lại với độ phân giải thấp hơn.`);
  return small;
};
