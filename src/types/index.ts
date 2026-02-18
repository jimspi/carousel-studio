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

export type AspectRatio = '1:1' | '4:5' | 'original';

export interface FontOption {
  id: string;
  label: string;
  family: string;
  weight: number;
}

export const FONTS: FontOption[] = [
  { id: 'dm-sans', label: 'Clean Sans', family: '"DM Sans", sans-serif', weight: 700 },
  { id: 'montserrat', label: 'Bold Sans', family: '"Montserrat", sans-serif', weight: 700 },
  { id: 'playfair', label: 'Serif', family: '"Playfair Display", serif', weight: 700 },
  { id: 'oswald', label: 'Condensed', family: '"Oswald", sans-serif', weight: 600 },
  { id: 'nunito', label: 'Friendly', family: '"Nunito", sans-serif', weight: 700 },
];
