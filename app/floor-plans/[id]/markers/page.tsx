"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Edit2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";

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

export default function MarkerPlacementPage({
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ marker_number: "", pixel_x: 0, pixel_y: 0 });
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [confirmDeleteMarker, setConfirmDeleteMarker] = useState<string | null>(null);
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

    async function renderPDF() {
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
  }, [pdfDoc, zoom]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingMarker) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pixelX = Math.round(x * 100 / zoom);
    const pixelY = Math.round(y * 100 / zoom);

    setFormData({
      marker_number: "",
      pixel_x: pixelX,
      pixel_y: pixelY,
    });
    setShowForm(true);
  };

  const handleCreateMarker = async () => {
    if (!formData.marker_number.trim()) {
      toast.error("Marker number is required");
      return;
    }

    try {
      const response = await fetch(
        `/api/floor-plans/${params.id}/markers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marker_number: formData.marker_number,
            pixel_x: formData.pixel_x,
            pixel_y: formData.pixel_y,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const newMarker = await response.json();
      setMarkers([...markers, newMarker]);
      setShowForm(false);
      setFormData({ marker_number: "", pixel_x: 0, pixel_y: 0 });
      toast.success("Marker created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create marker");
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    try {
      const response = await fetch(
        `/api/floor-plans/${params.id}/markers/${markerId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete marker");

      setMarkers(markers.filter((m) => m.id !== markerId));
      toast.success("Marker deleted");
      setConfirmDeleteMarker(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete marker");
    }
  };

  const handleUpdateMarker = async () => {
    if (!editingMarker || !formData.marker_number.trim()) {
      toast.error("Marker number is required");
      return;
    }

    try {
      const response = await fetch(
        `/api/floor-plans/${params.id}/markers/${editingMarker.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marker_number: formData.marker_number,
            pixel_x: formData.pixel_x,
            pixel_y: formData.pixel_y,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setMarkers(
        markers.map((m) =>
          m.id === editingMarker.id
            ? { ...m, marker_number: formData.marker_number, pixel_x: formData.pixel_x, pixel_y: formData.pixel_y }
            : m
        )
      );
      setEditingMarker(null);
      setShowForm(false);
      setFormData({ marker_number: "", pixel_x: 0, pixel_y: 0 });
      toast.success("Marker updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update marker");
    }
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
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href={`/floor-plans/${params.id}`}>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold">Manage Markers</h1>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Click to place marker • Right-click drag to pan
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((prev) => Math.max(25, prev - 10))}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Zoom out"
              >
                −
              </button>
              <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom((prev) => Math.min(200, prev + 10))}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          <div
            ref={containerRef}
            className="flex-1 overflow-auto"
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
                onClick={handleCanvasClick}
                className="bg-white shadow-lg"
                style={{
                  cursor: isDragging ? "grabbing" : "crosshair",
                }}
              />

              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${(marker.pixel_x * zoom) / 100}px`,
                    top: `${(marker.pixel_y * zoom) / 100}px`,
                  }}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold overflow-hidden ${
                    marker.assigned_user_name
                      ? "border-red-500 bg-red-100 text-red-700"
                      : "border-blue-500 bg-blue-100 text-blue-700"
                  }`}
                  style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                    <span className="text-center px-0.5 line-clamp-1 text-[9px] font-semibold">
                      {marker.assigned_user_name
                        ? marker.assigned_user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : marker.marker_number}
                    </span>
                  </div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    {marker.assigned_user_name ? `${marker.assigned_user_name} (${marker.marker_number})` : `${marker.marker_number} - unassigned`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          <div className="bg-gray-50 border-b px-4 py-3 font-semibold">
            Markers ({markers.length})
          </div>

          {showForm && (
            <div className="border-b p-4 bg-blue-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Marker Number</label>
                  <input
                    type="text"
                    value={formData.marker_number}
                    onChange={(e) => setFormData({ ...formData, marker_number: e.target.value })}
                    placeholder="e.g., 1509"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <div>X: {formData.pixel_x}</div>
                  <div>Y: {formData.pixel_y}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={editingMarker ? handleUpdateMarker : handleCreateMarker}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {editingMarker ? "Update" : "Create"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingMarker(null);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {markers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No markers yet.
              </div>
            ) : (
              <div className="divide-y">
                {markers.map((marker) => (
                  <div key={marker.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{marker.marker_number}</div>
                        <div className="text-xs text-gray-500">
                          ({marker.pixel_x}, {marker.pixel_y})
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingMarker(marker);
                            setFormData({
                              marker_number: marker.marker_number,
                              pixel_x: marker.pixel_x,
                              pixel_y: marker.pixel_y,
                            });
                            setShowForm(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteMarker(marker.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {confirmDeleteMarker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Marker?</h3>
              <p className="text-gray-600 mb-6">
                This will delete the marker and remove any assignments. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDeleteMarker(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMarker(confirmDeleteMarker)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}