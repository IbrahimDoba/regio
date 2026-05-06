"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaLock, FaSpinner } from "react-icons/fa6";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useConfirmPasswordReset } from "@/lib/api";
import MobileContainer from "@/components/layout/MobileContainer";
import ErrorMessage from "@/components/auth/ErrorMessage";

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmResetMutation = useConfirmPasswordReset();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/auth");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t.auth.reset_password.error_too_short);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.auth.reset_password.error_mismatch);
      return;
    }

    try {
      await confirmResetMutation.mutateAsync({ token: token!, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => router.replace("/auth"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || t.auth.reset_password.error_generic);
    }
  };

  if (!token) return null;

  return (
    <MobileContainer className="flex flex-col bg-[#f8f8f8] bg-[url('https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center bg-blend-multiply">

      <div className="p-[20px_20px_40px_20px] text-center">
        <div className="mb-[10px] flex items-center justify-center gap-[2px]">
          <Image src="/favicon.png" alt="REGIO" width={64} height={64} priority />
          <span className="text-[52px] font-black tracking-[0px] text-[var(--color-nav-bg)] uppercase" style={{ fontFamily: "var(--font-roboto-condensed), 'Roboto Condensed', sans-serif" }}>REGIO</span>
        </div>
      </div>

      <div className="bg-white rounded-t-[25px] flex-grow p-[30px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-10 duration-500 flex flex-col">

        {success ? (
          <div className="text-center py-[20px] animate-in fade-in duration-300">
            <div className="text-[40px] mb-[15px]">✅</div>
            <div className="font-bold text-[18px] text-[#333] mb-[10px]">{t.auth.reset_password.success_title}</div>
            <div className="text-[14px] text-[#666] leading-[1.6]">{t.auth.reset_password.success_body}</div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <h2 className="mb-[25px] text-[#333] text-[24px] font-bold">{t.auth.reset_password.section_title}</h2>

            {error && <ErrorMessage message={error} className="mb-[20px]" />}

            <form onSubmit={handleSubmit}>
              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.reset_password.password_label}</label>
                <div className="relative">
                  <FaLock className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] text-[16px]" />
                  <input
                    type="password"
                    className="w-full p-[14px_14px_14px_45px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] focus:border-[var(--color-green-offer)] outline-none"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={confirmResetMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="mb-[20px]">
                <label className="block text-[12px] font-bold text-[#555] mb-[8px]">{t.auth.reset_password.confirm_label}</label>
                <div className="relative">
                  <FaLock className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] text-[16px]" />
                  <input
                    type="password"
                    className="w-full p-[14px_14px_14px_45px] border border-[#ddd] rounded-[8px] text-[15px] bg-[var(--input-bg)] focus:border-[var(--color-green-offer)] outline-none"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={confirmResetMutation.isPending}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-[15px] bg-[var(--color-green-offer)] text-white border-none rounded-[8px] text-[16px] font-bold cursor-pointer mt-[10px] shadow-[0_4px_10px_rgba(140,179,72,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-[8px]"
                disabled={confirmResetMutation.isPending}
              >
                {confirmResetMutation.isPending ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {t.auth.reset_password.submit_loading}
                  </>
                ) : (
                  t.auth.reset_password.submit
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
