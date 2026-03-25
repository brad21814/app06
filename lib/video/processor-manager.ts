import {
    GaussianBlurBackgroundProcessor,
    VirtualBackgroundProcessor,
    isSupported
} from '@twilio/video-processors';
import { LocalVideoTrack } from 'twilio-video';

export type BackgroundType = 'blur' | 'image' | 'none';

export interface BackgroundOption {
    id: string;
    type: BackgroundType;
    name: string;
    category: string;
    url?: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
    { id: 'none', type: 'none', name: 'None', category: 'Privacy' },
    { id: 'blur', type: 'blur', name: 'Blur', category: 'Privacy' },
    // Team Pulp
    { id: 'pulp-1', type: 'image', name: 'Pulp Lounge', category: 'Team Pulp', url: '/assets/backgrounds/pulp-1.jpg' },
    { id: 'pulp-2', type: 'image', name: 'Citrus Office', category: 'Team Pulp', url: '/assets/backgrounds/pulp-2.jpg' },
    { id: 'pulp-3', type: 'image', name: 'Zesty Meeting', category: 'Team Pulp', url: '/assets/backgrounds/pulp-3.jpg' },
    // Juicy Pulpy
    { id: 'juicy-1', type: 'image', name: 'Juicy Splash', category: 'Juicy Pulpy', url: '/assets/backgrounds/juicy-1.jpg' },
    { id: 'juicy-2', type: 'image', name: 'Tropical Pulp', category: 'Juicy Pulpy', url: '/assets/backgrounds/juicy-2.jpg' },
    { id: 'juicy-3', type: 'image', name: 'Velvet Nectar', category: 'Juicy Pulpy', url: '/assets/backgrounds/juicy-3.jpg' },
];

export class VideoBackgroundManager {
    private currentProcessor: GaussianBlurBackgroundProcessor | VirtualBackgroundProcessor | null = null;
    private assetsPath = 'https://sdk.twilio.com/js/video-processors/releases/3.1.0/artifacts';

    /**
     * Verify if the browser/hardware supports frame processing.
     */
    async checkCompatibility(): Promise<boolean> {
        return isSupported;
    }

    /**
     * Apply a blur or virtual background image to the provided track.
     */
    async applyEffect(track: LocalVideoTrack, optionId: string): Promise<void> {
        const option = BACKGROUND_OPTIONS.find(o => o.id === optionId);
        if (!option) throw new Error(`Invalid background option: ${optionId}`);

        // 1. Check compatibility
        const supported = await this.checkCompatibility();
        if (!supported) {
            throw new Error('Advanced video processing is not supported on this device/browser.');
        }

        // 2. Clear existing
        this.clearEffects(track);

        if (option.type === 'none') return;

        // 3. Initialize new processor
        let processor: GaussianBlurBackgroundProcessor | VirtualBackgroundProcessor;

        if (option.type === 'blur') {
            processor = new GaussianBlurBackgroundProcessor({
                assetsPath: this.assetsPath,
                maskBlurRadius: 10,
            });
        } else {
            // Virtual Image
            if (!option.url) throw new Error('Image URL is missing for virtual background');
            
            const img = new Image();
            img.src = option.url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            processor = new VirtualBackgroundProcessor({
                assetsPath: this.assetsPath,
                backgroundImage: img,
            });
        }

        // 4. Load and Add
        await processor.loadModel();
        track.addProcessor(processor);
        this.currentProcessor = processor;
    }

    /**
     * Remove all active processors from the track.
     */
    clearEffects(track: LocalVideoTrack): void {
        if (this.currentProcessor) {
            try {
                track.removeProcessor(this.currentProcessor);
            } catch (err) {
                console.warn('Failed to remove processor:', err);
            }
            this.currentProcessor = null;
        }
    }
}

export const videoBackgroundManager = new VideoBackgroundManager();
