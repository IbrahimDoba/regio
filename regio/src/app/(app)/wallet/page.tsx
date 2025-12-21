"use client";

import React, { useState } from "react";
import {
  FaWallet,
  FaQrcode,
  FaClock,
  FaCoins,
  FaArrowDown,
  FaArrowUp,
  FaBuildingColumns,
  FaCheck,
  FaPaperPlane,
  FaHandHoldingDollar,
  FaXmark,
} from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";
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
} from "@/lib/api/hooks/use-banking";
import { TransactionPublic } from "@/lib/api/types";

export default function WalletPage() {
  const { t } = useLanguage();
  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionPublic | null>(null);

  // Forms
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendRegio, setSendRegio] = useState("");
  const [sendTime, setSendTime] = useState("");
  const [sendRef, setSendRef] = useState("");

  const [reqUser, setReqUser] = useState("");
  const [reqRegio, setReqRegio] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqRef, setReqRef] = useState("");

  // Queries
  const { data: balanceData } = useBalance();
  const { data: historyData } = useHistory();
  const { data: incomingRequests, refetch: refetchIncoming } =
    useIncomingPaymentRequests();
  const { data: outgoingRequests, refetch: refetchOutgoing } =
    useOutgoingPaymentRequests();

  // Mutations
  const transfer = useTransferFunds();
  const createRequest = useCreatePaymentRequest();
  const confirmRequest = useConfirmPaymentRequest();
  const rejectRequest = useRejectPaymentRequest();
  const cancelRequest = useCancelPaymentRequest();

  const toggleForm = (type: "send" | "request") => {
    if (type === "send") {
      setSendOpen(!sendOpen);
      setRequestOpen(false);
    } else {
      setRequestOpen(!requestOpen);
      setSendOpen(false);
    }
  };

  const handleSend = () => {
    if (!sendRecipient || (!sendRegio && !sendTime)) {
      alert("Please fill in recipient and amount.");
      return;
    }
    if (confirm(`Send funds to ${sendRecipient}?`)) {
      transfer.mutate(
        {
          receiver_code: sendRecipient,
          amount_regio: sendRegio || undefined,
          amount_time: sendTime ? parseInt(sendTime) : undefined,
          reference: sendRef,
        },
        {
          onSuccess: () => {
            alert("Transfer successful!");
            setSendOpen(false);
            setSendRecipient("");
            setSendRegio("");
            setSendTime("");
            setSendRef("");
          },
          onError: (err: any) => {
            alert(
              "Transfer failed: " + (err?.response?.data?.detail || err.message)
            );
          },
        }
      );
    }
  };

  const handleCreateRequest = () => {
    if (!reqUser || (!reqRegio && !reqTime)) {
      alert("Please fill in user and amount.");
      return;
    }
    createRequest.mutate(
      {
        debtor_code: reqUser,
        amount_regio: reqRegio || undefined,
        amount_time: reqTime ? parseInt(reqTime) : undefined,
        description: reqRef,
      },
      {
        onSuccess: () => {
          alert("Request sent!");
          setRequestOpen(false);
          setReqUser("");
          setReqRegio("");
          setReqTime("");
          setReqRef("");
          refetchOutgoing();
        },
        onError: (err: any) => {
          alert(
            "Request failed: " + (err?.response?.data?.detail || err.message)
          );
        },
      }
    );
  };

  const handleConfirmRequest = (id: string, amount: string) => {
    if (confirm(`Pay ${amount}?`)) {
      confirmRequest.mutate(id, {
        onSuccess: () => {
          refetchIncoming();
          alert("Paid!");
        },
        onError: (err: any) =>
          alert("Failed: " + (err?.response?.data?.detail || err.message)),
      });
    }
  };

  const handleRejectRequest = (id: string) => {
    if (confirm("Reject this request?")) {
      rejectRequest.mutate(id, {
        onSuccess: () => {
          refetchIncoming();
        },
        onError: (err: any) =>
          alert("Failed: " + (err?.response?.data?.detail || err.message)),
      });
    }
  };

  const handleCancelRequest = (id: string) => {
    if (confirm("Cancel this request?")) {
      cancelRequest.mutate(id, {
        onSuccess: () => {
          refetchOutgoing();
        },
        onError: (err: any) =>
          alert("Failed: " + (err?.response?.data?.detail || err.message)),
      });
    }
  };

  // Format helpers
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const requestsCount =
    (incomingRequests?.length || 0) + (outgoingRequests?.length || 0);

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px]">
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <FaWallet className="text-[var(--color-nav-bg)]" /> My Wallet
          </div>
          <div className="cursor-pointer text-[#888] text-[20px]">
            <FaQrcode />
          </div>
        </div>
      </header>

      {/* Balance Cards */}
      <div className="p-[15px] flex gap-[10px] overflow-x-auto pb-[5px]">
        <div className="flex-1 min-w-[160px] rounded-[12px] p-[15px] text-white shadow-md relative overflow-hidden bg-gradient-to-br from-[#8cb348] to-[#5e8e3e]">
          <div className="text-[11px] uppercase tracking-[1px] opacity-80 mb-[5px]">
            Time Account
          </div>
          <div className="text-[24px] font-[800] mb-[5px]">
            {balanceData ? formatTime(balanceData.balance.time) : "..."}
          </div>
          <div className="text-[14px] font-[500] opacity-90">Hours : Min</div>
          <FaClock className="absolute -right-[10px] -bottom-[10px] text-[80px] opacity-15 -rotate-12" />
        </div>
        <div className="flex-1 min-w-[160px] rounded-[12px] p-[15px] text-white shadow-md relative overflow-hidden bg-gradient-to-br from-[#4a90e2] to-[#0056b3]">
          <div className="text-[11px] uppercase tracking-[1px] opacity-80 mb-[5px]">
            Regio Account
          </div>
          <div className="text-[24px] font-[800] mb-[5px]">
            {balanceData ? balanceData.balance.regio : "..."}
          </div>
          <div className="text-[14px] font-[500] opacity-90">
            Regio (HUF eq)
          </div>
          <FaCoins className="absolute -right-[10px] -bottom-[10px] text-[80px] opacity-15 -rotate-12" />
        </div>
      </div>

      {/* Requests Section */}
      {requestsCount > 0 && (
        <div className="px-[15px] mb-[10px]">
          <div className="text-[12px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[10px] flex justify-between items-center">
            Open Requests
            <span className="bg-[#f57c00] text-white p-[2px_6px] rounded-[10px] text-[10px]">
              {requestsCount} Action needed
            </span>
          </div>

          {/* Incoming */}
          {incomingRequests?.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#f57c00] rounded-[6px] p-[12px] mb-[10px] shadow-sm"
            >
              <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
                <span>Incoming Request</span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center mb-[10px]">
                <div>
                  <div className="font-bold text-[14px] text-[#333]">
                    From: {req.creditor_name}
                  </div>
                  <div className="text-[12px] text-[#666]">
                    Ref: {req.description || "No ref"}
                  </div>
                </div>
                <div className="flex gap-[5px] flex-col items-end">
                  {req.amount_regio !== "0.00" && (
                    <span className="bg-[#fff3e0] text-[#f57c00] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ffe0b2]">
                      {req.amount_regio} R
                    </span>
                  )}
                  {req.amount_time > 0 && (
                    <span className="bg-[#fff3e0] text-[#f57c00] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ffe0b2]">
                      {req.amount_time} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-[10px]">
                <button
                  className="flex-1 p-[8px] rounded-[4px] border border-[#ddd] bg-[#f5f5f5] text-[#333] text-[12px] font-[600] cursor-pointer"
                  onClick={() => handleRejectRequest(req.id)}
                >
                  Deny
                </button>
                <button
                  className="flex-1 p-[8px] rounded-[4px] border-none bg-[var(--color-green-offer)] text-white text-[12px] font-[600] cursor-pointer"
                  onClick={() =>
                    handleConfirmRequest(
                      req.id,
                      `${req.amount_regio} R / ${req.amount_time} min`
                    )
                  }
                >
                  Confirm Pay
                </button>
              </div>
            </div>
          ))}

          {/* Outgoing */}
          {outgoingRequests?.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#999] rounded-[6px] p-[12px] mb-[10px] shadow-sm"
            >
              <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
                <span>Outgoing Request</span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center mb-[10px]">
                <div>
                  <div className="font-bold text-[14px] text-[#333]">
                    To: {req.debtor_name}
                  </div>
                  <div className="text-[12px] text-[#666]">
                    Ref: {req.description || "No ref"}
                  </div>
                </div>
                <div className="flex gap-[5px] flex-col items-end">
                  {req.amount_regio !== "0.00" && (
                    <span className="bg-[#f5f5f5] text-[#666] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ddd]">
                      {req.amount_regio} R
                    </span>
                  )}
                  {req.amount_time > 0 && (
                    <span className="bg-[#f5f5f5] text-[#666] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ddd]">
                      {req.amount_time} min
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-[10px]">
                <button
                  className="w-full p-[8px] rounded-[4px] border border-[#ddd] bg-[#f5f5f5] text-[#666] text-[12px] font-[600] cursor-pointer"
                  onClick={() => handleCancelRequest(req.id)}
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-[15px] p-[10px_15px_20px_15px] justify-center border-b border-[#f0f0f0]">
        <div
          className={`flex-1 bg-white border rounded-[8px] p-[12px] text-center cursor-pointer transition-all shadow-sm flex flex-col items-center gap-[5px] hover:-translate-y-[2px] hover:bg-[#f9f9f9] ${
            sendOpen
              ? "border-[var(--color-green-offer)] bg-[#f0f7e6]"
              : "border-[#e0e0e0]"
          }`}
          onClick={() => toggleForm("send")}
        >
          <FaPaperPlane className="text-[20px] text-[var(--color-nav-bg)]" />
          <span className="text-[12px] font-bold text-[#555]">Send</span>
        </div>
        <div
          className={`flex-1 bg-white border rounded-[8px] p-[12px] text-center cursor-pointer transition-all shadow-sm flex flex-col items-center gap-[5px] hover:-translate-y-[2px] hover:bg-[#f9f9f9] ${
            requestOpen
              ? "border-[var(--color-green-offer)] bg-[#f0f7e6]"
              : "border-[#e0e0e0]"
          }`}
          onClick={() => toggleForm("request")}
        >
          <FaHandHoldingDollar className="text-[20px] text-[var(--color-nav-bg)]" />
          <span className="text-[12px] font-bold text-[#555]">Request</span>
        </div>
      </div>

      {/* Collapsible Forms */}
      <div
        className={`bg-[#f9f9f9] border-b border-[#e0e0e0] overflow-hidden transition-[max-height] duration-300 ease-out ${
          sendOpen
            ? "max-h-[500px] shadow-[inset_0_5px_10px_-5px_rgba(0,0,0,0.1)]"
            : "max-h-0"
        }`}
      >
        <div className="p-[20px]">
          <div className="text-[14px] font-bold mb-[15px] text-[#333] border-b-[2px] border-[var(--color-green-offer)] inline-block pb-[2px]">
            Send Payment
          </div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              Recipient Code
            </label>
            <input
              type="text"
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder="User Code (e.g. A1B2C)"
              value={sendRecipient}
              onChange={(e) => setSendRecipient(e.target.value)}
            />
          </div>
          <div className="flex gap-[10px] mb-[12px]">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
                Regio
              </label>
              <input
                type="number"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder="0.00"
                value={sendRegio}
                onChange={(e) => setSendRegio(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
                Time (Min)
              </label>
              <input
                type="number"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder="0"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              Reference
            </label>
            <input
              type="text"
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder="Reason..."
              value={sendRef}
              onChange={(e) => setSendRef(e.target.value)}
            />
          </div>
          <button
            className="w-full p-[12px] bg-[var(--color-green-offer)] text-white border-none rounded-[4px] font-bold cursor-pointer mt-[10px] disabled:opacity-50"
            onClick={handleSend}
            disabled={transfer.isPending}
          >
            {transfer.isPending ? "Sending..." : "Confirm Transfer"}
          </button>
        </div>
      </div>

      <div
        className={`bg-[#f9f9f9] border-b border-[#e0e0e0] overflow-hidden transition-[max-height] duration-300 ease-out ${
          requestOpen
            ? "max-h-[500px] shadow-[inset_0_5px_10px_-5px_rgba(0,0,0,0.1)]"
            : "max-h-0"
        }`}
      >
        <div className="p-[20px]">
          <div className="text-[14px] font-bold mb-[15px] text-[#333] border-b-[2px] border-[#4285f4] inline-block pb-[2px]">
            Request Payment
          </div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              From User Code
            </label>
            <input
              type="text"
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder="User Code..."
              value={reqUser}
              onChange={(e) => setReqUser(e.target.value)}
            />
          </div>
          <div className="flex gap-[10px] mb-[12px]">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
                Regio
              </label>
              <input
                type="number"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder="0.00"
                value={reqRegio}
                onChange={(e) => setReqRegio(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
                Time (Min)
              </label>
              <input
                type="number"
                className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
                placeholder="0"
                value={reqTime}
                onChange={(e) => setReqTime(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">
              Reason
            </label>
            <input
              type="text"
              className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]"
              placeholder="Reason..."
              value={reqRef}
              onChange={(e) => setReqRef(e.target.value)}
            />
          </div>
          <button
            className="w-full p-[12px] bg-[#4285f4] text-white border-none rounded-[4px] font-bold cursor-pointer mt-[10px] disabled:opacity-50"
            onClick={handleCreateRequest}
            disabled={createRequest.isPending}
          >
            {createRequest.isPending ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="flex-grow bg-white pt-0">
        <div className="p-[15px] bg-[#fafafa] border-b border-[#eee] flex justify-between items-center">
          <span className="text-[14px] font-bold text-[#555] uppercase tracking-[0.5px]">
            Transactions
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
                  {tx.reference || "No specific reference"}
                </span>
                <div className="text-[11px] text-[#aaa] mt-[2px]">
                  {new Date(tx.date).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-[8px] items-center ml-[10px] flex-col items-end">
                {tx.amount_regio !== "0.00" && (
                  <span
                    className={`p-[4px_8px] rounded-[4px] text-[12px] font-bold whitespace-nowrap border ${
                      tx.type === "INCOMING"
                        ? "text-[#2e7d32] border-[#c8e6c9] bg-[#e8f5e9]"
                        : "text-[#c62828] border-[#ffcdd2] bg-[#ffebee]"
                    }`}
                  >
                    {tx.type === "INCOMING" ? "+" : "-"} {tx.amount_regio} R
                  </span>
                )}
                {tx.amount_time > 0 && (
                  <span
                    className={`p-[4px_8px] rounded-[4px] text-[12px] font-bold whitespace-nowrap border ${
                      tx.type === "INCOMING"
                        ? "text-[#2e7d32] border-[#c8e6c9] bg-[#e8f5e9]"
                        : "text-[#c62828] border-[#ffcdd2] bg-[#ffebee]"
                    }`}
                  >
                    {tx.type === "INCOMING" ? "+" : "-"} {tx.amount_time} min
                  </span>
                )}
              </div>
            </li>
          ))}
          {!historyData?.data.length && (
            <div className="p-4 text-center text-gray-500">
              No transactions found.
            </div>
          )}
        </ul>
      </div>

      {/* Tx Details Modal */}
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

            <div className="flex justify-center flex-col gap-[5px] mb-[5px]">
              {selectedTx.amount_regio !== "0.00" && (
                <div
                  className={`text-[20px] font-[800] ${
                    selectedTx.type === "INCOMING"
                      ? "text-[#2e7d32]"
                      : "text-[#c62828]"
                  }`}
                >
                  {selectedTx.type === "INCOMING" ? "+" : "-"}{" "}
                  {selectedTx.amount_regio} R
                </div>
              )}
              {selectedTx.amount_time > 0 && (
                <div
                  className={`text-[20px] font-[800] ${
                    selectedTx.type === "INCOMING"
                      ? "text-[#2e7d32]"
                      : "text-[#c62828]"
                  }`}
                >
                  {selectedTx.type === "INCOMING" ? "+" : "-"}{" "}
                  {selectedTx.amount_time} min
                </div>
              )}
            </div>

            <div className="text-[13px] text-[#888] mb-[20px]">
              {new Date(selectedTx.date).toLocaleString()}
            </div>

            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">Partner</span>
              <span className="font-[600]">{selectedTx.other_party_name}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">Reference</span>
              <span className="font-[600]">{selectedTx.reference || "-"}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">Transaction ID</span>
              <span className="font-[600]">
                #{selectedTx.id.substring(0, 8)}
              </span>
            </div>

            <button
              className="mt-[20px] w-full p-[12px] bg-[#eee] border-none rounded-[8px] font-bold text-[#333] cursor-pointer"
              onClick={() => setSelectedTx(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
