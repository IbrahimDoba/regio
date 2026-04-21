"use client";

import React, { useState } from "react";
import MobileContainer from "@/components/layout/MobileContainer";
import BottomNav from "@/components/layout/BottomNav";
import ChatToast from "@/components/layout/ChatToast";
import CreateModal from "@/components/modals/CreateModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <ProtectedRoute verifiedOnly>
      <MobileContainer>
          {children}
          <BottomNav onOpenCreate={() => setIsCreateOpen(true)} />
          <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
          <ChatToast />
      </MobileContainer>
    </ProtectedRoute>
  );
}
