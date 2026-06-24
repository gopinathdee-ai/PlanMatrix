"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import { computeMarkerSizes } from "@/lib/markerSizing";
import { getAbbreviatedName } from "@/lib/markerDisplay";

interface FloorPlan {
  id: string;
  building: string;
  floor_number: string;
  pdf_url: string;
}

interface Marker {
  id: string;
  marker_number: string;
  pixel_x: number;
  pixel_y: number;
  assigned_user_name?: string;
  assigned_user_email?: string;
}

const PRINT_DPI = 150; // DPI for high-quality print

export default function PrintFloorPlanPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [markerSizes, setMarkerSizes] = useState<Record<string, { diameter: number; fontSize: number }>>({});
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [printScale, setPrintScale] = useState(1);
  const renderTaskRef = useRef<any>(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const floorPlanContainerRef = useRef<HTMLDivElement>(null);

  // Load floor plan, markers, and PDF
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/floor-plans`);
        if (!res.ok) throw new Error("Failed to load floor plan");

        const plans = await res.json();
        const plan = plans.find((p: any) => p.id === params.id);
        if (!plan) throw new Error("Floor plan not found");
        setFloorPlan(plan);

        const pdfRes = await fetch(plan.pdf_url);
        const pdfData = await pdfRes.arrayBuffer();

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
        setPdfDoc(doc);

        const markersRes = await fetch(`/api/floor-plans/${params.id}/markers`);
        if (markersRes.ok) {
          const markerData = await markersRes.json();
          setMarkers(markerData);

          // Compute per-marker sizes
          const sizes = computeMarkerSizes(markerData);
          const sizeMap: Record<string, { diameter: number; fontSize: number }> = {};
          sizes.forEach((size) => {
            sizeMap[size.id] = { diameter: size.diameter, fontSize: size.fontSize };
          });
          setMarkerSizes(sizeMap);
        }

        // Compute print scale
        const scale = PRINT_DPI / 72;
        setPrintScale(scale);

        setLoading(false);
      } catch (error) {
        console.error("Error loading floor plan:", error);
        toast.error("Failed to load floor plan");
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  // Render PDF at print scale
  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    async function renderPDF() {
      // Wait for canvas to be mounted (up to 1000ms)
      let attempts = 0;
      const maxAttempts = 100;
      while (!canvasRef.current && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10));
        attempts++;
      }

      if (cancelled || !canvasRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: printScale });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Ensure browser respects the size
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        renderTaskRef.current = null;
      } catch (error: any) {
        if (error?.name !== "RenderingCancelledException") {
          console.error("Error rendering PDF:", error);
        }
      }
    }

    renderPDF();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, printScale]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading floor plan...</div>
        </div>
      </div>
    );
  }


  // Determine landscape vs portrait
  const isLandscape = floorPlan
    ? true // Default to landscape for architectural plans
    : true;

  return (
    <div className={`print-page min-h-screen bg-white`}>
      <style>{`
        @media print {
          @page {
            size: ${isLandscape ? "A3 landscape" : "A3 portrait"};
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          body, .print-page {
            margin: 0;
            background: white;
          }
        }
      `}</style>

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Print Floor Plan
              </h1>
              <p className="text-gray-600 mt-2">
                {floorPlan?.building} - Floor {floorPlan?.floor_number}
              </p>
            </div>
            <button
              onClick={() => setShowPrintOptions(true)}
              className="no-print flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-all"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
          </div>

          {/* Print instruction note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Print settings:</strong> Set printer to "Actual Size" or "100%" scale, not "Fit to Page".
            Paper size will be A3 {isLandscape ? "landscape" : "portrait"}.
          </div>
        </div>

        {/* Floor plan canvas with markers */}
        <div ref={floorPlanContainerRef} className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-8 overflow-auto">
          <div className="relative inline-block">
            <canvas ref={canvasRef} className="bg-white" />

            {/* Marker overlays */}
            {markers.map((marker) => {
              const size = markerSizes[marker.id];
              if (!size) return null;

              const scale = printScale;
              const width = size.diameter * 0.875 * scale;
              const height = size.diameter * 0.75 * scale;
              const fontSize = size.fontSize * scale * 0.7;

              return (
                <div
                  key={marker.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(marker.pixel_x * printScale)}px`,
                    top: `${(marker.pixel_y * printScale)}px`,
                  }}
                >
                  <div
                    className={`rounded-full border-2 flex items-center justify-center font-semibold overflow-hidden px-1 py-0.5 whitespace-nowrap ${marker.assigned_user_name
                        ? "border-red-500 bg-red-100 text-red-700"
                        : "border-green-500 bg-green-100 text-green-700"
                      }`}
                    style={{
                      fontFamily: "var(--font-roboto-condensed)",
                      fontSize: `${fontSize}px`,
                      minWidth: `${width}px`,
                      height: `${height}px`,
                    }}
                  >
                    {marker.assigned_user_name
                      ? getAbbreviatedName(marker.assigned_user_name)
                      : marker.marker_number}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Back button */}
        <div className="mt-8 no-print">
          <Link href={`/floor-plans/${params.id}`}>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back to Floor Plan
            </button>
          </Link>
        </div>
      </div>

      {/* Print Options Modal */}
      {showPrintOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Choose Print Option</h2>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  window.print();
                  setShowPrintOptions(false);
                }}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-3"
              >
                <span>🖨️</span>
                <span>Print Floor Plan with Markers</span>
              </button>

              <button
                onClick={async () => {
                  setShowPrintOptions(false);
                  const toastId = toast.loading('Generating PDF...');

                  try {
                    const jsPDF = (await import('jspdf')).jsPDF;

                    if (!pdfDoc || !canvasRef.current) {
                      toast.error('Floor plan not loaded', { id: toastId });
                      return;
                    }

                    // The canvas (canvasRef.current) already has the high-res PDF rendered
                    const ctx = canvasRef.current.getContext('2d');
                    if (!ctx) throw new Error('Could not get canvas context');

                    // Draw markers directly onto the canvas for pixel-perfect centering
                    markers.forEach((marker) => {
                      const size = markerSizes[marker.id];
                      if (!size) return;

                      const scale = printScale;
                      const fontSize = size.fontSize * scale * 0.7;
                      
                      const text = marker.assigned_user_name 
                        ? getAbbreviatedName(marker.assigned_user_name) 
                        : marker.marker_number;
                      
                      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                      const textMetrics = ctx.measureText(text);
                      const textWidth = textMetrics.width;
                      
                      const pillWidth = Math.max(size.diameter * 0.875 * scale, textWidth + 16);
                      const pillHeight = size.diameter * 0.75 * scale;
                      
                      const x = marker.pixel_x * scale;
                      const y = marker.pixel_y * scale;

                      ctx.beginPath();
                      const rx = x - pillWidth / 2;
                      const ry = y - pillHeight / 2;
                      
                      ctx.lineWidth = 2;
                      ctx.strokeStyle = marker.assigned_user_name ? '#ef4444' : '#22c55e';
                      ctx.fillStyle = marker.assigned_user_name ? '#fee2e2' : '#f0fdf4';
                      
                      const r = 6;
                      ctx.moveTo(rx + r, ry);
                      ctx.lineTo(rx + pillWidth - r, ry);
                      ctx.quadraticCurveTo(rx + pillWidth, ry, rx + pillWidth, ry + r);
                      ctx.lineTo(rx + pillWidth, ry + pillHeight - r);
                      ctx.quadraticCurveTo(rx + pillWidth, ry + pillHeight, rx + pillWidth - r, ry + pillHeight);
                      ctx.lineTo(rx + r, ry + pillHeight);
                      ctx.quadraticCurveTo(rx, ry + pillHeight, rx, ry + pillHeight - r);
                      ctx.lineTo(rx, ry + r);
                      ctx.quadraticCurveTo(rx, ry, rx + r, ry);
                      ctx.closePath();
                      ctx.fill();
                      ctx.stroke();

                      ctx.fillStyle = marker.assigned_user_name ? '#991b1b' : '#166534';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText(text, x, y);
                    });

                    const imgData = canvasRef.current.toDataURL('image/png');

                    const pdf = new jsPDF({
                      orientation: 'landscape',
                      unit: 'mm',
                      format: 'a3',
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgWidth = pdfWidth - 10;
                    const imgHeight = (canvasRef.current.height * imgWidth) / canvasRef.current.width;

                    pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
                    pdf.save(`${floorPlan?.building}-Floor${floorPlan?.floor_number}-marked.pdf`);
                    
                    toast.success('PDF downloaded successfully', { id: toastId });
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    toast.error('Failed to generate PDF', { id: toastId });
                  }
                }}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-3"
              >
                <span>📥</span>
                <span>Download PDF with Markers</span>
              </button>
            </div>

            <button
              onClick={() => setShowPrintOptions(false)}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
