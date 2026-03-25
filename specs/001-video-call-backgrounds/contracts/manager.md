# Contract: VideoBackgroundManager

Represents the client-side service responsible for managing Twilio Video processors on a `LocalVideoTrack`.

## Interface

### `checkCompatibility()`
- **Purpose**: Verify if the browser/hardware supports frame processing.
- **Returns**: `Promise<boolean>`

### `applyEffect(track: LocalVideoTrack, option: BackgroundOption)`
- **Purpose**: Apply a blur or virtual background image to the provided track.
- **Logic**:
    1. Check `checkCompatibility()`.
    2. Remove any existing processor from `track`.
    3. Initialize new `GaussianBlurBackgroundProcessor` or `VirtualBackgroundProcessor`.
    4. Call `processor.load()`.
    5. `track.addProcessor(processor)`.
- **Returns**: `Promise<void>`

### `clearEffects(track: LocalVideoTrack)`
- **Purpose**: Remove all active processors from the track.
- **Logic**: `track.processors.forEach(p => track.removeProcessor(p))`.
- **Returns**: `void`

## Events
- **`onProcessorLoading`**: Fired when a large WASM asset begins fetching.
- **`onProcessorReady`**: Fired when the effect is successfully applied.
- **`onProcessorError`**: Fired if WASM fails to load or frame processing crashes.
