# React WebRTC CCTV Player

This project displays a 2x2 CCTV-like video grid in React using WebRTC and streams from a backend server.

## Features

- 🎥 **Stream 4 videos** using WebRTC (simulated cameras).
- 🔊 **Audio Control**:
  - Only **one stream** can play audio at a time.
  - Clicking the speaker icon mutes others.
- 🔁 **Start/Stop streaming** per camera.
- 🔎 **Fullscreen per camera**.
- ⏺️ **Overlay info**: camera ID and live timestamp.
- 📐 **Rendered on Canvas** to allow overlays and customization.

## Folder Structure

```
/src
  └── MultiCameraGrid.tsx   // Main component with 2x2 video grid
  └── App.tsx               // Entry point (imports and renders grid)
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## How to Use

1. Install dependencies:

```bash
npm install
```

2. Start the React app:

```bash
npm run dev
```

3. Ensure your backend server is running at `http://localhost:8080`.

## Backend Requirements

- The backend must expose `/offer/:cameraId` route for WebRTC signaling.
- Each `cameraId` should correspond to a local video file.

## Tech Stack

- React + TypeScript
- WebRTC (via browser)
- React Icons (`react-icons/fa`)
- Canvas API for rendering + overlay

## Notes

- Make sure video files exist on the backend path as per `cameraId`.
- Only one camera's audio is active at a time.

## License

MIT
