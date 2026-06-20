"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";
import { Edit2, Trash2 } from "lucide-react";

interface Assignment {
  id: string;
  user_email: string;
  user_name: string;
  marker_number: string;
  building: string;
  floor: string;
  assigned_date: string;
  source: string;
}

interface Marker {
  id: string;
  marker_number: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Reassign modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(
    null
  );
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch("/api/assignments");
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        setAssignments(data);

        // Fetch all markers for reassignment
        const markersRes = await fetch("/api/floor-plans");
        if (markersRes.ok) {
          const floorPlans = await markersRes.json();
          let allMarkers: Marker[] = [];
          for (const plan of floorPlans) {
            try {
              const res = await fetch(`/api/floor-plans/${plan.id}/markers`);
              if (res.ok) {
                const markerData = await res.json();
                allMarkers = [
                  ...allMarkers,
                  ...markerData.map((m: any) => ({
                    id: m.id,
                    marker_number: m.marker_number,
                  })),
                ];
              }
            } catch (err) {
              console.error("Error fetching markers:", err);
            }
          }
          setMarkers(allMarkers);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast.error("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assignment removed");
    } catch (error) {
      toast.error("Failed to remove assignment");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleReassign = async () => {
    if (!selectedAssignment || !selectedMarkerId) {
      toast.error("Please select a marker");
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${selectedAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marker_id: selectedMarkerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reassign");
      }

      const updatedAssignment = await response.json();
      const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

      setAssignments(
        assignments.map((a) =>
          a.id === selectedAssignment.id
            ? {
                ...a,
                marker_number: selectedMarker?.marker_number || a.marker_number,
              }
            : a
        )
      );

      toast.success("Assignment updated");
      setReassignModalOpen(false);
      setSelectedAssignment(null);
      setSelectedMarkerId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reassign");
    }
  };

  const openReassignModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSelectedMarkerId("");
    setReassignModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600 mt-2">
              Manage user cubicle assignments
            </p>
          </div>
          <Link href="/floor-plans">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
              + New Assignment
            </button>
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No assignments yet</p>
            <Link href="/floor-plans">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Create your first assignment
              </button>
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      User Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      User Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Marker
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Building
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Floor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Assigned Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {assignment.user_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {assignment.user_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {assignment.marker_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {assignment.building}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {assignment.floor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(assignment.assigned_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {assignment.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openReassignModal(assignment)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Edit assignment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(assignment.id)}
                            disabled={deleting === assignment.id}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Remove Assignment?
              </h3>
              <p className="text-gray-600 mb-6">
                This will remove the user from the cubicle assignment. This action cannot be
                undone.
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
                  {deleting === confirmDelete ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {reassignModalOpen && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Reassign {selectedAssignment.user_name}
              </h3>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Currently assigned to:</div>
                  <div className="font-semibold text-gray-900">
                    {selectedAssignment.marker_number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedAssignment.building} - Floor {selectedAssignment.floor}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select new marker:
                  </label>
                  <select
                    value={selectedMarkerId}
                    onChange={(e) => setSelectedMarkerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a marker...</option>
                    {markers.map((marker) => (
                      <option key={marker.id} value={marker.id}>
                        {marker.marker_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setReassignModalOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={!selectedMarkerId}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
