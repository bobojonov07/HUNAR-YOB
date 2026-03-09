
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FORBIDDEN_WORDS } from "./storage"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Филтри дастӣ барои санҷиши дашномҳо.
 */
export function hasProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => lowerText.includes(word.toLowerCase()));
}

/**
 * Фишурдани сурат бо сифати максималӣ (100%).
 */
export async function compressImage(base64Str: string, maxWidth = 1920, quality = 1.0): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Танҳо агар сурат аз 1920px калон бошад, онро хурд мекунем
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      // Истифодаи сифати 1.0 барои пешгирии хирагӣ
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
  });
}
