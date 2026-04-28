"use client";

import React, { useState } from "react";
import MobileContainer from "@/components/layout/MobileContainer";
import BottomNav from "@/components/layout/BottomNav";
import ChatToast from "@/components/layout/ChatToast";
import CreateModal from "@/components/modals/CreateModal";
import MenuDrawer from "@/components/layout/MenuDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <ProtectedRoute verifiedOnly>
      <MobileContainer>
          {children}
          <BottomNav
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenMenu={() => setIsMenuOpen(true)}
          />
          <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
          <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
          <ChatToast />
      </MobileContainer>
    </ProtectedRoute>
  );
}
