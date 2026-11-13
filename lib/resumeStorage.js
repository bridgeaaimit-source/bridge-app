// Firestore documents are limited to 1 MiB. The resume PDF is stored inline as a
// data URL, so large PDFs made the whole profile update fail. Keep it inline only
// when it clearly fits; otherwise store the file name and let the student
// re-upload in the session that needs it.
export const MAX_INLINE_RESUME_CHARS = 900000; // about a 650 KB PDF

export function resumeFieldsForFirestore(fileName, dataUrl) {
  const fits = typeof dataUrl === 'string' && dataUrl.length <= MAX_INLINE_RESUME_CHARS;
  return {
    resumeUploaded: true,
    resumeFileName: fileName,
    resumeStoredInline: fits,
    ...(fits ? { resumeBase64: dataUrl } : {}),
  };
}
