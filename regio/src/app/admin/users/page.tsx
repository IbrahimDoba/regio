"use client";

import React, { useState, useEffect } from "react";
import {
  useListUsersRich,
  useUpdateUserDetails,
  useDashboardStats,
} from "@/lib/api";
import ContentCard from "@/components/admin/ui/ContentCard";
import UserTable from "@/components/admin/users/UserTable";
import EditUserModal from "@/components/admin/users/EditUserModal";
import StatsGrid from "@/components/admin/dashboard/StatsGrid";
import { useDialog } from "@/context/DialogContext";

interface UserAdminView {
  user_code: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  trust_level: "T1" | "T2" | "T3" | "T4" | "T5" | "T6";
  is_active: boolean;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  balance_time: number;
  balance_regio: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserAdminView | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users from API
  const {
    data: listData,
    isLoading: listLoading,
    error,
  } = useListUsersRich({
    q: debouncedSearch,
    skip: 0,
    limit: 50,
  });

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();

  const updateUserMutation = useUpdateUserDetails();
  const dialog = useDialog();

  const handleEditUser = (user: UserAdminView) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleVerifyUser = (userCode: string) => {
    updateUserMutation.mutate(
      {
        userCode,
        data: { verification_status: "VERIFIED" },
      },
      {
        onSuccess: () => {
          dialog.alert("User Verified", `User ${userCode} verified successfully!`);
        },
        onError: (error) => {
          console.error("Verification error:", error);
          dialog.alert("Error", "Failed to verify user");
        },
      }
    );
  };

  const handleRejectUser = async (userCode: string) => {
    if (!await dialog.confirm("Reject User", `Reject verification for user ${userCode}?`)) return;
    updateUserMutation.mutate(
      {
        userCode,
        data: { verification_status: "REJECTED" },
      },
      {
        onSuccess: () => {
          dialog.alert("User Rejected", `User ${userCode} rejected.`);
        },
        onError: (error) => {
          console.error("Rejection error:", error);
          dialog.alert("Error", "Failed to reject user");
        },
      }
    );
  };

  const handleSaveUser = (userCode: string, data: Record<string, unknown>) => {
    updateUserMutation.mutate(
      { userCode, data },
      {
        onSuccess: () => {
          dialog.alert("User Updated", "User updated successfully!");
        },
        onError: (error) => {
          console.error("Update error:", error);
          dialog.alert("Error", "Failed to update user");
        },
      }
    );
  };

  if (listLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cb348]"></div>
          <p className="mt-4 text-[#666] text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[#d32f2f]">
          <p className="text-lg font-bold">Error loading users</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dashboard Stats */}
      <StatsGrid stats={statsData} isLoading={statsLoading} />

      {/* Search Bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search User (ID, Name, Email)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-[10px] rounded border border-[#ccc] w-full"
        />
      </div>

      {/* User Table */}
      <ContentCard title="User List & Balances">
        {listData && listData.data.length > 0 ? (
          <UserTable
            users={listData.data}
            onEditUser={handleEditUser}
            onVerifyUser={handleVerifyUser}
            onRejectUser={handleRejectUser}
          />
        ) : (
          <p className="text-center text-[#888] py-8">No users found</p>
        )}
      </ContentCard>

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
      />
    </>
  );
}
