"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { toast } from "sonner";
import Link from "next/link";

export default function AddUserPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const checkDuplicateEmail = async (value: string) => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return false;
      const users = await res.json();
      return !users.some((u: any) => u.email === value);
    } catch {
      return false;
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const newErrors = { ...errors };

    if (!value) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(value)) {
      newErrors.email = "Please enter a valid email address";
    } else {
      delete newErrors.email;
    }

    setErrors(newErrors);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const newErrors = { ...errors };

    if (!value) {
      newErrors.name = "Name is required";
    } else {
      delete newErrors.name;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    if (!name) newErrors.name = "Name is required";
    if (email && !validateEmail(email))
      newErrors.email = "Please enter a valid email address";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before submitting");
      return;
    }

    // Check for duplicate email
    const isUnique = await checkDuplicateEmail(email);
    if (!isUnique) {
      setErrors({ email: "This email is already registered" });
      toast.error("This email is already registered");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          department: department || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success("User created successfully!");
      router.push("/users");
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/users">
          <button className="text-blue-600 hover:text-blue-700 font-medium mb-8">
            ← Back to Users
          </button>
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New User</h1>
          <p className="text-gray-600 mb-8">
            Create a new user account for your workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="user@company.com"
                className={`input ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                required
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Must be a valid email address. Duplicate emails are not allowed.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="John Doe"
                className={`input ${errors.name ? "border-red-500 focus:ring-red-500" : ""}`}
                required
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Full name of the user
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Engineering, Sales, Marketing"
                className="input"
              />
              <p className="text-xs text-gray-600 mt-1">
                Optional. Department or team name
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting || !email || !name}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create User"}
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
        </div>
      </div>
    </div>
  );
}
