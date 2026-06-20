"use client";

import { useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    marker_number: string;
    user_email: string;
    error: string;
  }>;
}

const EXAMPLE_CSV = `building,floor,marker_number,user_email
Building A,1,1001,john.doe@example.com
Building A,1,1002,jane.smith@example.com
Building A,1,1003,bob.johnson@example.com
Building A,2,2001,alice.williams@example.com
Building B,1,1004,charlie.brown@example.com`;

export default function BulkImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
    } else {
      toast.error("Please drop a CSV file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    const element = document.createElement("a");
    const file = new Blob([EXAMPLE_CSV], { type: "text/csv" });
    element.href = URL.createObjectURL(file);
    element.download = "assignments_template.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Template downloaded");
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/assignments/bulk-import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import assignments");
      }

      const importResult = await response.json();
      setResult(importResult);

      if (importResult.success > 0) {
        toast.success(
          `${importResult.success} assignment${
            importResult.success !== 1 ? "s" : ""
          } imported successfully`
        );
      }
      if (importResult.errors.length > 0) {
        toast.error(
          `${importResult.errors.length} error${
            importResult.errors.length !== 1 ? "s" : ""
          } found during import`
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import assignments");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Navbar />

        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/assignments">
              <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Bulk Import Results</h1>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col">
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="text-sm text-green-700 font-medium">
                  Successful Imports
                </div>
                <div className="text-4xl font-bold text-green-900 mt-2">
                  {result.success}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="text-sm text-red-700 font-medium">
                  Errors
                </div>
                <div className="text-4xl font-bold text-red-900 mt-2">
                  {result.errors.length}
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-red-50 border-b border-red-200 px-6 py-4">
                  <h3 className="font-semibold text-red-900">Errors</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Row
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Marker
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          User Email
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Error Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.errors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {error.row}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {error.marker_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {error.user_email}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-700">
                            {error.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-8">
            <Link href="/assignments" className="flex-1">
              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Go to Assignments
              </button>
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              Import More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold">Bulk Import Assignments</h1>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col">
        <div className="space-y-8 flex-1">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              CSV Template
            </h2>
            <p className="text-gray-600 mb-4">
              Download the template to see the required CSV format.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Upload CSV File
            </h2>
            <p className="text-gray-600 mb-4">
              Your CSV must have columns: building, floor, marker_number, user_email
            </p>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="space-y-2"
              >
                <div className="text-4xl">📁</div>
                <div className="font-semibold text-gray-900">
                  {file ? file.name : "Drop CSV file here or click to browse"}
                </div>
                <div className="text-sm text-gray-600">
                  {file ? (
                    <span className="text-green-600 font-medium">
                      File selected
                    </span>
                  ) : (
                    "CSV files only"
                  )}
                </div>
              </div>
            </div>
          </div>

          {file && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700">
                Selected file: <span className="font-semibold">{file.name}</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-8">
          <Link href="/assignments" className="flex-1">
            <button className="w-full px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
