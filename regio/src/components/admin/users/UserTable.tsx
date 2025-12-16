'use client';

import React, { useState } from 'react';
import { FaSort, FaPen, FaCheck } from 'react-icons/fa6';
import TrustBadge from '../ui/TrustBadge';
import StatusBadge from '../ui/StatusBadge';

interface UserAdminView {
  user_code: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  trust_level: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  is_active: boolean;
  verification_status: 'PENDING' | 'VERIFIED';
  balance_time: number;
  balance_regio: string;
  created_at: string;
}

interface UserTableProps {
  users: UserAdminView[];
  onEditUser: (user: UserAdminView) => void;
  onVerifyUser: (userCode: string) => void;
}

export default function UserTable({ users, onEditUser, onVerifyUser }: UserTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const formatBalance = (balance: number | string, isTime: boolean = false) => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;
    const isNegative = num < 0;
    const formatted = isTime ? Math.abs(num).toString() : Math.abs(num).toFixed(2);

    if (isNegative) {
      return <span className="text-[#d32f2f] font-bold">- {formatted}</span>;
    } else if (num > 0) {
      return <span className="text-[#8cb348] font-bold">+ {formatted}</span>;
    }
    return formatted;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase cursor-pointer select-none hover:text-[#8cb348]"
              onClick={() => handleSort(0)}
            >
              Name <FaSort className="inline ml-1" />
            </th>
            <th
              className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase cursor-pointer select-none hover:text-[#8cb348]"
              onClick={() => handleSort(1)}
            >
              Role <FaSort className="inline ml-1" />
            </th>
            <th
              className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase cursor-pointer select-none hover:text-[#8cb348]"
              onClick={() => handleSort(2)}
            >
              Trust <FaSort className="inline ml-1" />
            </th>
            <th
              className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase cursor-pointer select-none hover:text-[#8cb348]"
              onClick={() => handleSort(3)}
            >
              Regio Bal. <FaSort className="inline ml-1" />
            </th>
            <th
              className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase cursor-pointer select-none hover:text-[#8cb348]"
              onClick={() => handleSort(4)}
            >
              Time Bal. <FaSort className="inline ml-1" />
            </th>
            <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
              Status
            </th>
            <th className="text-left p-3 border-b-2 border-[#eee] text-[#888] text-[12px] uppercase">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.user_code}
              className="hover:bg-[#fafafa] transition-colors"
            >
              <td className="p-3 border-b border-[#eee] align-middle">
                <div className="flex items-center gap-[10px]">
                  <img
                    src={user.avatar_url || `https://i.pravatar.cc/100?u=${user.user_code}`}
                    alt={user.full_name}
                    className="w-[30px] h-[30px] rounded-full"
                  />
                  <div>
                    <strong className="block">{user.full_name}</strong>
                    <span className="text-[10px] text-[#888]">
                      ID: {user.user_code}
                    </span>
                  </div>
                </div>
              </td>
              <td className="p-3 border-b border-[#eee] text-[14px] text-[#333]">
                {user.role}
              </td>
              <td className="p-3 border-b border-[#eee]">
                <TrustBadge level={user.trust_level} />
              </td>
              <td className="p-3 border-b border-[#eee] text-[14px]">
                {formatBalance(user.balance_regio)}
              </td>
              <td className="p-3 border-b border-[#eee] text-[14px]">
                {formatBalance(user.balance_time, true)}
              </td>
              <td className="p-3 border-b border-[#eee]">
                {user.verification_status === 'PENDING' ? (
                  <StatusBadge variant="pending" label="Pending Verify" />
                ) : (
                  <StatusBadge variant="active" label="Active" />
                )}
              </td>
              <td className="p-3 border-b border-[#eee]">
                {user.verification_status === 'PENDING' ? (
                  <button
                    onClick={() => onVerifyUser(user.user_code)}
                    className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#8cb348] text-white"
                  >
                    <FaCheck /> Verify
                  </button>
                ) : (
                  <button
                    onClick={() => onEditUser(user)}
                    className="py-2 px-4 rounded border-none font-semibold cursor-pointer text-[13px] transition-transform active:scale-95 inline-flex items-center gap-[5px] bg-[#eee] text-[#333]"
                  >
                    <FaPen /> Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
