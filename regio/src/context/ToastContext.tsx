"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { FaCircleCheck, FaCircleXmark, FaCircleInfo, FaXmark } from "react-icons/fa6";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const DURATION = 4000;

const icons: Record<ToastType, React.ReactNode> = {
  success: <FaCircleCheck className="text-[#8cb348] text-[18px] shrink-0" />,
  error:   <FaCircleXmark className="text-[#d32f2f] text-[18px] shrink-0" />,
  info:    <FaCircleInfo  className="text-[#4285f4] text-[18px] shrink-0" />,
};

const barColors: Record<ToastType, string> = {
  success: "#8cb348",
  error:   "#d32f2f",
  info:    "#4285f4",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div className="relative flex items-center gap-[10px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] rounded-[10px] px-[14px] py-[12px] w-[300px] overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-300">
      {icons[toast.type]}
      <span className="text-[14px] text-[#333] font-[500] flex-1 leading-[1.4]">{toast.message}</span>
      <button onClick={onDismiss} className="text-[#bbb] hover:text-[#888] transition-colors shrink-0">
        <FaXmark size={13} />
      </button>
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[3px] rounded-full"
        style={{
          backgroundColor: barColors[toast.type],
          animation: `toast-progress ${DURATION}ms linear forwards`,
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURATION);
  }, []);

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error   = useCallback((msg: string) => show(msg, "error"),   [show]);
  const info    = useCallback((msg: string) => show(msg, "info"),    [show]);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {/* Toast container — bottom-center, above bottom nav */}
      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-[9998] flex flex-col-reverse gap-[8px] items-center pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
