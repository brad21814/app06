'use client';

import { useState, useRef } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Loader2, Upload } from 'lucide-react';
import { uploadUserProfilePhoto, deleteUserProfilePhoto } from '@/lib/firebase/storage';
import { toast } from 'sonner';
import { useAuth } from '@/lib/firebase/auth-context';

export function PhotoUpload() {
    const { user, userData } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validation
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('File must be an image');
            return;
        }

        setUploading(true);
        try {
            await uploadUserProfilePhoto(user.uid, file);
            toast.success('Profile photo updated');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!user) return;
        
        setUploading(true);
        try {
            await deleteUserProfilePhoto(user.uid);
            toast.success('Profile photo removed');
        } catch (error: any) {
            toast.error('Failed to remove photo');
        } finally {
            setUploading(false);
        }
    };

    const isCustomPhoto = userData?.photoURL?.includes('firebasestorage');

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b mb-8">
            <div className="relative">
                <UserAvatar 
                    user={userData} 
                    className="h-24 w-24 border-2 border-muted shadow-sm" 
                    fallbackClassName="text-3xl"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-orange-500 text-white rounded-full border-2 border-white shadow-md hover:bg-orange-600 transition-colors"
                    disabled={uploading}
                    title="Change Photo"
                >
                    <Camera className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col gap-2 text-center sm:text-left">
                <h3 className="font-semibold text-lg">Profile Photo</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Upload a custom profile photo. Maximum size 2MB (JPG or PNG).
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload Photo
                    </Button>
                    
                    {isCustomPhoto && (
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleRemove}
                            disabled={uploading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
