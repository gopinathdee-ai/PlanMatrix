"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ChevronLeft, ZoomIn, ZoomOut, Edit2, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import { getMarkerSize, getInitials } from "@/lib/markerDisplay";

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
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<any>(null);

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

      // Wait for canvas to be mounted (up to 500ms)
      let attempts = 0;
      const maxAttempts = 50;
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

        canvas.width = viewport.width;
        canvas.height = viewport.height;

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

    renderPDF();

    return () => {
      cancelled = true;
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
          <Link href={`/floor-plans/${params.id}/print`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
              <Edit2 className="w-4 h-4" />
              Print
            </button>
          </Link>
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
            const { diameter, fontSize } = getMarkerSize(32, zoom);
            return (
              <div
                key={marker.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${(marker.pixel_x * zoom) / 100}px`,
                  top: `${(marker.pixel_y * zoom) / 100}px`,
                  width: `${diameter}px`,
                  height: `${diameter}px`,
                }}
              >
                <div
                  className={`rounded-full border-2 flex items-center justify-center font-bold overflow-hidden w-full h-full ${
                    marker.assigned_user_name
                      ? "border-red-500 bg-red-100 text-red-700"
                      : "border-green-500 bg-green-100 text-green-700"
                  }`}
                  style={{ fontFamily: "var(--font-roboto-condensed)", fontSize: `${fontSize}px` }}
                >
                  <span className="text-center px-1 line-clamp-1">
                    {marker.assigned_user_name
                      ? getInitials(marker.assigned_user_name)
                      : marker.marker_number}
                  </span>
                </div>
                {marker.assigned_user_name && (
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    {marker.marker_number}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}