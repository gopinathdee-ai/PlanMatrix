"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
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
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    async function renderPDF() {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: printScale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

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

  // Sort markers by number for legend
  const sortedMarkers = [...markers].sort((a, b) => {
    const aNum = parseInt(a.marker_number) || 0;
    const bNum = parseInt(b.marker_number) || 0;
    return aNum - bNum;
  });

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
          .legend-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
          }
          .legend-table th,
          .legend-table td {
            border: 1px solid #000;
            padding: 4pt 6pt;
            text-align: left;
          }
          .legend-table thead {
            display: table-header-group;
          }
          .legend-table tr {
            break-inside: avoid;
          }
          .legend-container {
            break-before: page;
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
              onClick={() => window.print()}
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
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-8 overflow-auto">
          <div className="relative inline-block">
            <canvas ref={canvasRef} className="bg-white" />

            {/* Marker overlays */}
            {markers.map((marker) => {
              const size = markerSizes[marker.id];
              if (!size) return null;

              return (
                <div
                  key={marker.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(marker.pixel_x * printScale)}px`,
                    top: `${(marker.pixel_y * printScale)}px`,
                    width: `${size.diameter}px`,
                    height: `${size.diameter}px`,
                  }}
                >
                  <div
                    className="rounded-full border-2 flex items-center justify-center font-bold overflow-hidden w-full h-full"
                    style={{
                      borderColor: marker.assigned_user_name ? "#ef4444" : "#22c55e",
                      backgroundColor: marker.assigned_user_name ? "#fee2e2" : "#f0fdf4",
                      color: marker.assigned_user_name ? "#991b1b" : "#166534",
                      fontSize: `${size.fontSize}px`,
                      fontFamily: "var(--font-roboto-condensed)",
                    }}
                  >
                    <span className="text-center px-1 line-clamp-1">
                      {marker.marker_number}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend table */}
        <div className="legend-container">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cubicle Legend</h2>
          <table className="legend-table">
            <thead>
              <tr>
                <th>Marker #</th>
                <th>Assigned To</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {sortedMarkers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500">
                    No cubicles mapped on this floor plan
                  </td>
                </tr>
              ) : (
                sortedMarkers.map((marker) => (
                  <tr key={marker.id}>
                    <td className="font-semibold">{marker.marker_number}</td>
                    <td>
                      {marker.assigned_user_name || "— unassigned —"}
                    </td>
                    <td>{marker.assigned_user_email || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
}
