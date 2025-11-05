import { Injectable } from '@angular/core';
import pica from 'pica';

@Injectable({ providedIn: 'root' })
export class ImageResizeService {
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private getScaledSize(width: number, height: number, maxSize: number) {
    const scale = Math.min(maxSize / width, maxSize / height);
    return { w: Math.round(width * scale), h: Math.round(height * scale) };
  }

  async resizeWithCanvas(file: File, maxSize = 768, quality = 0.9): Promise<File> {
    const img = await this.loadImage(file);
    const { w, h } = this.getScaledSize(img.width, img.height, maxSize);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    // @ts-ignore
    if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), 'image/jpeg', quality)
    );

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  }

  async resizeWithPica(file: File, maxSize = 768, quality = 0.8): Promise<File> {
    console.log('Pica resize: Starting with maxSize:', maxSize, 'quality:', quality);
    const img = await this.loadImage(file);
    const { w, h } = this.getScaledSize(img.width, img.height, maxSize);
    console.log('Pica resize: Original dimensions:', img.width, 'x', img.height);
    console.log('Pica resize: Scaled dimensions:', w, 'x', h);

    // Create source canvas from the image
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = img.width;
    sourceCanvas.height = img.height;
    const sourceCtx = sourceCanvas.getContext('2d')!;
    sourceCtx.drawImage(img, 0, 0);

    // Create destination canvas
    const destCanvas = document.createElement('canvas');
    destCanvas.width = w;
    destCanvas.height = h;

    // Use Pica to resize
    const p = pica();
    await p.resize(sourceCanvas, destCanvas, {
      quality: 2, // Medium quality (0=lowest, 3=highest)
      unsharpAmount: 20,
      unsharpRadius: 0.3,
      unsharpThreshold: 5,
    });

    // Convert to blob
    const blob = await p.toBlob(destCanvas, 'image/jpeg', quality);

    console.log('Pica resize: Output blob size:', (blob.size / 1024).toFixed(1), 'KB');
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  }
}
