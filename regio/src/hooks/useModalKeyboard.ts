import { useEffect } from "react";

/**
 * Keyboard shortcuts for modals:
 *   Escape → calls onClose
 *   Enter  → calls onConfirm, unless the focused element is an INPUT / TEXTAREA / SELECT / BUTTON
 *             (guards against double-firing with form fields and focused buttons)
 *
 * @param onClose    called when Escape is pressed
 * @param onConfirm  called when Enter is pressed outside a form control (optional)
 * @param enabled    set to false to disable (useful for modals with isOpen flags)
 */
export function useModalKeyboard(
  onClose?: () => void,
  onConfirm?: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "Enter" && onConfirm) {
        const tag = (e.target as HTMLElement)?.tagName ?? "";
        if (!["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) {
          onConfirm();
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, onClose, onConfirm]);
}
