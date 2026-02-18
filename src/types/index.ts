export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  order: number;
}

export interface ProcessedSlide {
  imageData: string;
  slideNumber: number;
  textContent: string;
}

export type AspectRatio = '1:1' | '4:5';
