"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";

export default function UploadFloorPlanPage() {
  const [building, setBuilding] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.includes("pdf")) {
      toast.error("Please select a PDF file");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!building || !floorNumber || !file) {
      toast.error("Please fill in all fields");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("building", building);
      formData.append("floorNumber", floorNumber);
      formData.append("pdf", file);

      const res = await fetch("/api/floor-plans", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      toast.success("Floor plan uploaded successfully!");
      router.push("/floor-plans");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/floor-plans">
          <button className="text-blue-600 hover:text-blue-700 font-medium mb-8">
            ← Back to Floor Plans
          </button>
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Floor Plan
          </h1>
          <p className="text-gray-600 mb-8">
            Upload a PDF file of your floor plan to start placing cubicles
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Building Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Building Name *
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g., Building A"
                className="input"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Name of the building (e.g., "Building A", "Downtown Office")
              </p>
            </div>

            {/* Floor Number */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Floor Number *
              </label>
              <input
                type="text"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g., 2"
                className="input"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Floor level or identifier (e.g., "2", "Ground", "Level 3")
              </p>
            </div>

            {/* PDF Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Floor Plan PDF *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-gray-600">
                  {file ? (
                    <>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium mb-1">Click to upload PDF</p>
                      <p className="text-sm text-gray-500">
                        or drag and drop (max 50MB)
                      </p>
                    </>
                  )}
                </div>
              </button>
              <p className="text-xs text-gray-600 mt-1">
                Maximum file size: 50MB. PDF format only.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={uploading || !building || !floorNumber || !file}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload Floor Plan"}
              </button>
              <Link href="/floor-plans" className="flex-1">
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
