"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  FaWallet,
  FaQrcode,
  FaClock,
  FaCoins,
  FaArrowDown,
  FaArrowUp,
  FaArrowLeft,
  FaTriangleExclamation,
  FaCircleCheck,
} from "react-icons/fa6";
import {
  useBalance,
  useHistory,
  useTransferFunds,
  useCreatePaymentRequest,
  useIncomingPaymentRequests,
  useOutgoingPaymentRequests,
  useConfirmPaymentRequest,
  useRejectPaymentRequest,
  useCancelPaymentRequest,
  useRaiseDispute,
} from "@/lib/api/hooks/use-banking";
import { TransactionPublic } from "@/lib/api/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format minutes into H:MM, correctly handling negative balances.
 * e.g. -90 → "-1:30", 90 → "1:30"
 */
function formatTime(minutes: number): string {
  const isNegative = minutes < 0;
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const formatted = `${h}:${m.toString().padStart(2, "0")}`;
  return isNegative ? `-${formatted}` : formatted;
}

/** Extract a human-readable message from an API error response. */
function getErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string | { msg: string }[] } }; message?: string };
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // Pydantic validation error array → pick first message
    return detail.map((d) => d.msg).join(", ");
  }
  return e?.message || "An unexpected error occurred.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Error / Success Banner
// ─────────────────────────────────────────────────────────────────────────────

