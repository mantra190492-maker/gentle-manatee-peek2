// src/lib/attachments.ts

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_WHITELIST = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'md', 'json', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'ppt', 'pptx'];

interface AttachmentMeta {
  name: string;
  sizeBytes?: number;
  mimeType?: string;
}

interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateAttachment(meta: AttachmentMeta): ValidationResult {
  const size = meta.sizeBytes ?? 0;
  const mime = (meta.mimeType || '').toLowerCase();
  const ext = meta.name.split('.').pop()?.toLowerCase();

  if (size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `Max file size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` };
  }

  if (mime.startsWith('audio/') || mime.startsWith('video/')) {
    return { ok: false, error: 'Audio and video files are not allowed.' };
  }

  // If mimeType is missing or generic, check extension whitelist
  if (!mime || mime === 'application/octet-stream') { // Common generic MIME type
    if (!ext || !EXT_WHITELIST.includes(ext)) {
      return { ok: false, error: 'This file type isn’t supported.' };
    }
  }

  return { ok: true };
}