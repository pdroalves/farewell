"use client";

import React from "react";

type Props = {
  address?: string;
  chainName?: string;
  status?: "ready" | "connecting" | "error" | string;
  messageCount?: number | null;
  message?: string;
  onPing?: () => void;
  pingBusy?: boolean;
};

export default function TopBar({
  address,
  chainName,
  status = "connecting",
  messageCount,
  message,
  onPing,
  pingBusy,
}: Props) {
  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  const dot =
    status === "ready"
      ? "bg-green-500"
      : status === "connecting"
      ? "bg-yellow-500"
      : "bg-red-500";

  const Divider = ({ className = "" }: { className?: string }) => (
    <div className={`h-6 w-px bg-slate-300 mx-2 ${className}`} />
  );

  return (
    <div className="fixed left-0 right-0 top-0 z-50 w-screen border-b border-slate-200/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80">
      <div className="w-full box-border px-4 py-2 flex items-center gap-2">
        {/* Network chip (always visible) */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
          <span className="text-sm text-slate-700">Network</span>
          <span className="text-sm font-medium text-slate-900 truncate max-w-[30vw] sm:max-w-none">
            {chainName ?? ""}
          </span>
        </div>

        {/* Divider hidden on very small screens */}
        <Divider className="hidden sm:block" />

        {/* Address (hidden < md) */}
        {shortAddr && (
          <div className="hidden md:block text-sm text-slate-700">
            <b>Address</b>: <span className="font-mono text-slate-900">{shortAddr}</span>
          </div>
        )}

        {/* Divider hidden on small screens */}
        <Divider className="hidden md:block" />

        {/* Ping button (shown whenever onPing exists) */}
        {onPing && (
          <button
            onClick={onPing}
            disabled={pingBusy}
            className="rounded-lg bg-sky-600 text-white text-sm px-3 py-1 shadow-sm hover:bg-sky-700 disabled:opacity-50"
            aria-label="Send ping"
          >
            {pingBusy ? "Pinging..." : "Ping"}
          </button>
        )}

        {/* Divider hidden on small screens */}
        {onPing && <Divider className="hidden lg:block" />}

        {/* Free-form status/message (hidden < lg) */}
        {message && (
          <p className="hidden lg:block text-sm text-slate-700 truncate">
            {message}
          </p>
        )}

        {/* Push trailing items to the right */}
        <div className="ml-auto flex items-center">
          {/* Messages count (hidden < sm) */}
          <div className="hidden sm:block text-sm text-slate-700">
            Messages:{" "}
            <span className="font-semibold text-slate-900">
              {messageCount == null ? "" : messageCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
