"use client";
import React, { useRef, useEffect, useState } from "react";
import QRCode from 'qrcode'; // Import qrcode library
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BatchQRGeneratorProps {
  lotCode: string;
  sku: string;
}

export function BatchQRGenerator({ lotCode, sku }: BatchQRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    const data = JSON.stringify({ lotCode, sku, url: `${window.location.origin}/batches/${lotCode}` }); // Example data
    try {
      const url = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-900
          light: '#ffffff' // white
        }
      });
      setQrDataUrl(url);
    } catch (err: any) {
      console.error("Error generating QR code:", err);
      toast.error("Failed to generate QR code.");
    }
  };

  useEffect(() => {
    void generateQRCode();
  }, [lotCode, sku]);

  const handleDownloadQR = () => {
    if (canvasRef.current && qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `QR_Code_${lotCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR code downloaded!");
    } else {
      toast.error("QR code not available for download.");
    }
  };

  return (
    <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm">
      <h4 className="font-semibold text-gray-900 mb-3">QR / GS1 Barcode</h4>
      <div className="flex flex-col items-center justify-center gap-4">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR Code for ${lotCode}`} className="w-48 h-48 border border-gray-200 rounded-md" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md text-gray-500">
            <QrCode className="w-12 h-12" />
          </div>
        )}
        <p className="text-sm text-gray-700">Scan for batch details.</p>
        <Button onClick={handleDownloadQR} disabled={!qrDataUrl} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Download className="w-4 h-4 mr-2" /> Download QR Code
        </Button>
      </div>
      {/* Placeholder for GS1 barcode generation if needed */}
      <p className="text-xs text-gray-500 mt-4 text-center">GS1 barcode generation coming soon.</p>
    </div>
  );
}