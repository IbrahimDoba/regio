"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PendingLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
