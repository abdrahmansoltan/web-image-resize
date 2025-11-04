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
    const img = await this.loadImage(file);
    const { w, h } = this.getScaledSize(img.width, img.height, maxSize);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const p = pica();
    await p.resize(img, canvas, {
      quality: 2, // Medium quality for better compression (was 3)
      unsharpAmount: 20, // Reduced from 80 to minimize file size increase
      unsharpRadius: 0.3, // Reduced from 0.6
      unsharpThreshold: 5, // Increased from 2 to be less aggressive
    });

    // Use slightly lower JPEG quality for Pica since it produces better quality at lower settings
    const blob = await p.toBlob(canvas, 'image/jpeg', quality);

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  }
}
