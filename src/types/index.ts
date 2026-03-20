export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  order: number;
}

export type TextPosition = 'top' | 'middle' | 'bottom';
export type GradientIntensity = 'none' | 'light' | 'medium' | 'heavy';

export interface SlideStyle {
  isQuote?: boolean;
  textPosition?: TextPosition;
  textColor?: string;
  gradientIntensity?: GradientIntensity;
  imageOffsetY?: number; // 0–1, vertical crop position
}

export interface ProcessedSlide {
  imageData: string;
  slideNumber: number;
  textContent: string;
  style: SlideStyle;
}

export const TEXT_COLORS = [
  { id: 'white', label: 'White', value: '#FFFFFF' },
  { id: 'black', label: 'Black', value: '#000000' },
  { id: 'cream', label: 'Cream', value: '#FDF6E3' },
] as const;

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
