import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Check for Firestore Timestamp (both client and admin SDKs have toMillis)
  // Duck typing is safer than instanceof across different SDK versions/types
  if (typeof data === 'object' && typeof data.toMillis === 'function' && 'seconds' in data) {
    return data.toMillis();
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }

  return data;
}
