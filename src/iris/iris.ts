import { uIOhook, UiohookKey } from 'uiohook-napi';
import { $ } from "bun";
import screenshot from 'screenshot-desktop';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export class IrisPipeline {
  private capturedImages: Buffer[] = [];
  private isListening: boolean = false;

  // Define a hook that index.ts can register
  public onExportComplete?: (pdfPath: string) => Promise<void> | void;

  // Define constant paths
  private readonly targetFolder = process.cwd();
  private readonly mainPdfName = 'exam_output.pdf';
  private readonly oldFolderName = 'old_pdfs';

  constructor() {
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  public start(): void {
    if (this.isListening) return;
    uIOhook.on('keydown', this.handleKeyPress);
    uIOhook.start();
    this.isListening = true;
    console.log('👁️  Argus: Iris pipeline active. Press F10 to capture, F11 to export.');
  }

  public stop(): void {
    if (!this.isListening) return;
    uIOhook.off('keydown', this.handleKeyPress);
    uIOhook.stop();
    this.isListening = false;
    console.log('👁️  Iris pipeline stopped.');
  }

  public async captureScreen(): Promise<void> {
    try {
      console.log('📸 Capturing screen...');
      const imgBuffer = await screenshot({ format: 'jpg' });
      this.capturedImages.push(imgBuffer);
      console.log(`✅ Page ${this.capturedImages.length} added to queue.`);

    } catch (error) {
      console.error('❌ Failed to capture screenshot:', error);
    }
  }

  /**
   * Manages the archive: checks if an older PDF exists and moves it to the 'old' folder with a timestamp.
   */
  private archiveExistingPDF(mainPdfPath: string): void {
    if (!fs.existsSync(mainPdfPath)) return;

    const oldFolderPath = path.join(this.targetFolder, this.oldFolderName);

    // Create the 'old' directory if it doesn't exist
    if (!fs.existsSync(oldFolderPath)) {
      fs.mkdirSync(oldFolderPath, { recursive: true });
    }

    // Generate a unique timestamp (YYYY-MM-DD_HH-MM-SS)
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-');

    const archivedPdfName = `exam_${timestamp}.pdf`;
    const archivedPdfPath = path.join(oldFolderPath, archivedPdfName);

    // Move the file to the archive directory
    fs.renameSync(mainPdfPath, archivedPdfPath);
    console.log(`📦 Archived previous PDF to: ${path.join(this.oldFolderName, archivedPdfName)}`);
  }

  public async exportToPDF(): Promise<void> {
    if (this.capturedImages.length === 0) {
      console.log('⚠️ No images captured yet. Nothing to export.');
      return;
    }

    const mainPdfPath = path.join(this.targetFolder, this.mainPdfName);

    try {
      // Archive step: clear the path for the fresh PDF file
      this.archiveExistingPDF(mainPdfPath);

      console.log(`📄 Generating fresh PDF from ${this.capturedImages.length} pages...`);
      const pdfDoc = await PDFDocument.create();

      for (const imgBuffer of this.capturedImages) {
        const image = await pdfDoc.embedJpg(imgBuffer);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(mainPdfPath, pdfBytes);

      console.log(`🎉 Success! Fresh PDF created at: ${mainPdfPath}`);
      this.clear();

      // TRIGGER THE CALLBACK: Hand off control to whoever is listening (index.ts)
      if (this.onExportComplete) {
        await this.onExportComplete(mainPdfPath);
      }
    } catch (error) {
      console.error('❌ Failed to export PDF:', error);
    }
  }

  public clear(): void {
    this.capturedImages = [];
    console.log('🧹 Iris cache cleared.');
  }

  private async handleKeyPress(event: any): Promise<void> {
    if (event.keycode === UiohookKey.F10) {
      await this.captureScreen().catch(console.error);
    } else if (event.keycode === UiohookKey.F11) {
      await this.exportToPDF().catch(console.error);
    }
  }
}
