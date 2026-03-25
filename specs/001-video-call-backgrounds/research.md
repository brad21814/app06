# Research: Video Call Backgrounds

## Decision: Twilio Video Processors Integration
- **Action**: Use `@twilio/video-processors` library to manage background effects.
- **Rationale**: Official Twilio extension designed specifically for `VideoTrack` manipulation. It handles WASM loading and frame processing efficiently.
- **Alternatives considered**: 
    - Custom Canvas API processing: Rejected due to high complexity and potential performance issues compared to the optimized Twilio library.

## Decision: Default Blur for Privacy
- **Action**: Implement a "privacy-first" approach by automatically applying `GaussianBlurBackgroundProcessor` when the local video track is started.
- **Rationale**: Aligns with user story requirements for immediate privacy upon joining a call.
- **Implementation**: The effect will be applied in the `toggleVideo` function or a dedicated `useEffect` monitoring `localVideoTrack`.

## Decision: Asset Management for Virtual Backgrounds
- **Action**: Create a `public/assets/backgrounds/` directory to host themed images (Team Pulp, Juicy Pulpy).
- **Rationale**: Local hosting ensures reliable access and faster loading for the `VirtualBackgroundProcessor`.
- **Themed Assets**: 
    - Team Pulp: Professional but colorful "office" or "lounge" style images with a citrus/pulp aesthetic.
    - Juicy Pulpy: Fun, vibrant, and highly stylized fruit or "juice" themed backgrounds.

## Decision: Feature Detection & Hardware Requirements
- **Action**: Perform compatibility checks for WASM, Web Workers, and JS SDK version before initializing processors.
- **Rationale**: Frame-by-frame processing is CPU-intensive. Graceful degradation prevents the application from crashing on older hardware.
- **Fallback**: Display a toast notification informing the user if their device doesn't support advanced video processing, while allowing the raw video stream to continue.

## Decision: UI Integration
- **Action**: Add a "Background Settings" popover or dropdown near the video controls in `app/(dashboard)/connect/[connectionId]/page.tsx`.
- **Rationale**: Provides easy access to customization without cluttering the main video interface.
- **Options**: [None, Blur, Team Pulp 1-3, Juicy Pulpy 1-3].
