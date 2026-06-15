"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "@phosphor-icons/react/dist/ssr";

const WHITE = "#FFFFFF";

export function EmailCopyButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        // Fallback for browsers without the async Clipboard API.
        const textarea = document.createElement("textarea");
        textarea.value = email;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Copy failed (e.g. permission denied) — leave the icon unchanged.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy email address"
      title="Copy email address"
      className="inline-flex items-center gap-1 text-base transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
      style={{ color: WHITE }}
    >
      <span>{email}</span>
      {copied ? (
        <Check size={16} style={{ color: WHITE }} weight="bold" />
      ) : (
        <Copy size={16} style={{ color: WHITE }} />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </button>
  );
}
