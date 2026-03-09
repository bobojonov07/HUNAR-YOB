
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FORBIDDEN_WORDS } from "./storage"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Филтри дастӣ барои санҷиши дашномҳо бо истифода аз Regular Expressions.
 * Акнун танҳо калимаҳои пурраро месанҷад, то феълҳоро (мисли 'мекунам') хато нагирад.
 */
export function hasProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  return FORBIDDEN_WORDS.some(word => {
    // \b калимаро танҳо дар сурати алоҳида будан меёбад
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Фишурдани сурат бо сифати баланд.
 * Барои пешгирӣ аз хатогии Firestore (лимити 1МБ), андоза ба 1200px ва сифат ба 0.8 танзим шуд.
 * Ин сифати "Retina" -ро таъмин мекунад ва сурат аслан хира намешавад.
 */
export async function compressImage(base64Str: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
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
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      // Истифодаи 0.8 сифати аълоро нигоҳ медорад ва ҳаҷмро хеле кам мекунад
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
}
