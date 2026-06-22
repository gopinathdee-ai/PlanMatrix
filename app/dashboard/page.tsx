"use client";

import { Navbar } from "@/components/navbar";
import { useEffect, useState } from "react";
import { Building2, Grid3x3, Users, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalFloorPlans: number;
  totalCubicles: number;
  occupiedCubicles: number;
  availableCubicles: number;
  occupancyRate: number;
  totalUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-600">Failed to load dashboard</div>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Floor Plans",
      value: stats.totalFloorPlans,
      icon: Building2,
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Total Cubicles",
      value: stats.totalCubicles,
      icon: Grid3x3,
      color: "from-purple-600 to-purple-700",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      title: "Occupied",
      value: stats.occupiedCubicles,
      icon: CheckCircle,
      color: "from-green-600 to-green-700",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      title: "Available",
      value: stats.availableCubicles,
      icon: AlertCircle,
      color: "from-orange-600 to-orange-700",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    },
    {
      title: "Occupancy Rate",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: "from-pink-600 to-pink-700",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-indigo-600 to-indigo-700",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your floor plan management system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`${card.bgColor} rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">{card.title}</h3>
                    <div className={`p-3 bg-gradient-to-br ${card.color} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {stats.totalCubicles > 0 && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Occupancy Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
                    <span className="text-sm font-bold text-gray-900">{stats.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-600 to-green-700 h-3 rounded-full transition-all"
                      style={{ width: `${stats.occupancyRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Occupied</p>
                    <p className="text-2xl font-bold text-green-700">{stats.occupiedCubicles}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Available</p>
                    <p className="text-2xl font-bold text-orange-700">{stats.availableCubicles}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">System Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Floor Plans</span>
                  <span className="text-lg font-bold text-blue-700">{stats.totalFloorPlans}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Total Cubicles</span>
                  <span className="text-lg font-bold text-purple-700">{stats.totalCubicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Users in System</span>
                  <span className="text-lg font-bold text-indigo-700">{stats.totalUsers}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
