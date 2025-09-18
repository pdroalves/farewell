// StatsBlocks.tsx
"use client";
import React, { useCallback, useEffect, useState } from "react";
import {extractRevertReason, useFarewell} from "@/hooks/useFarewell";

type FarewellHook = ReturnType<typeof useFarewell>;

function ReadyGuard({
  hook,
  children,
}: {
  hook: FarewellHook;
  children: React.ReactNode;
}) {
  // very lightweight readiness check
  const ready =
    Boolean(hook?.contractAddress) &&
    Boolean(hook?.isDeployed) &&
    hook.chainName !== "Unknown network";
  if (!ready) {
    return (
      <section className="mt-6">
        <div className="text-sm text-slate-600">
          Contract not ready yet (provider/address). Connect wallet and/or wait a
          moment…
        </div>
      </section>
    );
  }
  return <>{children}</>;
}

function StatCard({ title, value, sub }: { title: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-xl font-semibold text-slate-800">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function formatUnixSecs(secs: bigint | number | string | boolean | undefined) {
  try {
    if (secs === undefined || secs === false) return "—";
    if (secs === true) return "true";
    const n = typeof secs === "bigint" ? Number(secs) : Number(secs);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return new Date(n * 1000).toLocaleString();
  } catch {
    return String(secs ?? "—");
  }
}
function boolFromAbi(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "bigint") return v === BigInt(1);
  if (typeof v === "number") return v === 1;
  return Boolean(v);
}

/* ───────────────────────── Network block ───────────────────────── */
export function NetworkStats({ hook }: { hook: FarewellHook }) {
  const { chainName, getNumberOfRegisteredUsers, getNumberOfAddedMessages } = hook;

  const [totalUsers, setTotalUsers] = useState<bigint | null>(null);
  const [totalMsgs, setTotalMsgs] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // guard: don’t call if not ready
    if (!hook?.contractAddress || !hook?.isDeployed) return;
    setLoading(true);
    setErr(null);
    try {
      const [u, m] = await Promise.all([
        getNumberOfRegisteredUsers(),
        getNumberOfAddedMessages(),
      ]);
      setTotalUsers(u);
      setTotalMsgs(m);
    } catch (e: unknown) {
      const reason = extractRevertReason(e);
      setErr(reason);
    } finally {
      setLoading(false);
    }
  }, [hook?.contractAddress, hook?.isDeployed, getNumberOfRegisteredUsers, getNumberOfAddedMessages]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ReadyGuard hook={hook}>
      <section className="mt-6">
        <div className="mb-2">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Network</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Connected to <span className="font-medium">{chainName}</span>
          </p>
        </div>

        {err && (
          <div className="text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-xl p-2 mb-2">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard title="Registered users" value={totalUsers !== null ? totalUsers.toString() : "…"} />
          <StatCard title="Messages added" value={totalMsgs !== null ? totalMsgs.toString() : "…"} />
        </div>

        <div className="mt-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-2xl px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>
    </ReadyGuard>
  );
}

/* ───────────────────────── User block ───────────────────────── */
export function MyStatus({ hook, ownerAddress }: { hook: FarewellHook; ownerAddress?: `0x${string}` }) {
  const { getLastCheckin, getDeceaseStatus } = hook;

  const [lastCheck, setLastCheck] = useState<bigint | null>(null);
  const [dead, setDead] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hook?.contractAddress || !hook?.isDeployed) return;
    setLoading(true);
    setErr(null);
    try {
      const [lc, d] = await Promise.all([
        getLastCheckin(ownerAddress),
        getDeceaseStatus(ownerAddress),
      ]);
      setLastCheck(lc);
      setDead(boolFromAbi(d));
    } catch (e: unknown) {
      const reason = extractRevertReason(e);
      setErr(reason);
    } finally {
      setLoading(false);
    }
  }, [hook?.contractAddress, hook?.isDeployed, getLastCheckin, getDeceaseStatus, ownerAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ReadyGuard hook={hook}>
      <section className="mt-6">
        <div className="mb-2">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Your status</h2>
        </div>

        {err && (
          <div className="text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-xl p-2 mb-2">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            title="Last check in"
            value={lastCheck !== null ? formatUnixSecs(lastCheck) : "…"}
            sub={lastCheck ? "Local time" : undefined}
          />
          <StatCard title="Deceased status" value={dead === null ? "…" : dead ? "Deceased" : "Alive"} />
        </div>

        <div className="mt-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-2xl px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>
    </ReadyGuard>
  );
}
