/**
 * Shared PDF.js setup — import this once anywhere pdfjs is used.
 * The worker is served from /public/pdf.worker.min.js (static asset).
 */
import * as pdfjs from 'pdfjs-dist';

// Only set once
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;
}

export { pdfjs };

/** Extract page count from an ArrayBuffer without a second copy */
export async function getPdfInfo(buffer: ArrayBuffer): Promise<{ numPages: number; title: string | null }> {
  const task = pdfjs.getDocument({ data: buffer.slice(0) });
  const doc = await task.promise;
  const numPages = doc.numPages;
  let title: string | null = null;
  try {
    const meta = await doc.getMetadata();
    const info = meta.info as Record<string, unknown>;
    if (typeof info.Title === 'string' && info.Title.trim()) {
      title = info.Title.trim();
    }
  } catch { /* ignore */ }
  doc.destroy();
  return { numPages, title };
}
