/**
 * Central resume file utility — client-side only.
 * Converts a File object to a clean base64 string (no data-URL prefix)
 * and validates type + size before sending to API.
 */

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const MAX_SIZE_MB = 5;

/**
 * Validate a resume File. Returns { ok, error } .
 */
export function validateResumeFile(file) {
  if (!file) return { ok: false, error: 'No file selected.' };
  if (!ALLOWED_TYPES[file.type]) {
    return { ok: false, error: 'Please upload a PDF, DOC, or DOCX file.' };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { ok: false, error: `File must be under ${MAX_SIZE_MB}MB.` };
  }
  return { ok: true };
}

/**
 * Read a File as a base64 string WITHOUT the data-URL prefix.
 * Uses readAsDataURL → strips "data:...;base64," prefix reliably.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result;
      // Always strip the prefix — works for PDF, DOC, DOCX
      const base64 = dataUrl.split(',')[1];
      if (!base64) reject(new Error('Failed to read file as base64'));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader error'));
  });
}

/**
 * Full pipeline: validate → read → call /api/parse-resume → return { profile, resumeText, resumeBase64, fileName }.
 * Throws on any failure with a user-friendly message.
 */
export async function parseResumeFile(file) {
  const validation = validateResumeFile(file);
  if (!validation.ok) throw new Error(validation.error);

  const base64 = await fileToBase64(file);
  const fileExt = ALLOWED_TYPES[file.type];

  const res = await fetch('/api/parse-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_base64: base64, file_type: fileExt, file_name: file.name }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Resume reading failed. Please try a different file.');
  }

  const data = await res.json();
  return { ...data, resumeBase64: base64, fileName: file.name };
}
