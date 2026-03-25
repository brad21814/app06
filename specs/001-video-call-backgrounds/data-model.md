# Data Model: Video Call Backgrounds

## Entity: BackgroundOption
Represents a selectable background effect or image.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., 'blur', 'pulp-1', 'none'). |
| `type` | `string` | Effect category: 'blur', 'image', or 'none'. |
| `name` | `string` | Display name for the UI. |
| `category` | `string` | Grouping: 'Privacy', 'Team Pulp', 'Juicy Pulpy'. |
| `url` | `string?` | Path to image asset (for 'image' type). |

## Entity: VideoProcessorState
Client-side state tracking the active processor applied to the local track.

| Field | Type | Description |
|-------|------|-------------|
| `activeOptionId` | `string` | The ID of the currently selected `BackgroundOption`. |
| `isSupported` | `boolean` | Whether the browser/hardware supports processing. |
| `isLoading` | `boolean` | True while WASM/Model assets are being fetched. |

## Relationships
- **LocalVideoTrack**: Has zero or one active `BackgroundProcessor` (Blur or VirtualBackground).
- **BackgroundAsset**: Static files served from `public/assets/backgrounds/` corresponding to `BackgroundOption` entries.
