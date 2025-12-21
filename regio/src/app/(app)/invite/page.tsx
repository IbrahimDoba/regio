"use client";

import React, { useState } from "react";
import {
  FaTicket,
  FaXmark,
  FaRegCircleCheck,
  FaRegCircle,
  FaLock,
  FaShareNodes,
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaRegEnvelope,
} from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";
import {
  useUserInvites,
  useRequestNewInvites,
} from "@/lib/api/hooks/use-users";

export default function InvitePage() {
  const { t } = useLanguage();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Data fetching
  const { data: invites, isLoading, refetch } = useUserInvites();
  const requestInvitesMutation = useRequestNewInvites();

  const handleRequestInvites = () => {
    if (
      confirm(
        "Are you sure you want to void current invites and request new ones?"
      )
    ) {
      requestInvitesMutation.mutate(undefined, {
        onSuccess: () => {
          alert("New invites generated!");
          setSelectedCode(null);
        },
      });
    }
  };

  // Set default selected code when data loads
  React.useEffect(() => {
    if (invites && invites.length > 0) {
      // Find first available code
      const firstAvailable = invites.find((c) => !c.is_used);
      if (firstAvailable) {
        setSelectedCode(firstAvailable.code);
      }
    }
  }, [invites]);

  const templates = [
    {
      title: "Standard",
      text: "Hey! Join me on regio.is to trade services and goods locally. It's invite-only. Here is your code: %CODE%",
    },
    {
      title: "Community Focus",
      text: "I found a great community for fair local trade called regio.is. I think you'd fit in perfectly! Join us with: %CODE%",
    },
    {
      title: "Short & Direct",
      text: "Here is your access code for regio.is: %CODE%",
    },
    {
      title: "Help & Support",
      text: "Let's help each other in the neighborhood. regio.is makes it easy to swap time and goods. Join with: %CODE%",
    },
  ];

  const getFinalText = () => {
    return (
      templates[selectedTemplate].text.replace(
        "%CODE%",
        selectedCode || "CODE"
      ) + " \nLink: https://regio.is/join"
    );
  };

  const share = (platform: string) => {
    if (!selectedCode) {
      alert("Please select an available invite code first.");
      return;
    }
    const text = getFinalText();
    const url = "https://regio.is";

    switch (platform) {
      case "native":
        if (navigator.share) {
          navigator
            .share({ title: "Join regio.is", text: text })
            .catch(console.error);
        } else {
          navigator.clipboard.writeText(text);
          alert("Text copied to clipboard");
        }
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(text)}`
        );
        break;
      case "facebook":
        navigator.clipboard.writeText(selectedCode);
        alert("Code copied! You can paste it in your post.");
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent(
          "Invite to regio.is"
        )}&body=${encodeURIComponent(text)}`;
        break;
    }
  };

  if (isLoading)
    return <div className="p-10 text-center">Loading invites...</div>;

  const availableCount = invites?.filter((i) => !i.is_used).length || 0;

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <FaTicket className="text-[var(--color-green-offer)]" /> Invite
            Friends
          </div>
          <div
            className="cursor-pointer text-[#888] text-[20px]"
            onClick={() => window.history.back()}
          >
            <FaXmark />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#8cb348] to-[#5e8e3e] text-white p-[25px_20px] text-center rounded-b-[20px] mb-[15px] shadow-md relative overflow-hidden">
        <div className="text-[32px] font-[800] mb-[5px] relative z-10">
          {availableCount} / 3
        </div>
        <div className="text-[14px] opacity-95 relative z-10">
          Codes available
        </div>
        <button
          className="mt-4 bg-white/20 hover:bg-white/30 text-white text-xs py-1 px-3 rounded-full relative z-10 transition-colors"
          onClick={handleRequestInvites}
          disabled={requestInvitesMutation.isPending}
        >
          {requestInvitesMutation.isPending
            ? "Requesting..."
            : "Request New Codes"}
        </button>
      </div>

      {/* Mission */}
      <div className="m-[0_20px_20px_20px] p-[15px] bg-[#f0f7e6] border-l-[4px] border-l-[var(--color-green-offer)] rounded-[4px] text-[13px] text-[#555] leading-[1.5]">
        <span className="font-[700] text-[var(--color-nav-bg)] mb-[5px] block">
          Why invite?
        </span>
        We want to build a strong, trusted community. Please invite only people
        who are genuinely interested in local exchange and fair economy. Quality
        over quantity.
      </div>

      <div className="px-[20px]">
        {/* 1. Code Selection */}
        <div className="text-[14px] font-[700] text-[#888] uppercase tracking-[0.5px] mb-[10px] mt-[10px]">
          1. Select a Code
        </div>

        {invites?.map((c) => (
          <div
            key={c.code}
            className={`bg-white border rounded-[8px] p-[12px_15px] mb-[10px] flex justify-between items-center cursor-pointer transition-colors ${
              c.is_used
                ? "opacity-60 bg-[#f9f9f9] pointer-events-none border-[#e0e0e0]"
                : selectedCode === c.code
                ? "border-[2px] border-[var(--color-green-offer)] bg-[#f9fff0]"
                : "border-[#e0e0e0]"
            }`}
            onClick={() => !c.is_used && setSelectedCode(c.code)}
          >
            <div>
              <span
                className={`text-[16px] font-[700] font-mono text-[#333] ${
                  c.is_used ? "line-through" : ""
                }`}
              >
                {c.code}
              </span>
              <span
                className={`text-[11px] block ${
                  c.is_used ? "text-[#999]" : "text-[var(--color-green-offer)]"
                }`}
              >
                {c.is_used ? "Used" : "Available"}
              </span>
            </div>
            {c.is_used ? (
              <FaLock className="text-[#ccc]" />
            ) : selectedCode === c.code ? (
              <FaRegCircleCheck className="text-[var(--color-green-offer)] text-[20px]" />
            ) : (
              <FaRegCircle className="text-[#ccc] text-[20px]" />
            )}
          </div>
        ))}

        {!invites?.length && (
          <div className="text-center text-gray-500 py-4">
            No invites found. Request new ones above.
          </div>
        )}

        {/* 2. Text Selection */}
        <div className="text-[14px] font-[700] text-[#888] uppercase tracking-[0.5px] mb-[10px] mt-[20px]">
          2. Choose a Message
        </div>

        {templates.map((t, i) => (
          <div
            key={i}
            className={`bg-white border rounded-[8px] p-[12px] mb-[8px] cursor-pointer text-[13px] text-[#555] leading-[1.4] relative pl-[35px] ${
              selectedTemplate === i
                ? "border-[var(--color-green-offer)] bg-[#fcfdf9] text-[#222]"
                : "border-[#eee]"
            }`}
            onClick={() => setSelectedTemplate(i)}
          >
            <div
              className={`absolute left-[10px] top-[12px] w-[16px] h-[16px] border-[2px] rounded-full ${
                selectedTemplate === i
                  ? "border-[var(--color-green-offer)] bg-[var(--color-green-offer)] shadow-[inset_0_0_0_3px_white]"
                  : "border-[#ccc]"
              }`}
            ></div>
            <strong>{t.title}</strong>
            <br />
            {t.text.replace("%CODE%", selectedCode || "...")}
          </div>
        ))}

        {/* 3. Share Action */}
        <div className="bg-white border border-[#e0e0e0] rounded-[12px] p-[20px] mt-[25px] mb-[30px] text-center">
          <div className="text-[16px] font-[700] mb-[15px]">3. Share Now</div>

          <div className="grid grid-cols-2 gap-[10px]">
            <button
              className="col-span-2 p-[14px] rounded-[6px] border-none text-white font-[600] text-[14px] cursor-pointer flex items-center justify-center gap-[8px] bg-[#333]"
              onClick={() => share("native")}
            >
              <FaShareNodes /> Share (All Apps)
            </button>
            <button
              className="p-[12px] rounded-[6px] border-none text-white font-[600] text-[13px] cursor-pointer flex items-center justify-center gap-[8px] bg-[#25D366]"
              onClick={() => share("whatsapp")}
            >
              <FaWhatsapp /> WhatsApp
            </button>
            <button
              className="p-[12px] rounded-[6px] border-none text-white font-[600] text-[13px] cursor-pointer flex items-center justify-center gap-[8px] bg-[#0088cc]"
              onClick={() => share("telegram")}
            >
              <FaTelegram /> Telegram
            </button>
            <button
              className="p-[12px] rounded-[6px] border-none text-white font-[600] text-[13px] cursor-pointer flex items-center justify-center gap-[8px] bg-[#1877f2]"
              onClick={() => share("facebook")}
            >
              <FaFacebook /> Facebook
            </button>
            <button
              className="p-[12px] rounded-[6px] border-none text-white font-[600] text-[13px] cursor-pointer flex items-center justify-center gap-[8px] bg-[#777]"
              onClick={() => share("email")}
            >
              <FaRegEnvelope /> Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
