"use client";

import React, { useState, useEffect } from "react";
import {
  useListUsersRich,
  useUpdateUserDetails,
  useDashboardStats,
} from "@/lib/api";
import type { AdminUserUpdate } from "@/lib/api/types";
import ContentCard from "@/components/admin/ui/ContentCard";
import UserTable from "@/components/admin/users/UserTable";
import EditUserModal from "@/components/admin/users/EditUserModal";
import StatsGrid from "@/components/admin/dashboard/StatsGrid";
import { useDialog } from "@/context/DialogContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

interface UserAdminView {
  user_code: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  trust_level: "T1" | "T2" | "T3" | "T4" | "T5" | "T6";
  is_active: boolean;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED" | "ACTION_REQUIRED";
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
  const toast = useToast();
  const { t } = useLanguage();

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
          toast.success(t.admin.users.toast_verify_success.replace('{userCode}', userCode));
        },
        onError: (error) => {
          console.error("Verification error:", error);
          toast.error(t.admin.users.toast_verify_error);
        },
      }
    );
  };

  const handleRejectUser = async (userCode: string) => {
    if (!await dialog.confirm(t.admin.users.reject_dialog_title, t.admin.users.reject_dialog_body.replace('{userCode}', userCode))) return;
    updateUserMutation.mutate(
      {
        userCode,
        data: { verification_status: "REJECTED" },
      },
      {
        onSuccess: () => {
          toast.success(t.admin.users.toast_reject_success.replace('{userCode}', userCode));
        },
        onError: (error) => {
          console.error("Rejection error:", error);
          toast.error(t.admin.users.toast_reject_error);
        },
      }
    );
  };

  const handleSaveUser = (userCode: string, data: AdminUserUpdate) => {
    updateUserMutation.mutate(
      { userCode, data },
      {
        onSuccess: () => {
          toast.success(t.admin.users.toast_update_success);
        },
        onError: (error) => {
          console.error("Update error:", error);
          toast.error(t.admin.users.toast_update_error);
        },
      }
    );
  };

  if (listLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cb348]"></div>
          <p className="mt-4 text-[#666] text-sm">{t.admin.users.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[#d32f2f]">
          <p className="text-lg font-bold">{t.admin.users.error}</p>
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
          placeholder={t.admin.users.search_placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-[10px] rounded border border-[#ccc] w-full"
        />
      </div>

      {/* User Table */}
      <ContentCard title={t.admin.users.table_title}>
        {listData && listData.data.length > 0 ? (
          <UserTable
            users={listData.data}
            onEditUser={handleEditUser}
            onVerifyUser={handleVerifyUser}
            onRejectUser={handleRejectUser}
          />
        ) : (
          <p className="text-center text-[#888] py-8">{t.admin.users.empty}</p>
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
