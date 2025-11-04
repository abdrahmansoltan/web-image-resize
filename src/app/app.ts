import { Component } from '@angular/core';
import { ImageResizeService } from './services/image-resize';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: false,
})
export class App {
  method: 'canvas' | 'pica' = 'canvas';
  originalURL?: string;
  resizedURL?: string;
  info = '';
  isLoading = false;
  resizeSize = 768;

  // New properties for better display
  fileName = '';
  originalSize = '';
  resizedSize = '';
  compressionRatio = 0;
  duration = '';
  originalDimensions = '';
  resizedDimensions = '';

  constructor(private resizer: ImageResizeService) {}

  private selectedFile?: File;

  private async getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = url;
    });
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Clean up previous URLs
    if (this.originalURL) {
      URL.revokeObjectURL(this.originalURL);
    }
    if (this.resizedURL) {
      URL.revokeObjectURL(this.resizedURL);
    }

    // Reset previous results
    this.resizedURL = undefined;
    this.info = '';
    this.resizedDimensions = '';
    this.resizedSize = '';
    this.compressionRatio = 0;
    this.duration = '';

    this.selectedFile = file;
    this.fileName = file.name;
    this.originalSize = (file.size / 1024).toFixed(1);

    // Create URL and wait a bit to ensure it's ready
    this.originalURL = URL.createObjectURL(file);
    console.log('Created original URL:', this.originalURL);

    // Wait for the image to be ready and get dimensions
    try {
      const originalDims = await this.getImageDimensions(this.originalURL);
      this.originalDimensions = `${originalDims.width} × ${originalDims.height}`;
      console.log('Original dimensions:', this.originalDimensions);
    } catch (error) {
      console.error('Error getting original image dimensions:', error);
      this.originalDimensions = 'Unknown';
    }
  }

  onOriginalImageLoad(event: Event) {
    console.log('Original image loaded successfully', event);
  }

  onResizedImageLoad(event: Event) {
    console.log('Resized image loaded successfully', event);
  }

  onImageError(event: Event, imageType: 'original' | 'resized') {
    console.error(`${imageType} image failed to load`, event);
  }

  onMethodChange() {
    // Reset resized image and results when method changes
    if (this.resizedURL) {
      URL.revokeObjectURL(this.resizedURL);
      this.resizedURL = undefined;
    }

    // Reset all resize-related data
    this.info = '';
    this.resizedDimensions = '';
    this.resizedSize = '';
    this.compressionRatio = 0;
    this.duration = '';

    console.log(`Method changed to: ${this.method}`);
  }

  async onResize() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    const start = performance.now();

    try {
      console.log(`Starting resize with ${this.method.toUpperCase()} method`);
      console.log(`Original file size: ${(this.selectedFile.size / 1024).toFixed(1)} KB`);
      console.log(`Target max size: ${this.resizeSize}px`);

      const resizedFile =
        this.method === 'pica'
          ? await this.resizer.resizeWithPica(this.selectedFile, this.resizeSize)
          : await this.resizer.resizeWithCanvas(this.selectedFile, this.resizeSize);

      const processingTime = (performance.now() - start).toFixed(1);
      this.resizedURL = URL.createObjectURL(resizedFile);

      // Get resized image dimensions
      const resizedDims = await this.getImageDimensions(this.resizedURL);
      this.resizedDimensions = `${resizedDims.width} × ${resizedDims.height}`;

      // Calculate stats
      const originalSizeKB = this.selectedFile.size / 1024;
      const resizedSizeKB = resizedFile.size / 1024;

      console.log(`Resized file size: ${resizedSizeKB.toFixed(1)} KB`);
      console.log(
        `Size change: ${resizedSizeKB > originalSizeKB ? '+' : ''}${(
          resizedSizeKB - originalSizeKB
        ).toFixed(1)} KB`
      );

      this.resizedSize = resizedSizeKB.toFixed(1);
      this.compressionRatio = Math.round(((originalSizeKB - resizedSizeKB) / originalSizeKB) * 100);
      this.duration = processingTime;

      this.info = `Processing complete`;
    } catch (error) {
      console.error('Error resizing image:', error);
      this.info = 'Error occurred during image processing';
    } finally {
      this.isLoading = false;
    }
  }
}
