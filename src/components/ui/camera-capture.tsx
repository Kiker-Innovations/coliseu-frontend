import { useRef, useState, useEffect } from "react";
import { Camera, X, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
  className?: string;
}

export function CameraCapture({
  onCapture,
  onCancel,
  className,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageDataUrl);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "verification-photo.jpg", {
              type: "image/jpeg",
            });
            onCapture(file);
            stopCamera();
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleCancel = () => {
    stopCamera();
    setCapturedImage(null);
    onCancel?.();
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        setError("");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          streamRef.current = mediaStream;
          setStream(mediaStream);
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        setError(
          "Não foi possível acessar a câmera. Verifique as permissões do navegador."
        );
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn(
        "relative bg-background rounded-lg overflow-hidden border",
        className
      )}
    >
      <div className="relative aspect-video bg-black flex items-center justify-center">
        {!isCameraActive && !capturedImage && !error && (
          <div className="text-white flex flex-col items-center gap-2">
            <Camera className="w-12 h-12 animate-pulse" />
            <p>Iniciando câmera...</p>
          </div>
        )}

        {error && (
          <div className="text-destructive text-center p-4">
            <p className="font-semibold mb-2">Erro ao acessar câmera</p>
            <p className="text-sm">{error}</p>
            <Button onClick={startCamera} className="mt-4" variant="outline">
              Tentar Novamente
            </Button>
          </div>
        )}

        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-contain",
              !isCameraActive && "hidden"
            )}
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-4 bg-card flex justify-center gap-3">
        {!capturedImage ? (
          <>
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              size="lg"
            >
              <X className="mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={capturePhoto}
              size="lg"
              disabled={!isCameraActive}
            >
              <Camera className="mr-2" />
              Capturar Foto
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={retakePhoto}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="mr-2" />
              Tirar Outra
            </Button>
            <Button type="button" onClick={confirmPhoto} size="lg">
              Confirmar Foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
