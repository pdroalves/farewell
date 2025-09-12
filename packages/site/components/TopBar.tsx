"use client";

import React from "react";

type Props = {
  address?: string;
  chainName?: string;
  status?: "ready" | "connecting" | "error" | string;
  messageCount?: number | null; // optional for later wiring
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
  onPing, // NEW
  pingBusy, // NEW
}: Props) {
  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "—";
  const dot =
    status === "ready"
      ? "bg-green-500"
      : status === "connecting"
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="fixed left-0 right-0 top-0 z-50 w-screen border-b border-slate-200/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80">
      <div className="w-full box-border px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
          <span className="text-sm text-slate-700">Network</span>
          <span className="text-sm font-medium text-slate-900">
            {chainName ?? "—"}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-300 mx-2" />

        <div className="text-sm text-slate-700">
          <b>Address</b>:&nbsp;
          <span className="font-mono text-slate-900">{shortAddr}</span>
        </div>

        <div className="h-6 w-px bg-slate-300 mx-2" />

        {onPing && (
          <button
            onClick={onPing}
            disabled={pingBusy}
            className="rounded-lg bg-sky-600 text-white text-sm px-3 py-1 shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {pingBusy ? "Pinging..." : "Ping"}
          </button>
        )}
        <div className="h-6 w-px bg-slate-300 mx-2" />
        
        <p className="text-sm text-slate-700">{message}</p>
        <div className="ml-auto text-sm text-slate-700">
          Messages:&nbsp;
          <span className="font-semibold text-slate-900">
            {messageCount == null ? "—" : messageCount}
          </span>
        </div>
        <div className="h-6 w-px bg-slate-300 mx-2" />
      </div>
    </div>
  );
}
