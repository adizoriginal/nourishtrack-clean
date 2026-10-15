import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cleanBarcode } from "@/lib/barcode";

interface BarcodeScannerProps {
  onCode: (code: string) => void;
  busy?: boolean;
  error?: string | null;
}

// Minimal typing for the browser's built-in BarcodeDetector (Chrome/Android/Edge)
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/** Point the camera at a barcode, or type the number. The video never leaves the device. */
export const BarcodeScanner = ({ onCode, busy, error }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const stop = () => {
    stopRef.current();
    stopRef.current = () => {};
    setScanning(false);
  };

  useEffect(() => () => stopRef.current(), []);

  const found = (raw: string) => {
    const code = cleanBarcode(raw);
    if (code.length < 8) return false;
    stop();
    onCode(code);
    return true;
  };

  const start = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser can't use the camera. Type the barcode number below instead.");
      return;
    }
    setScanning(true);
    // Wait for the <video> to render
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const video = videoRef.current;
    if (!video) return;

    const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    try {
      if (Native) {
        // Built-in scanner: fast and no extra download
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        video.srcObject = stream;
        await video.play();
        const detector = new Native({ formats: FORMATS });
        let active = true;
        stopRef.current = () => {
          active = false;
          stream.getTracks().forEach((t) => t.stop());
          video.srcObject = null;
        };
        const tick = async () => {
          if (!active) return;
          try {
            const codes = await detector.detect(video);
            if (codes[0] && found(codes[0].rawValue)) return;
          } catch {
            /* keep trying */
          }
          setTimeout(tick, 250);
        };
        tick();
      } else {
        // Other browsers (e.g. iPhone Safari): load a scanning library only when needed
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          video,
          (result) => {
            if (result) found(result.getText());
          }
        );
        stopRef.current = () => controls.stop();
      }
    } catch (err) {
      stop();
      const name = (err as Error)?.name;
      setCameraError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Allow the camera for this site in your browser settings, or type the barcode below."
          : name === "NotFoundError"
            ? "No camera was found on this device. Type the barcode number below instead."
            : "Couldn't start the camera. Type the barcode number below instead."
      );
    }
  };

  return (
    <div className="space-y-4">
      {scanning ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg bg-black aspect-[4/3]">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-md border-2 border-white/80" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Hold the barcode inside the box</p>
          <Button type="button" variant="outline" className="w-full" onClick={stop}>
            Stop camera
          </Button>
        </div>
      ) : (
        <Button type="button" className="w-full h-12" onClick={start} disabled={busy}>
          <Camera className="h-5 w-5 mr-2" />
          Scan with camera
        </Button>
      )}

      {cameraError && (
        <p className="text-sm text-destructive" role="alert">
          {cameraError}
        </p>
      )}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (cleanBarcode(typed).length >= 8) {
            stop();
            onCode(cleanBarcode(typed));
          }
        }}
      >
        <Label htmlFor="barcode-number">Or type the barcode number</Label>
        <div className="flex gap-2">
          <Input
            id="barcode-number"
            inputMode="numeric"
            placeholder="e.g. 5000159407236"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={busy || cleanBarcode(typed).length < 8}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
          </Button>
        </div>
      </form>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ScanBarcode className="h-4 w-4" /> Looking up product...
        </p>
      )}
      {error && !busy && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Product details come from Open Food Facts, a free worldwide database. Your camera image stays on your device.
      </p>
    </div>
  );
};
