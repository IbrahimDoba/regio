"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  /* Prevent hydration mismatch by only rendering after mount */
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  React.useEffect(() => {
    if (mounted && !isLoading && (!user || !user.is_system_admin)) {
      router.push("/");
    }
  }, [user, isLoading, router, mounted]);

  // Show loading while checking auth or mounting
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cb348]"></div>
          <p className="mt-4 text-[#666] text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || !user.is_system_admin) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] overflow-hidden text-[#333]">
      {/* Mobile Blocker */}
      <div className="flex flex-col justify-center items-center h-screen text-center p-5 bg-white min-[1280px]:hidden">
        <div className="text-[60px] text-[#d32f2f] mb-5">🖥️</div>
        <div className="text-[24px] font-[800] mb-[10px]">Desktop Only</div>
        <p className="text-[14px] text-[#666]">
          The Administration Dashboard requires a larger screen resolution (min.
          1280 x 768).
          <br />
          <br />
          Please log in from a Desktop PC.
        </p>
      </div>

      {/* Desktop Dashboard */}
      <div className="hidden min-[1280px]:flex w-full h-full">
        <AdminSidebar />
        <div className="flex-grow overflow-y-auto flex flex-col">
          <AdminHeader />
          <main className="flex-grow p-[30px]">{children}</main>
        </div>
      </div>
    </div>
  );
}
