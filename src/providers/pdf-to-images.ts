export async function pdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  let pdfjsLib: any;
  let createCanvas: any;

  try {
    pdfjsLib = await import('pdfjs-dist');
    const napiCanvas = await import('@napi-rs/canvas');
    createCanvas = napiCanvas.createCanvas;
  } catch {
    throw new Error(
      "OpenAI PDF→image conversion requires 'pdfjs-dist' and '@napi-rs/canvas'.\n" +
      "Install them: bun add pdfjs-dist @napi-rs/canvas\n" +
      "On Linux you may also need: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev"
    );
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const doc = await loadingTask.promise;
  const images: Buffer[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      const raw = canvas.toBuffer('image/png');
      images.push(Buffer.from(raw));
    }
  } finally {
    doc.destroy();
  }

  return images;
}
