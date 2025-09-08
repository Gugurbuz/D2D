// Figma export utilities
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

    // Create canvas for high-quality capture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Get element dimensions
    const rect = element.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    // Capture using html2canvas-like approach
    const dataUrl = await this.elementToDataUrl(element, {
      width: rect.width,
      height: rect.height,
      scale: scale
    });

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

  private async elementToDataUrl(
    element: HTMLElement, 
    options: { width: number; height: number; scale: number }
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');

    canvas.width = options.width * options.scale;
    canvas.height = options.height * options.scale;
    ctx.scale(options.scale, options.scale);

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);

    // Create SVG representation
    const svgData = this.elementToSvg(element, options.width, options.height);
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png', 0.95));
      };
      img.onerror = reject;
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    });
  }

  private elementToSvg(element: HTMLElement, width: number, height: number): string {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor || '#ffffff';
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="
            width: ${width}px;
            height: ${height}px;
            background: ${backgroundColor};
            font-family: ${styles.fontFamily};
            font-size: ${styles.fontSize};
            color: ${styles.color};
          ">
            ${element.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;
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