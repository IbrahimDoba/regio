"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DialogType = "alert" | "confirm" | "prompt";

interface DialogConfig {
  type: DialogType;
  title: string;
  message: string;
  placeholder?: string;
}

interface DialogContextValue {
  alert: (title: string, message: string) => Promise<void>;
  confirm: (title: string, message: string) => Promise<boolean>;
  prompt: (title: string, message: string, placeholder?: string) => Promise<string | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [inputValue, setInputValue] = useState("");
  const resolveRef = useRef<((value: boolean | string | null) => void) | null>(null);

  const showDialog = useCallback(
    (cfg: DialogConfig): Promise<boolean | string | null> =>
      new Promise((resolve) => {
        setConfig(cfg);
        setInputValue("");
        resolveRef.current = resolve;
      }),
    []
  );

  const handleOk = useCallback(() => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setConfig((prev) => {
      if (!prev) return null;
      if (prev.type === "prompt") resolve?.(inputValue);
      else resolve?.(true);
      return null;
    });
  }, [inputValue]);

  const handleCancel = useCallback(() => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setConfig((prev) => {
      if (!prev) return null;
      if (prev.type === "confirm") resolve?.(false);
      else resolve?.(null);
      return null;
    });
  }, []);

  const alertFn = useCallback(
    async (title: string, message: string) => {
      await showDialog({ type: "alert", title, message });
    },
    [showDialog]
  );

  const confirmFn = useCallback(
    async (title: string, message: string): Promise<boolean> =>
      (await showDialog({ type: "confirm", title, message })) as boolean,
    [showDialog]
  );

  const promptFn = useCallback(
    async (title: string, message: string, placeholder?: string): Promise<string | null> =>
      (await showDialog({ type: "prompt", title, message, placeholder })) as string | null,
    [showDialog]
  );

  const contextValue = useMemo<DialogContextValue>(
    () => ({ alert: alertFn, confirm: confirmFn, prompt: promptFn }),
    [alertFn, confirmFn, promptFn]
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {config && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={config.type === "alert" ? handleOk : handleCancel}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[16px] font-[800] text-[#222] mb-2">{config.title}</h3>
              <p className="text-[14px] text-[#555] leading-[1.5]">{config.message}</p>

              {config.type === "prompt" && (
                <input
                  type="text"
                  className="mt-3 w-full border border-[#ccc] rounded-[6px] px-3 py-2 text-[14px] focus:outline-none focus:border-[var(--color-green-offer)]"
                  placeholder={config.placeholder ?? ""}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleOk();
                    if (e.key === "Escape") handleCancel();
                  }}
                  autoFocus
                />
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 px-4 py-3 justify-end border-t border-[#eee]">
              {config.type !== "alert" && (
                <button
                  className="px-4 py-2 rounded-[6px] bg-[#f0f0f0] text-[#555] text-[13px] font-[600] hover:bg-[#e5e5e5] transition-colors"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              <button
                className="px-4 py-2 rounded-[6px] bg-[var(--color-green-offer)] text-white text-[13px] font-[600] hover:opacity-90 transition-opacity"
                onClick={handleOk}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
