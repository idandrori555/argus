import { uIOhook, UiohookKey } from 'uiohook-napi';
import screenshot from 'screenshot-desktop';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

export class IrisPipeline {
  private capturedImages: Buffer[] = [];
  private isListening: boolean = false;

  constructor() {
    // Bind methods to maintain 'this' context when passed as callbacks
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  /**
   * Starts listening globally for F10 and F11 keys.
   */
  public start(): void {
    if (this.isListening) return;

    uIOhook.on('keydown', this.handleKeyPress);
    uIOhook.start();
    this.isListening = true;
    console.log('👁️  Argus: Iris pipeline active. Press F10 to capture, F11 to export.');
  }

  /**
   * Stops the global listener and clears the session.
   */
  public stop(): void {
    if (!this.isListening) return;

    uIOhook.off('keydown', this.handleKeyPress);
    uIOhook.stop();
    this.isListening = false;
    console.log('👁️  Iris pipeline stopped.');
  }

  /**
   * Captures the current screen and stores it in memory.
   */
  public async captureScreen(): Promise<void> {
    try {
      console.log('📸 Capturing screen...');
      // Captures the primary monitor as a JPEG buffer
      const imgBuffer = await screenshot({ format: 'jpeg' });

      this.capturedImages.push(imgBuffer);
      console.log(`✅ Page ${this.capturedImages.length} added to queue.`);
    } catch (error) {
      console.error('❌ Failed to capture screenshot:', error);
    }
  }

  /**
   * Compiles all captured screenshots into a single PDF file.
   */
  public async exportToPDF(outputPath: string = 'exam_output.pdf'): Promise<void> {
    if (this.capturedImages.length === 0) {
      console.log('⚠️ No images captured yet. Nothing to export.');
      return;
    }

    try {
      console.log(`📄 Generating PDF from ${this.capturedImages.length} pages...`);
      const pdfDoc = await PDFDocument.create();

      for (const imgBuffer of this.capturedImages) {
        // Embed the JPEG into the PDF document
        const image = await pdfDoc.embedJpg(imgBuffer);

        // Add a new page matching the exact dimensions of the screenshot
        const page = pdfDoc.addPage([image.width, image.height]);

        // Draw the image to fill the entire page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      // Save the PDF file to disk
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);

      console.log(`🎉 Success! PDF exported to: ${outputPath}`);

      // Reset state for the next exam
      this.clear();
    } catch (error) {
      console.error('❌ Failed to export PDF:', error);
    }
  }

  /**
   * Clears the current session data.
   */
  public clear(): void {
    this.capturedImages = [];
    console.log('🧹 Iris cache cleared.');
  }

  /**
   * Returns the count of currently captured images.
   */
  public getPageCount(): number {
    return this.capturedImages.length;
  }

  /**
   * Internal router for global key events.
   */
  private async handleKeyPress(event: any): Promise<void> {
    if (event.keycode === UiohookKey.F10) {
      await this.captureScreen();
    } else if (event.keycode === UiohookKey.F11) {
      await this.exportToPDF();
    }
  }
}
