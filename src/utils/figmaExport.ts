// Figma export utilities
import html2canvas from 'html2canvas';

export interface ScreenCapture {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  dataUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface FigmaExportOptions {
  format: 'png' | 'svg' | 'pdf';
  quality: number;
  scale: number;
  includeInteractions: boolean;
}

export class FigmaExporter {
  private captures: ScreenCapture[] = [];

  async captureScreen(
    elementSelector: string, 
    screenName: string, 
    description: string = ''
  ): Promise<ScreenCapture> {
    const element = document.querySelector(elementSelector) as HTMLElement;
    if (!element) {
      throw new Error(`Element not found: ${elementSelector}`);
    }

    // Use html2canvas for reliable screen capture
    const canvas = await html2canvas(element, {
      scale: window.devicePixelRatio || 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      imageTimeout: 0,
      logging: false
    });

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const rect = element.getBoundingClientRect();

    const capture: ScreenCapture = {
      id: `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: screenName,
      description,
      timestamp: new Date().toISOString(),
      dataUrl,
      dimensions: {
        width: rect.width,
        height: rect.height
      }
    };

    this.captures.push(capture);
    return capture;
  }

  getAllCaptures(): ScreenCapture[] {
    return [...this.captures];
  }

  getCapture(id: string): ScreenCapture | undefined {
    return this.captures.find(c => c.id === id);
  }

  removeCapture(id: string): boolean {
    const index = this.captures.findIndex(c => c.id === id);
    if (index > -1) {
      this.captures.splice(index, 1);
      return true;
    }
    return false;
  }

  clearAllCaptures(): void {
    this.captures = [];
  }

  async exportToFigma(captures: ScreenCapture[], options: FigmaExportOptions): Promise<Blob> {
    // Create a comprehensive export package
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        appName: 'D2D Satış Uygulaması',
        version: '1.0.0',
        totalScreens: captures.length,
        options
      },
      screens: captures.map(capture => ({
        ...capture,
        figmaReady: true,
        exportFormat: options.format
      }))
    };

    // Create ZIP-like structure for Figma import
    const figmaPackage = {
      ...exportData,
      figmaImportInstructions: [
        '1. Figma\'da yeni bir dosya oluşturun',
        '2. File > Import > Choose files seçin',
        '3. Bu paketteki PNG dosyalarını sürükleyip bırakın',
        '4. Her ekran otomatik olarak ayrı frame\'e yerleştirilecek'
      ]
    };

    const jsonBlob = new Blob([JSON.stringify(figmaPackage, null, 2)], {
      type: 'application/json'
    });

    return jsonBlob;
  }

  downloadCapture(capture: ScreenCapture, filename?: string): void {
    const link = document.createElement('a');
    link.download = filename || `${capture.name}_${capture.id}.png`;
    link.href = capture.dataUrl;
    link.click();
  }

  downloadAllAsZip(captures: ScreenCapture[]): void {
    // Simple implementation - in production you'd use JSZip
    captures.forEach((capture, index) => {
      setTimeout(() => {
        this.downloadCapture(capture, `screen_${index + 1}_${capture.name}.png`);
      }, index * 500); // Stagger downloads
    });
  }
}

// Global instance
export const figmaExporter = new FigmaExporter();