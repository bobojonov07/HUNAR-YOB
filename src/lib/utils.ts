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
 * Фишурдани сурат дар тарафи клиент барои сарфаи ҳаҷм.
 */
export async function compressImage(base64Str: string, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}
