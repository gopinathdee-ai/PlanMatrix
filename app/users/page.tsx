"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  department: string | null;
  status: string;
  assigned_cubicle: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        console.log("Fetched users from API:", data);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "inactive":
        return "badge-danger";
      default:
        return "badge-warning";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage workspace users and assignments</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/users/bulk-import" className="flex-1 sm:flex-none">
              <button className="w-full px-4 sm:px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold shadow-md transition-all">
                📥 Bulk Import
              </button>
            </Link>
            <Link href="/users/add" className="flex-1 sm:flex-none">
              <button className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                + Add User
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No users yet</p>
            <Link href="/users/add">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Add your first user
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Assigned Cubicle
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.department || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`badge ${getStatusBadgeColor(user.status || "active")}`}>
                            {(user.status || "active").charAt(0).toUpperCase() +
                              (user.status || "active").slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {user.assigned_cubicle || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            disabled={deleting === user.id}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
                          >
                            {deleting === user.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {users.map((user) => (
                <div key={user.id} className="card p-4 flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <span className={`inline-block badge ${getStatusBadgeColor(user.status || "active")}`}>
                          {(user.status || "active").charAt(0).toUpperCase() +
                            (user.status || "active").slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned Cubicle</p>
                        <p className="text-sm text-gray-700">{user.assigned_cubicle || "-"}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(user.id)}
                    disabled={deleting === user.id}
                    className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Delete user"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete the user. This action cannot be undone.
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
