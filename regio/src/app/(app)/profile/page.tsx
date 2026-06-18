"use client";

import React, { useRef, useState } from "react";
import {
  FaUserGear,
  FaXmark,
  FaCamera,
  FaShieldHalved,
  FaRegCopy,
  FaFloppyDisk,
  FaSpinner,
  FaTicket,
} from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useDialog } from "@/context/DialogContext";
import { useToast } from "@/context/ToastContext";
import {
  useMe,
  useUpdateUser,
  useUploadAvatar,
  useUserInvites,
  useRequestNewInvites,
  useRequestEmailChange,
  useGetCitiesByZip,
} from "@/lib/api/hooks/use-users";
import { useRequestPasswordReset } from "@/lib/api";
import { API_CONFIG } from "@/lib/api/config";

export default function ProfilePage() {
  const { language, setLanguage, t } = useLanguage();
  const dialog = useDialog();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"personal" | "account" | "trust">(
    "personal"
  );
  const router = useRouter(); // Use Next.js router for navigation

  // Queries & Mutations
  const { data: user, isLoading } = useMe();
  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  const requestResetMutation = useRequestPasswordReset();
  const { data: invites } = useUserInvites();
  const requestNewInvites = useRequestNewInvites();
  const requestEmailChange = useRequestEmailChange();
  const [newEmail, setNewEmail] = useState("");
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // Note: user object usually contains invites count or we fetch it separately.
  // Let's check UserPublic type. It doesn't seem to have invite count.
  // We can fetch invites count or just redirect to invite page.

  // Local state for form fields
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [avatarCacheBust, setAvatarCacheBust] = useState(() => Date.now());
  const { data: zipCities = [], isFetching: citiesFetching } = useGetCitiesByZip(zip);

  // Update local state when user data is loaded
  React.useEffect(() => {
    if (user) {
      setCity(user.city || "");
      setZip(user.zip_code || "");
    }
  }, [user]);

  // When ZIP changes, validate against registry and derive the city.
  // Single match -> auto-fill (read-only). Multiple -> let the user pick.
  // No match -> surface an error and clear the city.
  React.useEffect(() => {
    if (zip.length !== 4 || citiesFetching) return;
    if (zipCities.length === 0) {
      toast.error("Invalid zip code");
      setCity("");
    } else if (zipCities.length === 1) {
      setCity(zipCities[0]);
    } else if (!zipCities.includes(city)) {
      setCity("");
    }
  }, [zip, zipCities, citiesFetching]);

  if (isLoading) {
    return <div className="p-10 text-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-10 text-center">Error loading profile.</div>; // Should probably redirect to login
  }

  const handleChangePassword = async () => {
    setPasswordResetError(null);
    try {
      await requestResetMutation.mutateAsync(user!.email);
      setPasswordResetSent(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch {
      const msg = "Failed to send reset email. Please try again.";
      setPasswordResetError(msg);
      toast.error(msg);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return;
    try {
      await requestEmailChange.mutateAsync(newEmail.trim().toLowerCase());
      toast.success("Confirmation emails sent! Check your new inbox.");
      setShowEmailChange(false);
      setNewEmail("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to request email change.");
    }
  };

  const handleSavePersonal = () => {
    updateUser.mutate(
      {
        city: city || null,
        zip_code: zip || null,
        language: language as "EN" | "DE" | "HU",
      },
      {
        onSuccess: () => {
          toast.success("Profile updated!");
        },
      }
    );
  };

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px]">
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <FaUserGear className="text-[var(--color-green-offer)]" /> {t.profile.header}
          </div>
          <div
            className="cursor-pointer text-[#888] text-[20px]"
            onClick={() => router.push('/')}
          >
            <FaXmark />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="p-[25px_20px] bg-gradient-to-b from-white to-[#f0f7e6] text-center border-b border-[#e0e0e0]">
        <div className="relative w-[100px] h-[100px] mx-auto mb-[15px]">
          <img
            src={
              user.avatar_url
                ? `${API_CONFIG.BASE_URL}/users/${user.user_code}/avatar?t=${avatarCacheBust}`
                : `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`
            }
            className="w-full h-full rounded-full object-cover border-[3px] border-white shadow-md"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be smaller than 5 MB.");
                e.target.value = "";
                return;
              }
              uploadAvatar.mutate(file, {
                onSuccess: () => setAvatarCacheBust(Date.now()),
              });
              e.target.value = "";
            }}
          />
          <div
            className="absolute bottom-0 right-0 bg-[var(--color-green-offer)] text-white w-[32px] h-[32px] rounded-full flex justify-center items-center text-[14px] cursor-pointer border-[2px] border-white"
            onClick={() => avatarInputRef.current?.click()}
          >
            {uploadAvatar.isPending ? (
              <span className="text-[10px]">...</span>
            ) : (
              <FaCamera />
            )}
          </div>
        </div>
        {uploadAvatar.isError && (
          <p className="text-[11px] text-[#d32f2f] mt-[-8px] mb-[8px]">
            {(uploadAvatar.error as { response?: { data?: { detail?: string } } })
              ?.response?.data?.detail ?? "Upload failed. Please try again."}
          </p>
        )}

        <div className="text-[22px] font-[800] text-[#222] mb-[5px]">
          {user.first_name} {user.last_name}
        </div>

        <div className="inline-flex items-center gap-[5px] bg-[#e8f5e9] text-[var(--color-green-offer)] p-[4px_10px] rounded-[15px] text-[11px] font-bold mb-[15px]">
          <FaShieldHalved /> {t.profile.trust_level} {user.trust_level}
        </div>

        <div className="bg-white border border-dashed border-[#ccc] inline-flex items-center gap-[10px] p-[8px_15px] rounded-[6px] mx-auto">
          <span className="text-[10px] uppercase text-[#888] font-bold tracking-[1px]">
            User ID:
          </span>
          <span className="font-mono text-[18px] font-bold text-[#333] tracking-[2px]">
            {user.user_code}
          </span>
          <FaRegCopy
            className="text-[var(--turquoise)] cursor-pointer text-[14px]"
            onClick={() => {
              navigator.clipboard.writeText(user.user_code);
              toast.success("ID copied!");
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e0e0] bg-white sticky top-[60px] z-90">
        <div
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === "personal"
              ? "text-[var(--color-green-offer)] border-[var(--color-green-offer)]"
              : "border-transparent hover:bg-[#f9f9f9]"
            }`}
          onClick={() => setActiveTab("personal")}
        >
          {t.profile.tabs.personal}
        </div>
        <div
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === "account"
              ? "text-[var(--color-green-offer)] border-[var(--color-green-offer)]"
              : "border-transparent hover:bg-[#f9f9f9]"
            }`}
          onClick={() => setActiveTab("account")}
        >
          {t.profile.tabs.account}
        </div>
        <div
          className={`flex-1 text-center p-[15px] text-[13px] font-[600] text-[#666] cursor-pointer border-b-[3px] transition-all ${activeTab === "trust"
              ? "text-[var(--color-green-offer)] border-[var(--color-green-offer)]"
              : "border-transparent hover:bg-[#f9f9f9]"
            }`}
          onClick={() => setActiveTab("trust")}
        >
          {t.profile.tabs.trust_invites}
        </div>
      </div>

      {/* Content */}
      <div className="p-[20px]">
        {activeTab === "personal" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">
              {t.profile.personal_tab.base_data_section}
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.personal_tab.first_name_label}
              </label>
              <input
                type="text"
                className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#777] cursor-not-allowed outline-none"
                value={user.first_name}
                readOnly
              />
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.personal_tab.last_name_label}
              </label>
              <input
                type="text"
                className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#777] cursor-not-allowed outline-none"
                value={user.last_name}
                readOnly
              />
            </div>

            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[30px] border-b border-[#eee] pb-[5px]">
              {t.profile.personal_tab.public_info_section}
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.personal_tab.zip_label}
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={t.profile.personal_tab.zip_placeholder}
              />
            </div>

            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.personal_tab.city_label}
              </label>
              {citiesFetching ? (
                <div className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] flex items-center gap-[8px] text-[#888]">
                  <FaSpinner className="animate-spin" /> Loading...
                </div>
              ) : zipCities.length > 1 ? (
                <select
                  className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                >
                  <option value="">{t.profile.personal_tab.city_pick}</option>
                  {zipCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : zipCities.length === 1 ? (
                <input
                  type="text"
                  readOnly
                  className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#777] cursor-not-allowed outline-none"
                  value={zipCities[0]}
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  disabled
                  className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#aaa] cursor-not-allowed outline-none"
                  placeholder={zip.length === 4 ? "Invalid zip code" : t.profile.personal_tab.city_placeholder}
                  value=""
                />
              )}
            </div>

            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.personal_tab.language_label}
              </label>
              <select
                className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors"
                value={language}
                onChange={(e) => setLanguage(e.target.value as "EN" | "DE" | "HU")}
              >
                <option value="EN">{t.profile.personal_tab.language_en}</option>
                <option value="DE">{t.profile.personal_tab.language_de}</option>
                <option value="HU">{t.profile.personal_tab.language_hu}</option>
              </select>
            </div>

            {/* Bio is not in UserUpdate/UserPublic currently. Hidden or using a placeholder. */}
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.personal_tab.bio_label}
              </label>
              <textarea
                className="w-full p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[var(--input-bg)] focus:bg-white focus:border-[var(--color-green-offer)] outline-none transition-colors"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.profile.personal_tab.bio_placeholder}
              ></textarea>
            </div>

            <button
              className="w-full p-[14px] bg-[var(--color-green-offer)] text-white border-none rounded-[6px] text-[14px] font-bold cursor-pointer mt-[10px] flex justify-center items-center gap-[8px]"
              onClick={handleSavePersonal}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                t.profile.personal_tab.save_loading
              ) : (
                <>
                  <FaFloppyDisk /> {t.profile.personal_tab.save_button}
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "account" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Trust Level Section */}
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">
              {t.profile.trust_tab.verification_section}
            </div>
            <div className="bg-white p-[15px] rounded-[8px] border border-[#eee] mb-[30px]">
              <div className="flex gap-[10px] items-center mb-[10px]">
                <FaShieldHalved className="text-[var(--color-green-offer)] text-[20px] shrink-0" />
                <div>
                  <div className="font-bold text-[14px]">
                    {t.profile.trust_tab.trust_level.replace('{value}', String(user.trust_level))}
                  </div>
                  <div className="text-[12px] text-[#888]">
                    {t.profile.trust_tab.member_since.replace('{date}', new Date(user.created_at).toLocaleDateString())}
                  </div>
                </div>
              </div>
              <div className="text-[12px] text-[#555] leading-[1.6]">
                {t.profile.trust_tab.verified_message}
              </div>
            </div>

            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] border-b border-[#eee] pb-[5px]">
              {t.profile.account_tab.login_section}
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                {t.profile.account_tab.email_label}
              </label>
              <div className="flex gap-[8px]">
                <input
                  type="email"
                  className="flex-1 p-[12px] border border-[#ddd] rounded-[6px] text-[14px] bg-[#eee] text-[#777] cursor-not-allowed outline-none"
                  value={user.email}
                  readOnly
                />
                <button
                  className="px-[12px] py-[10px] bg-white border border-[#ccc] rounded-[6px] text-[12px] font-bold text-[#555] cursor-pointer hover:border-[var(--color-green-offer)] hover:text-[var(--color-green-offer)] transition-colors whitespace-nowrap"
                  onClick={() => setShowEmailChange((v) => !v)}
                >
                  {t.profile.account_tab.change_email_button}
                </button>
              </div>

              {showEmailChange && (
                <div className="mt-[10px] p-[12px] bg-[#f9f9f9] rounded-[6px] border border-[#eee]">
                  <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                    {t.profile.account_tab.new_email_label}
                  </label>
                  <input
                    type="email"
                    className="w-full p-[10px] border border-[#ddd] rounded-[6px] text-[14px] bg-white focus:border-[var(--color-green-offer)] outline-none mb-[8px]"
                    placeholder={t.profile.account_tab.new_email_placeholder}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={requestEmailChange.isPending}
                  />
                  <button
                    className="w-full p-[10px] bg-[var(--color-green-offer)] text-white border-none rounded-[6px] text-[13px] font-bold cursor-pointer flex justify-center items-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRequestEmailChange}
                    disabled={requestEmailChange.isPending || !newEmail.trim()}
                  >
                    {requestEmailChange.isPending ? (
                      <><FaSpinner className="animate-spin" /> {t.profile.account_tab.change_email_sending}</>
                    ) : (
                      t.profile.account_tab.change_email_send_button
                    )}
                  </button>
                  <p className="text-[11px] text-[#888] mt-[8px] leading-[1.5]">
                    {t.profile.account_tab.change_email_hint}
                  </p>
                </div>
              )}
            </div>
            <div className="mb-[20px]">
              <label className="block text-[12px] font-bold text-[#555] mb-[6px]">
                Password
              </label>
              {passwordResetSent ? (
                <div className="text-center py-[10px]">
                  <img src="/mail-sent.jpg" alt="" className="w-[60px] h-[60px] object-contain mx-auto mb-[6px]" />
                  <p className="text-[13px] text-[#555]">
                    Reset link sent to <strong>{user.email}</strong>. Check your inbox.
                  </p>
                </div>
              ) : (
                <>
                  {passwordResetError && (
                    <p className="text-[12px] text-[#d32f2f] mb-[8px]">{passwordResetError}</p>
                  )}
                  <button
                    className="w-full p-[10px] bg-white border border-[#ccc] rounded-[6px] cursor-pointer text-[14px] flex justify-center items-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleChangePassword}
                    disabled={requestResetMutation.isPending}
                  >
                    {requestResetMutation.isPending ? (
                      <>
                        <FaSpinner className="animate-spin" /> Sending...
                      </>
                    ) : (
                      t.profile.account_tab.change_password_button
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="mt-[40px] text-center">
              <button
                className="bg-none border-none text-[#d32f2f] font-bold cursor-pointer"
                onClick={() => (window.location.href = "/auth")}
              >
                {t.profile.account_tab.logout_button}
              </button>
            </div>
          </div>
        )}

        {activeTab === "trust" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-[14px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[15px] mt-[10px] border-b border-[#eee] pb-[5px]">
              {t.profile.trust_tab.invites_section}
            </div>

            {/* Invite codes — shown directly */}
            {!invites || invites.length === 0 ? (
              <div className="text-[13px] text-[#888] text-center py-[20px]">
                {t.invite.no_codes}
              </div>
            ) : (
              <div className="flex flex-col gap-[8px] mb-[20px]">
                {invites.map((invite) => {
                  const isActive = !invite.is_used && (!invite.expires_at || new Date(invite.expires_at) > new Date());
                  return (
                    <div
                      key={invite.code}
                      className={`bg-white rounded-[8px] border p-[12px_15px] flex items-center gap-[10px] ${isActive ? "border-[#dcedc8]" : "border-[#eee] opacity-60"}`}
                    >
                      <FaTicket className={`text-[18px] shrink-0 ${isActive ? "text-[var(--color-green-offer)]" : "text-[#bbb]"}`} />
                      <span className="font-mono text-[13px] font-bold text-[#333] tracking-[1px] flex-1">
                        {invite.code}
                      </span>
                      <span className={`text-[11px] font-bold px-[8px] py-[2px] rounded-full ${isActive ? "bg-[#e8f5e9] text-[var(--color-green-offer)]" : "bg-[#f5f5f5] text-[#999]"}`}>
                        {isActive ? t.invite.code_available : t.invite.code_used}
                      </span>
                      {isActive && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(invite.code); toast.success("Code copied!"); }}
                          className="text-[#aaa] hover:text-[var(--color-green-offer)] transition-colors"
                        >
                          <FaRegCopy size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Request new invites */}
            <button
              className="w-full p-[12px] bg-white border border-[#ccc] rounded-[6px] cursor-pointer text-[13px] font-bold flex justify-center items-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--color-green-offer)] hover:text-[var(--color-green-offer)] transition-colors"
              onClick={async () => {
                const ok = await dialog.confirm(t.invite.request_button, t.invite.why_invite_body);
                if (!ok) return;
                requestNewInvites.mutate(undefined, {
                  onSuccess: () => toast.success("New invites generated!"),
                });
              }}
              disabled={requestNewInvites.isPending}
            >
              {requestNewInvites.isPending ? (
                <><FaSpinner className="animate-spin" /> {t.invite.request_loading}</>
              ) : (
                <><FaTicket /> {t.invite.request_button}</>
              )}
            </button>

            <div className="mt-[12px] text-[11px] text-[#888] text-center leading-[1.5]">
              {t.profile.trust_tab.invites_reputation_hint}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
