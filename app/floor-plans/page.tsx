"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";

interface FloorPlan {
  id: string;
  building: string;
  floor_number: string;
  pdf_filename: string;
  pdf_url: string;
  uploaded_at: string;
  marker_count: number;
  occupied_count: number;
}

export default function FloorsPage() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchFloorPlans = async () => {
      try {
        const res = await fetch("/api/floor-plans");
        if (!res.ok) throw new Error("Failed to fetch floor plans");
        const data = await res.json();
        setFloorPlans(data);
      } catch (error) {
        toast.error("Failed to load floor plans");
      } finally {
        setLoading(false);
      }
    };

    fetchFloorPlans();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/floor-plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setFloorPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success("Floor plan deleted");
    } catch (error) {
      toast.error("Failed to delete floor plan");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Floor Plans</h1>
            <p className="text-gray-600 mt-2">Manage your building floor plans</p>
          </div>
          <Link href="/floor-plans/upload">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
              + Upload Floor Plan
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading floor plans...</p>
          </div>
        ) : floorPlans.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No floor plans yet</p>
            <Link href="/floor-plans/upload">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Upload your first floor plan
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {floorPlans.map((plan) => (
              <div key={plan.id} className="card">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {plan.building}
                  </h3>
                  <p className="text-sm text-gray-600">Floor {plan.floor_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-gray-200">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {plan.marker_count}
                    </p>
                    <p className="text-xs text-gray-600">Cubicles</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {plan.marker_count - plan.occupied_count}
                    </p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Uploaded {new Date(plan.uploaded_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <Link href={`/floor-plans/${plan.id}`} className="flex-1">
                    <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                      View
                    </button>
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(plan.id)}
                    disabled={deleting === plan.id}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {deleting === plan.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Floor Plan?</h3>
              <p className="text-gray-600 mb-6">
                This will delete the floor plan and all its markers. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting === confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {deleting === confirmDelete ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
