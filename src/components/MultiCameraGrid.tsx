import React, { useEffect, useRef, useState } from "react";
import {
  FaPlay,
  FaPowerOff,
  FaVolumeMute,
  FaVolumeUp,
  FaExpand,
} from "react-icons/fa";

interface CameraStreamProps {
  cameraId: number;
  signalingUrl: string;
  isAudioActive: boolean;
  setActiveAudioId: (id: number | null) => void;
}

const CameraStream: React.FC<CameraStreamProps> = ({
  cameraId,
  signalingUrl,
  isAudioActive,
  setActiveAudioId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const drawRef = useRef<number>(0);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
  };

  const draw = () => {
    const video = videoRef.current;
    const ctx = canvasRef.current?.getContext("2d");

    if (ctx && video && video.readyState >= 2) {
      ctx.drawImage(
        video,
        0,
        0,
        canvasRef.current!.width,
        canvasRef.current!.height
      );

      const now = new Date().toLocaleTimeString();
      const fontSize = Math.floor(canvasRef.current!.height * 0.05);

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(10, 10, 550, 60);
      ctx.fillStyle = "white";
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillText(`Cam ${cameraId} - ${now}`, 15, 60);
    }

    drawRef.current = requestAnimationFrame(draw);
  };

  const startStream = async () => {
    setLoading(true);
    setError(null);

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = muted;
    videoRef.current = video;

    const pc = new RTCPeerConnection();
    peerRef.current = pc;

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      video.srcObject = stream;
      video.play();
    };

    try {
      const dummy = await navigator.mediaDevices.getUserMedia({ video: true });
      dummy.getTracks().forEach((track) => pc.addTrack(track, dummy));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch(`${signalingUrl}/offer/${cameraId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
      });

      const answer = await res.json();
      await pc.setRemoteDescription(answer);

      video.onloadeddata = () => {
        setLoading(false);
        setIsStreaming(true);
        canvasRef.current!.width = video.videoWidth;
        canvasRef.current!.height = video.videoHeight;
        video.muted = !isAudioActive;
        setMuted(!isAudioActive);
        draw();
      };
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(`Camera ${cameraId} failed to load`);
    }
  };

  const stopStream = () => {
    setIsStreaming(false);
    setLoading(false);
    if (peerRef.current) {
      peerRef.current.getSenders().forEach((s) => s.track?.stop());
      peerRef.current.close();
      peerRef.current = null;
    }

    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    cancelAnimationFrame(drawRef.current!);
    clearCanvas();
  };

  const toggleFullscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!document.fullscreenElement) {
      canvas.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    startStream();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioActive;
      setMuted(!isAudioActive);
    }
  }, [isAudioActive]);

  return (
    <div className="camera-tile">
      {loading && <div className="overlay">Loading Cam {cameraId}...</div>}
      {error && <div className="overlay error">{error}</div>}
      <canvas ref={canvasRef} className="camera-canvas" />
      <div className="camera-controls">
        {isStreaming ? (
          <>
            <button onClick={stopStream} title="Shutdown">
              <FaPowerOff />
            </button>
            <button onClick={() => setActiveAudioId(muted ? cameraId : null)}>
              {muted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <button onClick={toggleFullscreen} title="Fullscreen">
              <FaExpand />
            </button>
          </>
        ) : (
          <button onClick={startStream} title="Start">
            <FaPlay />
          </button>
        )}
      </div>
    </div>
  );
};

const MultiCameraGrid: React.FC = () => {
  const signalingUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [activeAudioId, setActiveAudioId] = useState<number | null>(null);

  return (
    <div className="grid-container">
      {[1, 2, 3, 4].map((id) => (
        <CameraStream
          key={id}
          cameraId={id}
          signalingUrl={signalingUrl}
          isAudioActive={activeAudioId === id}
          setActiveAudioId={setActiveAudioId}
        />
      ))}
    </div>
  );
};

export default MultiCameraGrid;
