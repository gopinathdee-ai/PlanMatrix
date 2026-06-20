"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";

interface ImportResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const downloadTemplate = () => {
    const csvContent =
      "email,name,department\nuser1@company.com,John Doe,Engineering\nuser2@company.com,Jane Smith,Sales\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/users/bulk-import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Import failed");
      }

      const importResult = await res.json();
      setResult(importResult);

      if (importResult.error_count === 0) {
        toast.success(
          `Successfully imported ${importResult.success_count} users!`
        );
        setTimeout(() => {
          router.push("/users");
        }, 1500);
      } else {
        toast.error(
          `Imported ${importResult.success_count} users with ${importResult.error_count} errors`
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/users">
          <button className="text-blue-600 hover:text-blue-700 font-medium mb-8">
            ← Back to Users
          </button>
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Import Users
          </h1>
          <p className="text-gray-600 mb-8">
            Upload a CSV file to import multiple users at once
          </p>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-3">
                  Start with our template to ensure proper formatting:
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  📥 Download CSV Template
                </button>
              </div>

              {/* CSV Format Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  CSV Format Requirements:
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>
                    • First row must be headers: <code className="bg-white px-2 py-1 rounded border border-gray-300">email,name,department</code>
                  </li>
                  <li>
                    • <strong>Email</strong> (required): Valid email address,
                    must be unique
                  </li>
                  <li>• <strong>Name</strong> (required): User full name</li>
                  <li>
                    • <strong>Department</strong> (optional): Department or team
                    name
                  </li>
                </ul>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  CSV File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
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
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium mb-1">Click to upload CSV</p>
                        <p className="text-sm text-gray-500">
                          or drag and drop
                        </p>
                      </>
                    )}
                  </div>
                </button>
                <p className="text-xs text-gray-600 mt-1">
                  CSV format only. Maximum 10MB.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={importing || !file}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? "Importing..." : "Import Users"}
                </button>
                <Link href="/users" className="flex-1">
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-sm text-green-600 font-medium">
                    Successfully Created
                  </p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {result.success_count}
                  </p>
                </div>
                {result.error_count > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-sm text-red-600 font-medium">Errors</p>
                    <p className="text-3xl font-bold text-red-700 mt-2">
                      {result.error_count}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Table */}
              {result.error_count > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      Import Errors ({result.error_count})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Row
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.errors.map((error, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                              {error.row}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700">
                              {error.email}
                            </td>
                            <td className="px-6 py-3 text-sm text-red-600 font-medium">
                              {error.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Link href="/users" className="flex-1">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
                    Go to Users
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  Import More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
