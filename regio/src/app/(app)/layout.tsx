"use client";

import React, { useState } from "react";
import MobileContainer from "@/components/layout/MobileContainer";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CreateModal from "@/components/modals/CreateModal";
import FilterPanel from "@/components/feed/FilterPanel";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { posts } from "@/data/mockData";
import { CategoryColor } from "@/lib/types";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <ProtectedRoute>
      <MobileContainer>
          {children}
          <BottomNav onOpenCreate={() => setIsCreateOpen(true)} />
          <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </MobileContainer>
    </ProtectedRoute>
  );
}
