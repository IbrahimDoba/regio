"use client";

import React from "react";
import {
  FaUsers,
  FaUserCheck,
  FaClock,
  FaCoins,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { AdminStatsResponse } from "@/lib/api/types";
import ContentCard from "@/components/admin/ui/ContentCard";

interface StatsGridProps {
  stats: AdminStatsResponse | undefined;
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[120px] bg-white rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      {/* Total Users */}
      <ContentCard className="!p-5 flex items-center justify-between">
        <div>
          <p className="text-[#888] text-[12px] font-bold uppercase mb-1">
            Total Users
          </p>
          <div className="text-[28px] font-[800] text-[#333]">
            {stats.total_users}
          </div>
        </div>
        <div className="w-[50px] h-[50px] rounded-full bg-[#f0f2f5] flex items-center justify-center text-[#333] text-[20px]">
          <FaUsers />
        </div>
      </ContentCard>

      {/* Active vs Pending */}
      <ContentCard className="!p-5 flex items-center justify-between">
        <div>
          <p className="text-[#888] text-[12px] font-bold uppercase mb-1">
            Active / Pending
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-[800] text-[#8cb348]">
              {stats.active_users}
            </span>
            <span className="text-[14px] text-[#f57c00]">
              / {stats.verification_pending_users}
            </span>
          </div>
        </div>
        <div className="w-[50px] h-[50px] rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#2e7d32] text-[20px]">
          <FaUserCheck />
        </div>
      </ContentCard>

      {/* Time Volume */}
      <ContentCard className="!p-5 flex items-center justify-between">
        <div>
          <p className="text-[#888] text-[12px] font-bold uppercase mb-1">
            Total Time Volume
          </p>
          <div className="text-[28px] font-[800] text-[#333]">
            {stats.total_time_volume}{" "}
            <span className="text-[14px] font-normal text-[#888]">hrs</span>
          </div>
        </div>
        <div className="w-[50px] h-[50px] rounded-full bg-[#fff3e0] flex items-center justify-center text-[#f57c00] text-[20px]">
          <FaClock />
        </div>
      </ContentCard>

      {/* Regio Volume */}
      <ContentCard className="!p-5 flex items-center justify-between">
        <div>
          <p className="text-[#888] text-[12px] font-bold uppercase mb-1">
            Total Regio Vol.
          </p>
          <div className="text-[28px] font-[800] text-[#333]">
            {parseFloat(stats.total_regio_volume).toFixed(0)}
          </div>
        </div>
        <div className="w-[50px] h-[50px] rounded-full bg-[#e3f2fd] flex items-center justify-center text-[#1565c0] text-[20px]">
          <FaCoins />
        </div>
      </ContentCard>

      {/* Optional: Row 2 for Disputes if needed, or included in Active/Pending */}
      {stats.pending_disputes > 0 && (
        <ContentCard className="!p-5 flex items-center justify-between border-l-4 border-l-[#d32f2f]">
          <div>
            <p className="text-[#d32f2f] text-[12px] font-bold uppercase mb-1">
              Action Required
            </p>
            <div className="text-[28px] font-[800] text-[#d32f2f]">
              {stats.pending_disputes}{" "}
              <span className="text-[14px] font-normal text-[#333]">
                Disputes
              </span>
            </div>
          </div>
          <div className="w-[50px] h-[50px] rounded-full bg-[#ffebee] flex items-center justify-center text-[#d32f2f] text-[20px]">
            <FaTriangleExclamation />
          </div>
        </ContentCard>
      )}
    </div>
  );
}