function InlineError({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-2 bg-[#ffebee] border border-[#ffcdd2] rounded-[4px] p-[8px_10px] text-[12px] text-[#c62828] mt-[8px]">
      <FaTriangleExclamation className="shrink-0 mt-[1px]" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 font-bold text-[#c62828] opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}

function InlineSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#e8f5e9] border border-[#c8e6c9] rounded-[4px] p-[8px_10px] text-[12px] text-[#2e7d32] mt-[8px]">
      <FaCircleCheck className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionPublic | null>(null);

  // ── Send form state ──────────────────────────────────────────────────────
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendGaras, setSendGaras] = useState("");
  const [sendTime, setSendTime] = useState("");
  const [sendRef, setSendRef] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  // ── Request form state ───────────────────────────────────────────────────
  const [reqUser, setReqUser] = useState("");
  const [reqGaras, setReqGaras] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqSuccess, setReqSuccess] = useState(false);

  // ── Action-level error (confirm/reject/cancel on individual requests) ────
  const [actionError, setActionError] = useState<{ id: string; msg: string } | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: balanceData } = useBalance();
  const { data: historyData } = useHistory();
  const { data: incomingRequests, refetch: refetchIncoming } = useIncomingPaymentRequests();
  const { data: outgoingRequests, refetch: refetchOutgoing } = useOutgoingPaymentRequests();

  // ── Mutations ────────────────────────────────────────────────────────────
  const transfer = useTransferFunds();
  const createRequest = useCreatePaymentRequest();
  const confirmRequest = useConfirmPaymentRequest();
  const rejectRequest = useRejectPaymentRequest();
  const cancelRequest = useCancelPaymentRequest();
  const raiseDisputeMutation = useRaiseDispute();

  // ── Derived values ───────────────────────────────────────────────────────
  const pendingOutgoing = outgoingRequests?.filter((r) => r.status === "PENDING") ?? [];
  const rejectedOutgoing = outgoingRequests?.filter((r) => r.status === "REJECTED") ?? [];
  const requestsCount =
    (incomingRequests?.length ?? 0) + pendingOutgoing.length + rejectedOutgoing.length;

  const availableTime = balanceData?.limits.available_time ?? 0;
  const availableGaras = balanceData?.limits.available_regio ?? "0.00";
  const isTimeNegative = (balanceData?.balance.time ?? 0) < 0;
  const isGarasNegative = parseFloat(String(balanceData?.balance.regio ?? "0")) < 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Form toggling
  // ─────────────────────────────────────────────────────────────────────────

  const toggleForm = (type: "send" | "request") => {
    if (type === "send") {
      setSendOpen((o) => !o);
      setRequestOpen(false);
      setSendError(null);
      setSendSuccess(false);
    } else {
      setRequestOpen((o) => !o);
      setSendOpen(false);
      setReqError(null);
      setReqSuccess(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Send transfer
  // ─────────────────────────────────────────────────────────────────────────

  const handleSend = () => {
    setSendError(null);
    setSendSuccess(false);

    // Client-side validation
    if (!sendRecipient.trim()) {
      setSendError("Recipient user code is required.");
      return;
    }
    const parsedGaras = parseFloat(sendGaras);
    const parsedTime = parseInt(sendTime, 10);
    const hasGaras = sendGaras !== "" && !isNaN(parsedGaras) && parsedGaras > 0;
    const hasTime = sendTime !== "" && !isNaN(parsedTime) && parsedTime > 0;
    if (!hasGaras && !hasTime) {
      setSendError("Enter a valid amount for Time (minutes) or Garas — at least one must be greater than 0.");
      return;
    }
    if (!sendRef.trim()) {
      setSendError("A reference note is required (e.g. 'For the gardening help').");
      return;
    }

    if (!confirm(`Send to ${sendRecipient}?`)) return;

    transfer.mutate(
      {
        receiver_code: sendRecipient.trim(),
        amount_regio: hasGaras ? String(parsedGaras) : undefined,
        amount_time: hasTime ? parsedTime : undefined,
        reference: sendRef.trim(),
      },
      {
        onSuccess: () => {
          setSendSuccess(true);
          setSendRecipient("");
          setSendGaras("");
          setSendTime("");
          setSendRef("");
          // Close form after a short delay so user sees success state
          setTimeout(() => {
            setSendOpen(false);
            setSendSuccess(false);
          }, 1500);
        },
        onError: (err) => {
          setSendError(getErrorMessage(err));
        },
      }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Create payment request
  // ─────────────────────────────────────────────────────────────────────────

  const handleCreateRequest = () => {
    setReqError(null);
    setReqSuccess(false);

    if (!reqUser.trim()) {
      setReqError("User code is required.");
      return;
    }
    const parsedGaras = parseFloat(reqGaras);
    const parsedTime = parseInt(reqTime, 10);
    const hasGaras = reqGaras !== "" && !isNaN(parsedGaras) && parsedGaras > 0;
    const hasTime = reqTime !== "" && !isNaN(parsedTime) && parsedTime > 0;
    if (!hasGaras && !hasTime) {
      setReqError("Enter a valid amount for Time (minutes) or Garas — at least one must be greater than 0.");
      return;
    }
    if (!reqDesc.trim()) {
      setReqError("A description is required (e.g. 'Lunch split').");
      return;
    }

    createRequest.mutate(
      {
        debtor_code: reqUser.trim(),
        amount_regio: hasGaras ? String(parsedGaras) : undefined,
        amount_time: hasTime ? parsedTime : undefined,
        description: reqDesc.trim(),
      },
      {
        onSuccess: () => {
          setReqSuccess(true);
          setReqUser("");
          setReqGaras("");
          setReqTime("");
          setReqDesc("");
          refetchOutgoing();
          setTimeout(() => {
            setRequestOpen(false);
            setReqSuccess(false);
          }, 1500);
        },
        onError: (err) => {
          setReqError(getErrorMessage(err));
        },
      }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Incoming request actions
  // ─────────────────────────────────────────────────────────────────────────

  const handleConfirmRequest = (id: string, amount: string) => {
    setActionError(null);
    if (!confirm(`Pay ${amount}?`)) return;
    confirmRequest.mutate(id, {
      onSuccess: () => {
        refetchIncoming();
      },
      onError: (err) => {
        setActionError({ id, msg: getErrorMessage(err) });
      },
    });
  };

  const handleRejectRequest = (id: string) => {
    setActionError(null);
    if (!confirm("Decline this payment request?")) return;
    rejectRequest.mutate(id, {
      onSuccess: () => {
        refetchIncoming();
      },
      onError: (err) => {
        setActionError({ id, msg: getErrorMessage(err) });
      },
    });
  };

  const handleCancelRequest = (id: string) => {
    setActionError(null);
    if (!confirm("Cancel this request?")) return;
    cancelRequest.mutate(id, {
      onSuccess: () => {
        refetchOutgoing();
      },
      onError: (err) => {
        setActionError({ id, msg: getErrorMessage(err) });
      },
    });
  };

  const handleRaiseDispute = (id: string) => {
    const reason = window.prompt(
      "Optionally provide a reason for this dispute (max 500 chars):"
    );
    if (reason === null) return;
    raiseDisputeMutation.mutate(
      { requestId: id, data: { reason: reason || undefined } },
      {
        onSuccess: () => {
          refetchOutgoing();
        },
        onError: (err) => {
          setActionError({ id, msg: getErrorMessage(err) });
        },
      }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
              <FaWallet className="text-[var(--color-nav-bg)]" /> {t.wallet.header}
            </div>
          </div>
          <div className="cursor-pointer text-[#888] text-[20px]">
            <FaQrcode />
          </div>
        </div>
      </header>

      {/* ── Balance Cards ── */}
      <div className="p-[15px] flex gap-[10px] overflow-x-auto pb-[5px]">
        {/* Time card */}
        <div
          className={`flex-1 min-w-[160px] rounded-[12px] p-[15px] text-white shadow-md relative overflow-hidden ${
            isTimeNegative
              ? "bg-gradient-to-br from-[#e53935] to-[#b71c1c]"
              : "bg-gradient-to-br from-[#8cb348] to-[#5e8e3e]"
          }`}
        >
          <div className="text-[11px] uppercase tracking-[1px] opacity-80 mb-[5px] flex items-center gap-[5px]">
            <img src="/time.png" className="w-4 h-4 rounded bg-white/20 p-[1px]" alt="" />
            {t.wallet.time_account}
          </div>
          <div className="text-[24px] font-[800] mb-[1px]">
            {balanceData ? formatTime(balanceData.balance.time) : "..."}
          </div>
          <div className="text-[14px] font-[500] opacity-90">{t.wallet.time_unit}</div>
          {isTimeNegative && (
            <div className="text-[10px] opacity-80 mt-[4px] flex items-center gap-0.5">
              Limit: <img src="/time.png" className="w-3 h-3" alt="" />{formatTime(balanceData!.limits.max_debt_time)}
            </div>
          )}
          {!isTimeNegative && balanceData && (
            <div className="text-[10px] opacity-70 mt-[4px] flex items-center gap-0.5">
              Available: <img src="/time.png" className="w-3 h-3" alt="" />{formatTime(availableTime)}
            </div>
          )}
          <FaClock className="absolute -right-[10px] -bottom-[10px] text-[80px] opacity-15 -rotate-12" />
        </div>

        {/* Garas card */}
        <div
          className={`flex-1 min-w-[160px] rounded-[12px] p-[15px] text-white shadow-md relative overflow-hidden ${
            isGarasNegative
              ? "bg-gradient-to-br from-[#f57c00] to-[#e65100]"
              : "bg-gradient-to-br from-[#4a90e2] to-[#0056b3]"
          }`}
        >
          <div className="text-[11px] uppercase tracking-[1px] opacity-80 mb-[5px] flex items-center gap-[5px]">
            <img src="/garas.png" className="w-4 h-4 rounded bg-white/20 p-[1px]" alt="" />
            {t.wallet.garas_account}
          </div>
          <div className="text-[24px] font-[800] mb-[1px]">
            {balanceData ? balanceData.balance.regio : "..."}
          </div>
          <div className="text-[14px] font-[500] opacity-90">{t.wallet.garas_unit}</div>
          {isGarasNegative && (
            <div className="text-[10px] opacity-80 mt-[4px] flex items-center gap-0.5">
              Limit: <img src="/garas.png" className="w-3 h-3" alt="" />{balanceData!.limits.max_debt_regio}
            </div>
          )}
          {!isGarasNegative && balanceData && (
            <div className="text-[10px] opacity-70 mt-[4px] flex items-center gap-0.5">
              Available: <img src="/garas.png" className="w-3 h-3" alt="" />{availableGaras}
            </div>
          )}
          <FaCoins className="absolute -right-[10px] -bottom-[10px] text-[80px] opacity-15 -rotate-12" />
        </div>
      </div>

      {/* ── Trust level & limits info bar ── */}
      {balanceData && (
        <div className="mx-[15px] mb-[10px] bg-white border border-[#eee] rounded-[8px] px-[12px] py-[8px] flex justify-between items-center text-[11px] text-[#888]">
          <span>
            Trust level: <strong className="text-[#555]">{balanceData.trust_level}</strong>
          </span>
          <span>
            Debt limit:{" "}
            <strong className="text-[#555] inline-flex items-center gap-0.5">
              <img src="/time.png" className="w-3 h-3" alt="" />{formatTime(balanceData.limits.max_debt_time)} / <img src="/garas.png" className="w-3 h-3" alt="" />{balanceData.limits.max_debt_regio}
            </strong>
          </span>
          <span>
            Earned: <strong className="text-[#555] inline-flex items-center gap-0.5"><img src="/time.png" className="w-3 h-3" alt="" />{formatTime(balanceData.total_time_earned)}</strong>
          </span>
        </div>
      )}

      {/* ── Requests Section ── */}
      {requestsCount > 0 && (
        <div className="px-[15px] mb-[10px]">
          <div className="text-[12px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[10px] flex justify-between items-center">
            {t.wallet.open_requests}
            <span className="bg-[#f57c00] text-white p-[2px_6px] rounded-[10px] text-[10px]">
              {requestsCount} {t.wallet.action_needed}
            </span>
          </div>

          {/* Incoming requests */}
          {incomingRequests?.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#f57c00] rounded-[6px] p-[12px] mb-[10px] shadow-sm"
            >
              <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
                <span>{t.wallet.incoming_request}</span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center mb-[10px]">
                <div>
                  <div className="font-bold text-[14px] text-[#333]">
                    {t.wallet.from.replace("{name}", req.creditor_name)}
                  </div>
                  <div className="text-[12px] text-[#666]">
                    {t.wallet.ref.replace("{ref}", req.description || t.wallet.no_ref)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {req.amount_time > 0 && (
                    <div className="flex items-center gap-1">
                      <img src="/time.png" className="w-7 h-7" alt="" />
                      <span className="font-bold text-red-700 text-[13px]">{req.amount_time} min</span>
                    </div>
                  )}
                  {req.amount_regio !== "0.00" && (
                    <div className="flex items-center gap-1">
                      <img src="/garas.png" className="w-7 h-7" alt="" />
                      <span className="font-bold text-red-700 text-[13px]">{req.amount_regio}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Per-request action error */}
              {actionError?.id === req.id && (
                <InlineError
                  message={actionError.msg}
                  onDismiss={() => setActionError(null)}
                />
              )}

              <div className="flex gap-[10px] mt-[8px]">
                <button
                  className="flex-1 p-[8px] rounded-[4px] border border-[#ddd] bg-[#f5f5f5] text-[#333] text-[12px] font-[600] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleRejectRequest(req.id)}
                  disabled={rejectRequest.isPending || confirmRequest.isPending}
                >
                  {rejectRequest.isPending ? "..." : t.wallet.deny_button}
                </button>
                <button
                  className="flex-1 p-[8px] rounded-[4px] border-none bg-[var(--color-green-offer)] text-white text-[12px] font-[600] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() =>
                    handleConfirmRequest(
                      req.id,
                      `${req.amount_regio} ℛ / ${req.amount_time} min`
                    )
                  }
                  disabled={confirmRequest.isPending || rejectRequest.isPending}
                >
                  {confirmRequest.isPending ? "..." : t.wallet.confirm_pay_button}
                </button>
              </div>
            </div>
          ))}

          {/* Outgoing — PENDING (can be cancelled) */}
          {pendingOutgoing.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#999] rounded-[6px] p-[12px] mb-[10px] shadow-sm"
            >
              <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
                <span>{t.wallet.outgoing_request}</span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center mb-[10px]">
                <div>
                  <div className="font-bold text-[14px] text-[#333]">
                    {t.wallet.to.replace("{name}", req.debtor_name)}
                  </div>
                  <div className="text-[12px] text-[#666]">
                    {t.wallet.ref.replace("{ref}", req.description || t.wallet.no_ref)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {req.amount_time > 0 && (
                    <div className="flex items-center gap-1">
                      <img src="/time.png" className="w-7 h-7" alt="" />
                      <span className="font-bold text-red-700 text-[13px]">{req.amount_time} min</span>
                    </div>
                  )}
                  {req.amount_regio !== "0.00" && (
                    <div className="flex items-center gap-1">
                      <img src="/garas.png" className="w-7 h-7" alt="" />
                      <span className="font-bold text-red-700 text-[13px]">{req.amount_regio}</span>
                    </div>
                  )}
                </div>
              </div>

              {actionError?.id === req.id && (
                <InlineError
                  message={actionError.msg}
                  onDismiss={() => setActionError(null)}
                />
              )}

              <div className="flex gap-[10px] mt-[8px]">
                <button
                  className="w-full p-[8px] rounded-[4px] border border-[#ddd] bg-[#f5f5f5] text-[#666] text-[12px] font-[600] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleCancelRequest(req.id)}
                  disabled={cancelRequest.isPending}
                >
                  {cancelRequest.isPending ? "..." : t.wallet.cancel_request_button}
                </button>
              </div>
            </div>
          ))}

          {/* Outgoing — REJECTED (can raise dispute) */}
          {rejectedOutgoing.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#e53935] rounded-[6px] p-[12px] mb-[10px] shadow-sm"
            >
              <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
                <span className="text-[#e53935] font-semibold">Declined Request</span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center mb-[10px]">
                <div>
                  <div className="font-bold text-[14px] text-[#333]">
                    {t.wallet.to.replace("{name}", req.debtor_name)}
                  </div>
                  <div className="text-[12px] text-[#666]">
                    {t.wallet.ref.replace("{ref}", req.description || t.wallet.no_ref)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {req.amount_time > 0 && (
                    <div className="flex items-center gap-1">
                      <img src="/time.png" className="w-7 h-7" alt="" />
                      <span className="font-bold text-red-700 text-[13px]">{req.amount_time} min</span>
                    </div>
                  )}
                  {req.amount_regio !== "0.00" && (
                    <div className="flex items-center gap-1">
                      <img src="/garas.png" className="w-7 h-7" alt="" />
                      <span className="font-bold text-red-700 text-[13px]">{req.amount_regio}</span>
                    </div>
                  )}
                </div>
              </div>

              {actionError?.id === req.id && (
                <InlineError
                  message={actionError.msg}
                  onDismiss={() => setActionError(null)}
                />
              )}

              <div className="flex gap-[10px] mt-[8px]">
                {req.dispute_raised ? (
                  <div className="w-full p-[8px] rounded-[4px] bg-[#fff3e0] border border-[#ffe0b2] text-[#f57c00] text-[12px] font-[600] text-center">
                    Dispute Under Review
                  </div>
                ) : (
                  <button
                    className="w-full p-[8px] rounded-[4px] border border-[#ffe0b2] bg-[#fff3e0] text-[#f57c00] text-[12px] font-[600] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleRaiseDispute(req.id)}
                    disabled={raiseDisputeMutation.isPending}
                  >
                    {raiseDisputeMutation.isPending ? "..." : "Raise Dispute"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex gap-[15px] p-[10px_15px_20px_15px] justify-center border-b border-[#f0f0f0]">
        <div
          className={`flex-1 bg-white border rounded-[8px] p-[12px] text-center cursor-pointer transition-all shadow-sm flex flex-col items-center gap-[5px] hover:-translate-y-[2px] hover:bg-[#f9f9f9] ${
            sendOpen
              ? "border-[var(--color-green-offer)] bg-[#f0f7e6]"
              : "border-[#e0e0e0]"
          }`}
          onClick={() => toggleForm("send")}
        >
          <img src="/sendpayment.png" className="w-[22px] h-[22px]" alt="" />
          <span className="text-[12px] font-bold text-[#555]">{t.wallet.send_button}</span>
        </div>
        <div
          className={`flex-1 bg-white border rounded-[8px] p-[12px] text-center cursor-pointer transition-all shadow-sm flex flex-col items-center gap-[5px] hover:-translate-y-[2px] hover:bg-[#f9f9f9] ${
            requestOpen
              ? "border-[var(--color-green-offer)] bg-[#f0f7e6]"
              : "border-[#e0e0e0]"
          }`}
          onClick={() => toggleForm("request")}
        >
          <img src="/requestpayment.png" className="w-[22px] h-[22px]" alt="" />
          <span className="text-[12px] font-bold text-[#555]">{t.wallet.request_button}</span>
        </div>
      </div>

      {/* ── Send Form ── */}
      <div
        className={`bg-[#f9f9f9] border-b border-[#e0e0e0] overflow-hidden transition-[max-height] duration-300 ease-out ${
          sendOpen
            ? "max-h-[600px] shadow-[inset_0_5px_10px_-5px_rgba(0,0,0,0.1)]"
            : "max-h-0"
        }`}
      >
        <div className="p-[20px]">
          <div className="text-[14px] font-bold mb-[15px] text-[#333] border-b-[2px] border-[var(--color-green-offer)] inline-block pb-[2px]">
            {t.wallet.send_form.title}
          </div>

          {/* Available balance hint */}
          {balanceData && (
            <div className="text-[11px] text-[#888] mb-[12px] bg-white border border-[#eee] rounded-[4px] p-[6px_10px]">
              Available to send:{" "}
              <strong className={`inline-flex items-center gap-0.5 ${availableTime <= 0 ? "text-[#e53935]" : "text-[#333]"}`}>
                <img src="/time.png" className="w-3 h-3" alt="" />{formatTime(availableTime)} min
              </strong>{" "}
              /{" "}
              <strong className={`inline-flex items-center gap-0.5 ${parseFloat(String(availableGaras)) <= 0 ? "text-[#e53935]" : "text-[#333]"}`}>
                <img src="/garas.png" className="w-3 h-3" alt="" />{availableGaras}
              </strong>
            </div>
          )}

          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              {t.wallet.send_form.recipient_label} <span className="text-[#e53935]">*</span>
            </label>
            <input
              type="text"
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder={t.wallet.send_form.recipient_placeholder}
              value={sendRecipient}
              onChange={(e) => { setSendRecipient(e.target.value); setSendError(null); }}
            />
          </div>

          <div className="flex gap-[10px] mb-[12px]">
            <div className="flex-1">
              <label className="flex items-center gap-[4px] text-[11px] font-bold text-[#666] mb-[4px]">
                <img src="/time.png" className="w-3.5 h-3.5" alt="" />{t.wallet.send_form.time_label}
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder={t.wallet.send_form.time_placeholder}
                value={sendTime}
                onChange={(e) => { setSendTime(e.target.value); setSendError(null); }}
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-[4px] text-[11px] font-bold text-[#666] mb-[4px]">
                <img src="/garas.png" className="w-3.5 h-3.5" alt="" />{t.wallet.send_form.garas_label}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder={t.wallet.send_form.garas_placeholder}
                value={sendGaras}
                onChange={(e) => { setSendGaras(e.target.value); setSendError(null); }}
              />
            </div>
          </div>

          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              {t.wallet.send_form.reference_label} <span className="text-[#e53935]">*</span>
            </label>
            <input
              type="text"
              maxLength={140}
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder={t.wallet.send_form.reference_placeholder}
              value={sendRef}
              onChange={(e) => { setSendRef(e.target.value); setSendError(null); }}
            />
            <div className="text-[10px] text-[#aaa] mt-[2px] text-right">{sendRef.length}/140</div>
          </div>

          {sendError && <InlineError message={sendError} onDismiss={() => setSendError(null)} />}
          {sendSuccess && <InlineSuccess message="Transfer sent successfully!" />}

          <button
            className="w-full p-[12px] bg-[var(--color-green-offer)] text-white border-none rounded-[4px] font-bold cursor-pointer mt-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={transfer.isPending}
          >
            {transfer.isPending ? t.wallet.send_form.submit_loading : t.wallet.send_form.submit_button}
          </button>
        </div>
      </div>

      {/* ── Request Form ── */}
      <div
        className={`bg-[#f9f9f9] border-b border-[#e0e0e0] overflow-hidden transition-[max-height] duration-300 ease-out ${
          requestOpen
            ? "max-h-[600px] shadow-[inset_0_5px_10px_-5px_rgba(0,0,0,0.1)]"
            : "max-h-0"
        }`}
      >
        <div className="p-[20px]">
          <div className="text-[14px] font-bold mb-[15px] text-[#333] border-b-[2px] border-[#4285f4] inline-block pb-[2px]">
            {t.wallet.request_form.title}
          </div>

          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              {t.wallet.request_form.from_label} <span className="text-[#e53935]">*</span>
            </label>
            <input
              type="text"
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder={t.wallet.request_form.from_placeholder}
              value={reqUser}
              onChange={(e) => { setReqUser(e.target.value); setReqError(null); }}
            />
          </div>

          <div className="flex gap-[10px] mb-[12px]">
            <div className="flex-1">
              <label className="flex items-center gap-[4px] text-[11px] font-bold text-[#666] mb-[4px]">
                <img src="/time.png" className="w-3.5 h-3.5" alt="" />{t.wallet.send_form.time_label}
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder={t.wallet.send_form.time_placeholder}
                value={reqTime}
                onChange={(e) => { setReqTime(e.target.value); setReqError(null); }}
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-[4px] text-[11px] font-bold text-[#666] mb-[4px]">
                <img src="/garas.png" className="w-3.5 h-3.5" alt="" />{t.wallet.send_form.garas_label}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder={t.wallet.send_form.garas_placeholder}
                value={reqGaras}
                onChange={(e) => { setReqGaras(e.target.value); setReqError(null); }}
              />
            </div>
          </div>

          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              {t.wallet.request_form.reason_label} <span className="text-[#e53935]">*</span>
            </label>
            <input
              type="text"
              maxLength={140}
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder="e.g. Lunch split, gardening help…"
              value={reqDesc}
              onChange={(e) => { setReqDesc(e.target.value); setReqError(null); }}
            />
            <div className="text-[10px] text-[#aaa] mt-[2px] text-right">{reqDesc.length}/140</div>
          </div>

          {reqError && <InlineError message={reqError} onDismiss={() => setReqError(null)} />}
          {reqSuccess && <InlineSuccess message="Payment request sent!" />}

          <button
            className="w-full p-[12px] bg-[#4285f4] text-white border-none rounded-[4px] font-bold cursor-pointer mt-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateRequest}
            disabled={createRequest.isPending}
          >
            {createRequest.isPending
              ? t.wallet.send_form.submit_loading
              : t.wallet.request_form.submit_button}
          </button>
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="flex-grow bg-white pt-0">
        <div className="p-[15px] bg-[#fafafa] border-b border-[#eee] flex justify-between items-center">
          <span className="text-[14px] font-bold text-[#555] uppercase tracking-[0.5px]">
            {t.wallet.transactions.header}
          </span>
        </div>

        <ul className="list-none">
          {historyData?.data.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center p-[15px] border-b border-[#f5f5f5] cursor-pointer transition-colors active:bg-[#f0f0f0]"
              onClick={() => setSelectedTx(tx)}
            >
              <div
                className={`w-[40px] h-[40px] rounded-full flex justify-center items-center mr-[12px] text-[18px] shrink-0 ${
                  tx.type === "INCOMING"
                    ? "bg-[#e8f5e9] text-[#2e7d32]"
                    : "bg-[#ffebee] text-[#c62828]"
                }`}
              >
                {tx.type === "INCOMING" ? <FaArrowDown /> : <FaArrowUp />}
              </div>
              <div className="flex-grow overflow-hidden">
                <div className="text-[14px] font-[600] text-[#222] mb-[2px]">
                  {tx.other_party_name}
                </div>
                <span className="text-[12px] text-[#888] whitespace-nowrap overflow-hidden text-ellipsis block">
                  {tx.reference || t.wallet.transactions.no_reference}
                </span>
                <div className="text-[11px] text-[#aaa] mt-[2px]">
                  {new Date(tx.date).toLocaleDateString()}
                  {tx.is_system_fee && (
                    <span className="ml-[6px] bg-[#f3e5f5] text-[#7b1fa2] text-[10px] px-[4px] py-[1px] rounded">
                      System
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-[5px] items-end ml-[10px]">
                {tx.amount_regio !== "0.00" && (
                  <div className="flex items-center gap-[4px]">
                    <img src="/garas.png" className="w-5 h-5" alt="" />
                    <span className={`text-[13px] font-bold whitespace-nowrap ${tx.type === "INCOMING" ? "text-[#2e7d32]" : "text-red-700"}`}>
                      {tx.type === "INCOMING" ? "+" : "-"}{tx.amount_regio}
                    </span>
                  </div>
                )}
                {tx.amount_time > 0 && (
                  <div className="flex items-center gap-[4px]">
                    <img src="/time.png" className="w-5 h-5" alt="" />
                    <span className={`text-[13px] font-bold whitespace-nowrap ${tx.type === "INCOMING" ? "text-[#2e7d32]" : "text-red-700"}`}>
                      {tx.type === "INCOMING" ? "+" : "-"}{tx.amount_time} min
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
          {!historyData?.data.length && (
            <div className="p-4 text-center text-gray-500">
              {t.wallet.transactions.empty}
            </div>
          )}
        </ul>
      </div>

      {/* ── Transaction Detail Modal ── */}
      {selectedTx && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setSelectedTx(null)}
        >
          <div className="w-[85%] max-w-[400px] bg-white rounded-[12px] p-[20px] relative shadow-2xl text-center animate-in zoom-in-95">
            <div
              className={`w-[60px] h-[60px] mx-auto mb-[15px] rounded-full flex justify-center items-center text-[24px] ${
                selectedTx.type === "INCOMING"
                  ? "bg-[#e8f5e9] text-[#2e7d32]"
                  : "bg-[#ffebee] text-[#c62828]"
              }`}
            >
              {selectedTx.type === "INCOMING" ? <FaArrowDown /> : <FaArrowUp />}
            </div>

            <div className="flex justify-center gap-5 mb-[5px]">
              {selectedTx.amount_time > 0 && (
                <div className="flex items-center gap-2">
                  <img src="/time.png" className="w-9 h-9" alt="" />
                  <span className={`text-[20px] font-[800] ${selectedTx.type === "INCOMING" ? "text-[#2e7d32]" : "text-red-700"}`}>
                    {selectedTx.type === "INCOMING" ? "+" : "-"}{selectedTx.amount_time} min
                  </span>
                </div>
              )}
              {selectedTx.amount_regio !== "0.00" && (
                <div className="flex items-center gap-2">
                  <img src="/garas.png" className="w-9 h-9" alt="" />
                  <span className={`text-[20px] font-[800] ${selectedTx.type === "INCOMING" ? "text-[#2e7d32]" : "text-red-700"}`}>
                    {selectedTx.type === "INCOMING" ? "+" : "-"}{selectedTx.amount_regio}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[13px] text-[#888] mb-[20px]">
              {new Date(selectedTx.date).toLocaleString()}
              {selectedTx.is_system_fee && (
                <div className="mt-[4px] text-[11px] text-[#7b1fa2]">System charge</div>
              )}
            </div>

            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">{t.wallet.transactions.detail_modal.partner}</span>
              <span className="font-[600]">{selectedTx.other_party_name}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">{t.wallet.transactions.detail_modal.reference}</span>
              <span className="font-[600]">{selectedTx.reference || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">{t.wallet.transactions.detail_modal.transaction_id}</span>
              <span className="font-[600]">#{selectedTx.id.toString().substring(0, 8)}</span>
            </div>

            <button
              className="mt-[20px] w-full p-[12px] bg-[#eee] border-none rounded-[8px] font-bold text-[#333] cursor-pointer"
              onClick={() => setSelectedTx(null)}
            >
              {t.wallet.transactions.detail_modal.close_button}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
