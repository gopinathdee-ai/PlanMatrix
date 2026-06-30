"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { ChevronLeft, ZoomIn, ZoomOut } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import { getMarkerSize, getAbbreviatedName } from "@/lib/markerDisplay";

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
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_user_email?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function ManualAssignmentPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    async function loadFloorPlanAndMarkers() {
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

        const usersRes = await fetch(`/api/users?unassigned=true`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUnassignedUsers(usersData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading floor plan:", error);
        toast.error("Failed to load floor plan");
        setLoading(false);
      }
    }

    loadFloorPlanAndMarkers();
  }, [params.id]);

  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    const renderPDF = async () => {
      let attempts = 0;
      const maxAttempts = 50;
      while (!canvasRef.current && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        attempts++;
      }

      if (cancelled || !canvasRef.current) {
        return;
      }

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

        await page.render(renderContext).promise;
      } catch (error) {
        console.error("Error rendering PDF:", error);
      }
    };

    renderPDF();

    return () => {
      cancelled = true;
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

  const handleMarkerClick = (marker: Marker) => {
    setSelectedMarker(marker);
    setSelectedUserId("");
    setModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedMarker || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      const response = await fetch(`/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marker_id: selectedMarker.id,
          user_id: selectedUserId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign cubicle");
      }

      // Refresh markers to show updated assignment with user name
      const markersRes = await fetch(`/api/floor-plans/${params.id}/markers`);
      if (markersRes.ok) {
        const markerData = await markersRes.json();
        setMarkers(markerData);
      }

      // Refresh unassigned users
      const usersRes = await fetch(`/api/users/unassigned`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUnassignedUsers(usersData);
      }

      toast.success("Cubicle assigned successfully");
      setModalOpen(false);
      setSelectedMarker(null);
      setSelectedUserId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign cubicle");
    }
  };

  const handleReassign = async () => {
    if (!selectedMarker || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      const response = await fetch(`/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marker_id: selectedMarker.id,
          user_id: selectedUserId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reassign cubicle");
      }

      const assignment = await response.json();

      setMarkers(
        markers.map((m) =>
          m.id === selectedMarker.id
            ? {
                ...m,
                assigned_user_id: assignment.user_id,
                assigned_user_name: assignment.user_name,
                assigned_user_email: assignment.user_email,
              }
            : m
        )
      );

      toast.success("Cubicle reassigned successfully");
      setModalOpen(false);
      setSelectedMarker(null);
      setSelectedUserId("");

      // Refresh unassigned users
      try {
        const usersRes = await fetch(`/api/users?unassigned=true`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUnassignedUsers(usersData);
        }
      } catch (err) {
        console.error("Error refreshing users:", err);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reassign cubicle");
    }
  };

  const handleRemove = async () => {
    if (!selectedMarker?.assigned_user_id) {
      toast.error("No assignment to remove");
      return;
    }

    try {
      const response = await fetch(
        `/api/assignments/${selectedMarker.assigned_user_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove assignment");
      }

      setMarkers(
        markers.map((m) =>
          m.id === selectedMarker.id
            ? {
                ...m,
                assigned_user_id: undefined,
                assigned_user_name: undefined,
                assigned_user_email: undefined,
              }
            : m
        )
      );

      toast.success("Assignment removed");
      setModalOpen(false);
      setSelectedMarker(null);
      setSelectedUserId("");

      // Refresh unassigned users
      try {
        const usersRes = await fetch(`/api/users?unassigned=true`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUnassignedUsers(usersData);
        }
      } catch (err) {
        console.error("Error refreshing users:", err);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove assignment");
    }
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
            <p className="text-sm text-gray-500">Assign cubicles to users</p>
          </div>
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
          Click a marker to assign • Scroll to zoom • Right-click drag to pan
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
            const { width, height, fontSize } = getMarkerSize(32, zoom);
            return (
              <div
                key={marker.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${(marker.pixel_x * zoom) / 100}px`,
                  top: `${(marker.pixel_y * zoom) / 100}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkerClick(marker);
                }}
              >
                <div
                  className={`rounded-full border-2 flex items-center justify-center font-bold transition-all hover:scale-125 w-full h-full overflow-hidden ${
                    marker.assigned_user_name
                      ? "border-green-500 bg-green-100 text-green-700"
                      : "border-blue-500 bg-blue-100 text-blue-700"
                  }`}
                  style={{ fontFamily: "var(--font-roboto-condensed)", fontSize: `${fontSize}px` }}
                >
                  <span className="text-center px-1 line-clamp-1">
                    {marker.assigned_user_name
                      ? getAbbreviatedName(marker.assigned_user_name)
                      : marker.marker_number}
                  </span>
                </div>
                {marker.assigned_user_name && (
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-40">
                    {marker.assigned_user_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && selectedMarker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Marker {selectedMarker.marker_number}
            </h3>

            {selectedMarker.assigned_user_name ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Currently assigned to:</div>
                  <div className="font-semibold text-gray-900">
                    {selectedMarker.assigned_user_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedMarker.assigned_user_email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reassign to:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a user...</option>
                    {unassignedUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemove}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={!selectedUserId}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reassign
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg text-sm text-gray-600">
                  This cubicle is currently unassigned.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a user:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a user...</option>
                    {unassignedUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedUserId}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
