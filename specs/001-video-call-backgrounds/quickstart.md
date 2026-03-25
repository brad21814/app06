# Quickstart: Video Call Backgrounds

## Development Setup
1. **Install Dependencies**:
   ```bash
   pnpm add @twilio/video-processors
   ```
2. **Assets Configuration**:
   Ensure themed images are placed in `public/assets/backgrounds/`.
   Note: Twilio processors require a runtime path to WASM files. These are typically fetched from a CDN or hosted locally in `public/t-processors/`.

## Verification Steps
1. **Join Video Session**: Navigate to `/connect/[connectionId]` and join a room.
2. **Confirm Default Blur**: Verify that your self-preview is blurred immediately upon starting video.
3. **Change Background**:
   - Open the "Background Settings" (new UI component in header).
   - Select a "Team Pulp" image.
   - Verify your background changes to the image in < 1s.
4. **Switch to None**:
   - Select "None" in settings.
   - Verify the blur/image is removed and raw video is shown.
5. **Compatibility Check**:
   - Use a browser without WASM support (if possible) or mock the support check.
   - Verify a toast notification appears and raw video is shown gracefully.
