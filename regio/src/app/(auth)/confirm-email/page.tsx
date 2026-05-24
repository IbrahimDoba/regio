"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa6";
import Image from "next/image";
import MobileContainer from "@/components/layout/MobileContainer";
import { useConfirmEmailChange } from "@/lib/api/hooks/use-users";

function ConfirmEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmMutation = useConfirmEmailChange();

  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No confirmation token found.");
      return;
    }

    confirmMutation.mutate(token, {
      onSuccess: () => setStatus("success"),
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } } };
        setErrorMsg(e?.response?.data?.detail || "Invalid or expired link.");
        setStatus("error");
      },
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <MobileContainer className="flex flex-col bg-[#f8f8f8] bg-[url('https://images.unsplash.com/photo-1621360841013-c768371e93cf?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center bg-blend-multiply">
      <div className="p-[20px_20px_40px_20px] text-center">
        <div className="mb-[10px] flex items-center justify-center gap-[2px]">
          <Image src="/favicon.png" alt="REGIO" width={64} height={64} priority />
          <span className="text-[52px] font-black tracking-[0px] text-[var(--color-nav-bg)] uppercase" style={{ fontFamily: "var(--font-roboto-condensed), 'Roboto Condensed', sans-serif" }}>REGIO</span>
        </div>
      </div>

      <div className="bg-white rounded-t-[25px] flex-grow p-[30px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center text-center">
        {status === "loading" && (
          <div className="animate-in fade-in duration-300">
            <FaSpinner className="animate-spin text-[var(--color-green-offer)] text-[40px] mb-[20px] mx-auto" />
            <p className="text-[15px] text-[#555]">Confirming your new email address…</p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-in fade-in duration-300">
            <div className="text-[48px] mb-[15px]">✅</div>
            <h2 className="text-[20px] font-bold text-[#333] mb-[10px]">Email updated!</h2>
            <p className="text-[14px] text-[#666] leading-[1.6] mb-[25px]">
              Your email address has been changed successfully. Please log in with your new address.
            </p>
            <button
              className="px-[30px] py-[12px] bg-[var(--color-green-offer)] text-white rounded-[8px] font-bold text-[14px] cursor-pointer"
              onClick={() => router.replace("/auth")}
            >
              Go to Login
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="animate-in fade-in duration-300">
            <div className="text-[48px] mb-[15px]">❌</div>
            <h2 className="text-[20px] font-bold text-[#333] mb-[10px]">Confirmation failed</h2>
            <p className="text-[14px] text-[#d32f2f] leading-[1.6] mb-[25px]">{errorMsg}</p>
            <button
              className="px-[30px] py-[12px] bg-white border border-[#ccc] rounded-[8px] font-bold text-[14px] cursor-pointer"
              onClick={() => router.replace("/auth")}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailForm />
    </Suspense>
  );
}
