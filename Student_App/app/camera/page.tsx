"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, ScanLine, TestTube } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudentStore } from "@/lib/store";
import { toast } from "sonner";

export default function CameraPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();
  const { checkInToEvent } = useStudentStore();

  const handleSimulateScan = () => {
    // For demo purposes, we'll simulate scanning "event-1" (IKOM) or "event-2" (electronica)
    const mockEventId = window.prompt("Enter Event ID to simulate check-in (e.g. '1', '2', '3'):", "1");
    if (mockEventId) {
      checkInToEvent(mockEventId);
      toast.success(`Checked in to event ${mockEventId} ✓`);
      router.push(`/events/${mockEventId}`);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0 && mounted) {
          setHasCameraPermission(true);
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Handle scan success
              console.log("Scanned:", decodedText);
              // For MVP, just alert and maybe redirect
              alert(`Scanned: ${decodedText}`);
              html5QrCode.stop();
              router.push("/feed"); // Or the appropriate event page
            },
            () => {
              // Handle scan error (happens continuously as it searches)
            }
          );
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (mounted) setHasCameraPermission(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [router]);

  return (
    <div className="absolute inset-0 z-[60] bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/60 to-transparent">
        <h1 className="text-xl font-bold tracking-wider">WE Scanner</h1>
        <Link href="/feed" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </Link>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {hasCameraPermission === false ? (
          <div className="text-center px-6">
            <ScanLine className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-medium mb-2">Camera access denied</p>
            <p className="text-gray-400 mb-6">Please allow camera access in your browser settings to scan QR codes.</p>
            <button 
              onClick={handleSimulateScan}
              className="mt-4 flex items-center justify-center mx-auto px-6 py-3 bg-[var(--we-red)] text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <TestTube className="w-5 h-5 mr-2" />
              Simulate Scan
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[70vh] flex flex-col items-center justify-center">
            {/* The actual video feed container */}
            <div id="reader" className="w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl bg-gray-900" />
            
            {/* Target overlay overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[250px] border-2 border-[var(--we-red)] rounded-2xl relative shadow-[0_0_0_100vw_rgba(0,0,0,0.5)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
                
                {/* Scanning animation line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--we-red)] shadow-[0_0_8px_var(--we-red)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* Debug Button overlay for demo */}
            <button 
              onClick={handleSimulateScan}
              className="absolute bottom-4 z-50 flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Simulate Scan
            </button>
          </div>
        )}
      </div>

      {/* Bottom Information */}
      <div className="p-8 text-center bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-gray-300 font-medium">Point your camera at a Würth QR Code</p>
        <p className="text-sm text-gray-500 mt-2">Check-in to events or connect with employees</p>
      </div>
    </div>
  );
}
