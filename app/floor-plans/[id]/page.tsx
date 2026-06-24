"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ChevronLeft, ZoomIn, ZoomOut, Edit2, Users, Download } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import { getAbbreviatedName } from "@/lib/markerDisplay";
import { computeMarkerSizes } from "@/lib/markerSizing";

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
}

export default function FloorPlanViewer({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [markerSizes, setMarkerSizes] = useState<Record<string, { diameter: number; fontSize: number }>>({});
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<any>(null);
  const floorPlanContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadFloorPlan() {
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

          const sizes = computeMarkerSizes(markerData);
          const sizeMap: Record<string, { diameter: number; fontSize: number }> = {};
          sizes.forEach((size) => {
            sizeMap[size.id] = { diameter: size.diameter, fontSize: size.fontSize };
          });
          setMarkerSizes(sizeMap);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading floor plan:", error);
        toast.error("Failed to load floor plan");
        setLoading(false);
      }
    }

    loadFloorPlan();
  }, [params.id]);

  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    const renderPDF = async () => {
      // Cancel previous render if one is in progress
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      // Wait for canvas to be mounted (up to 1000ms)
      let attempts = 0;
      const maxAttempts = 100;
      while (!canvasRef.current && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10));
        attempts++;
      }

      if (cancelled || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(1);
        const scale = zoom / 100;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set dimensions precisely
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Ensure browser respects the size
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        // Store render task so we can cancel it if needed
        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        renderTaskRef.current = null;
      } catch (error: any) {
        // Ignore cancellation errors
        if (error?.name !== "RenderingCancelledException") {
          console.error("Error rendering PDF:", error);
        }
      }
    };

    // Initial render with a slight delay to ensure DOM stability
    const timeoutId = setTimeout(renderPDF, 50);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, zoom]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom((prev) => Math.max(25, Math.min(200, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setPanOffset((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/floor-plans">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {floorPlan?.building} - Floor {floorPlan?.floor_number}
            </h1>
            <p className="text-sm text-gray-500">{markers.length} cubicles</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              const toastId = toast.loading('⏳ Generating high-resolution PDF...', {
                position: 'top-center',
                className: 'bg-gray-900 text-white border-2 border-orange-500 mt-20',
              });

              try {
                const jsPDF = (await import('jspdf')).jsPDF;

                if (!pdfDoc) {
                  toast.error('❌ Floor plan not loaded', { id: toastId, position: 'top-center' });
                  return;
                }

                // Render PDF at print resolution (150 DPI)
                const PRINT_DPI = 150;
                const printScale = PRINT_DPI / 72;
                const page = await pdfDoc.getPage(1);
                const viewport = page.getViewport({ scale: printScale });

                // Render PDF to canvas
                const printCanvas = document.createElement('canvas');
                const ctx = printCanvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');

                printCanvas.width = viewport.width;
                printCanvas.height = viewport.height;

                const renderContext = {
                  canvasContext: ctx,
                  viewport: viewport,
                };

                await page.render(renderContext).promise;

                // Draw markers directly to the canvas for pixel-perfect centering
                markers.forEach((marker) => {
                  const size = markerSizes[marker.id];
                  if (!size) return;

                  const scale = printScale;
                  const fontSize = size.fontSize * scale * 0.7;
                  
                  // Calculate dimensions
                  const text = marker.assigned_user_name 
                    ? getAbbreviatedName(marker.assigned_user_name) 
                    : marker.marker_number;
                  
                  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                  const textMetrics = ctx.measureText(text);
                  const textWidth = textMetrics.width;
                  
                  // Pill width is at least the nominal width, but grows for names
                  const pillWidth = Math.max(size.diameter * 0.875 * scale, textWidth + 16);
                  const pillHeight = size.diameter * 0.75 * scale;
                  
                  const x = marker.pixel_x * scale;
                  const y = marker.pixel_y * scale;

                  // Draw the rounded rectangle
                  ctx.beginPath();
                  const rx = x - pillWidth / 2;
                  const ry = y - pillHeight / 2;
                  
                  // Draw shadow-like effect or just the pill
                  ctx.lineWidth = 2;
                  ctx.strokeStyle = marker.assigned_user_name ? '#ef4444' : '#22c55e';
                  ctx.fillStyle = marker.assigned_user_name ? '#fee2e2' : '#f0fdf4';
                  
                  // Manual roundRect for compatibility
                  const r = 6; // border radius
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

                  // Draw text with perfect baseline centering
                  ctx.fillStyle = marker.assigned_user_name ? '#991b1b' : '#166534';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(text, x, y);
                });

                // Directly convert the printCanvas to image data
                // No need for html2canvas here since we've already drawn the markers onto the ctx
                const imgData = printCanvas.toDataURL('image/png');

                // Generate PDF
                const pdf = new jsPDF({
                  orientation: 'landscape',
                  unit: 'mm',
                  format: 'a3',
                });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgWidth = pdfWidth - 10;
                const imgHeight = (printCanvas.height * imgWidth) / printCanvas.width;

                pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
                pdf.save(`${floorPlan?.building}-Floor${floorPlan?.floor_number}-marked.pdf`);
                toast.success('✅ PDF downloaded successfully!', { id: toastId, position: 'top-center' });
              } catch (error) {
                console.error('Error generating PDF:', error);
                toast.error('❌ Failed to generate PDF', { id: toastId, position: 'top-center' });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
            <Download className="w-4 h-4" />
            Download
          </button>
          <Link href={`/floor-plans/${params.id}/assign`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
              <Users className="w-4 h-4" />
              Assign Users
            </button>
          </Link>
          <Link href={`/floor-plans/${params.id}/markers`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
              <Edit2 className="w-4 h-4" />
              Manage Markers
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2">
        <button
          onClick={() => setZoom((prev) => Math.max(25, prev - 10))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom((prev) => Math.min(200, prev + 10))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="mx-4 text-sm text-gray-500">
          Scroll to zoom • Right-click drag to pan
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={floorPlanContainerRef}
          className="relative inline-block m-4"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            style={{
              cursor: isDragging ? "grabbing" : "grab",
            }}
          />

          {markers.map((marker) => {
            const size = markerSizes[marker.id];
            if (!size) return null;

            const scale = zoom / 100;
            const width = size.diameter * 0.875 * scale; // proportional to diameter
            const height = size.diameter * 0.75 * scale;
            const fontSize = size.fontSize * scale * 0.7; // reduced font size

            return (
              <div
                key={marker.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${(marker.pixel_x * scale)}px`,
                  top: `${(marker.pixel_y * scale)}px`,
                }}
              >
                <div
                  className={`rounded-full border-2 flex items-center justify-center font-semibold overflow-hidden px-1 py-0.5 whitespace-nowrap ${
                    marker.assigned_user_name
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

    </div>
  );
}