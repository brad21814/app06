import { storage, auth } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { updateUser } from './firestore';

export async function uploadUserProfilePhoto(userId: string, file: File) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    // 1. Create a unique path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `avatars/${userId}/profile_${timestamp}.${fileExtension}`);
    
    // 2. Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // 3. Get the Download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // 4. Update Firebase Auth Profile
    await updateProfile(auth.currentUser, {
        photoURL: downloadURL
    });
    
    // 5. Update Firestore User Doc
    await updateUser(userId, {
        photoURL: downloadURL
    });
    
    return downloadURL;
}

export async function deleteUserProfilePhoto(userId: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    // Note: To properly delete, we would need to track the exact filename.
    // For now, let's just clear the URLs from the profiles.
    // If we want to save space, we should parse the existing URL to get the path.
    
    const existingPhotoURL = auth.currentUser.photoURL;
    if (existingPhotoURL && existingPhotoURL.includes('firebasestorage')) {
        try {
            const pathMatch = existingPhotoURL.match(/\/o\/(.+?)\?/);
            if (pathMatch) {
                const fullPath = decodeURIComponent(pathMatch[1]);
                const storageRef = ref(storage, fullPath);
                await deleteObject(storageRef);
            }
        } catch (e) {
            console.error('Failed to delete file from storage:', e);
        }
    }
    
    // Clear URLs
    await updateProfile(auth.currentUser, { photoURL: '' });
    await updateUser(userId, { photoURL: undefined });
}
