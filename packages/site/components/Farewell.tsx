"use client";

import React, { useEffect, useState } from "react";
import { isHex } from "viem";
import { useFarewell } from "@/hooks/useFarewell";

function fmt(a?: string | null) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function Farewell() {
  const {
    // wallet
    isConnected,
    accountAddress,
    connectWallet,
    // meta
    contractAddress,
    chainId,
    // UX
    message,
    isBusy,
    // actions
    register,
    registerWithParams,
    ping,
    addMessage,
    claim,
    // reads
    messageCount,
    retrieve,
  } = useFarewell();

  // hydration guard: render placeholders until mounted so SSR/CSR match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // form state
  const [email, setEmail] = useState("");
  const [skShare, setSkShare] = useState("42");
  const [payload, setPayload] = useState<string>("hello");
  const [publicMessage, setPublicMessage] = useState("");

  const [owner, setOwner] =
    useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [index, setIndex] = useState("0");

  const [lastCount, setLastCount] = useState<string>("");
  const [lastRetrieve, setLastRetrieve] = useState<string>("");

  const guard = async (fn: () => Promise<any>) => {
    if (!isConnected) {
      await connectWallet().catch((e) => {
        alert(String(e?.message ?? e));
      });
    }
    return fn();
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farewell</h1>
          <p className="text-sm opacity-70">
            Contract:{" "}
            {/* Always render the same tag; swap text only after mount */}
            <span className="font-mono" suppressHydrationWarning>
              {mounted ? (contractAddress ? fmt(contractAddress) : "not found") : "…"}
            </span>
          </p>
          <p className="text-xs opacity-60">
            Chain:{" "}
            <span suppressHydrationWarning>
              {mounted ? (chainId ?? "unknown") : "…"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mounted ? (
            isConnected ? (
              <span
                className="px-3 py-1 rounded-lg bg-green-800 text-green-100 text-sm"
                suppressHydrationWarning
              >
                {fmt(accountAddress ?? "")}
              </span>
            ) : (
              <button
                onClick={() =>
                  connectWallet().catch((e) => alert(String(e?.message ?? e)))
                }
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            )
          ) : (
            // Same element on server & first client render to avoid mismatch
            <button className="px-4 py-2 rounded-xl bg-blue-600/50 text-white cursor-not-allowed">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {message && (
        <div className="rounded-xl border border-white/10 p-3 text-sm bg-white/5">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 p-4 space-y-3">
        <h2 className="text-xl font-semibold">Register / Ping</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            disabled={!mounted || isBusy}
            onClick={() =>
              guard(register).catch((e) => alert(String(e?.message ?? e)))
            }
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            register()
          </button>
          <button
            disabled={!mounted || isBusy}
            onClick={() =>
              guard(() =>
                registerWithParams(30n * 24n * 60n * 60n, 7n * 24n * 60n * 60n)
              ).catch((e) => alert(String(e?.message ?? e)))
            }
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 disabled:opacity-50"
          >
            register(30d, 7d)
          </button>
          <button
            disabled={!mounted || isBusy}
            onClick={() =>
              guard(ping).catch((e) => alert(String(e?.message ?? e)))
            }
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 disabled:opacity-50"
          >
            ping()
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-4 space-y-3">
        <h2 className="text-xl font-semibold">Add Message</h2>
        <div className="grid gap-3">
          <input
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2"
            placeholder="recipient email (UTF-8)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2"
            placeholder="skShare (e.g., 42)"
            inputMode="numeric"
            value={skShare}
            onChange={(e) => setSkShare(e.target.value)}
          />
          <textarea
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2"
            placeholder="payload (string or 0x...)"
            rows={3}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
          <input
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2"
            placeholder="publicMessage (optional)"
            value={publicMessage}
            onChange={(e) => setPublicMessage(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              disabled={!mounted || isBusy}
              onClick={() =>
                guard(async () => {
                  const share = BigInt(skShare);
                  const payloadValue = isHex(payload as any)
                    ? (payload as `0x${string}`)
                    : payload;
                  await addMessage(
                    email,
                    share,
                    payloadValue,
                    publicMessage.trim() ? publicMessage : undefined
                  );
                  alert("Message added.");
                }).catch((e) => alert(String(e?.message ?? e)))
              }
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add Message
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-4 space-y-3">
        <h2 className="text-xl font-semibold">Claim &amp; Retrieve</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2 font-mono"
            placeholder="owner 0x..."
            value={owner}
            onChange={(e) => setOwner(e.target.value as `0x${string}`)}
          />
          <input
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2"
            placeholder="index (e.g., 0)"
            inputMode="numeric"
            value={index}
            onChange={(e) => setIndex(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            disabled={!mounted || isBusy}
            onClick={() =>
              guard(() => claim(owner, BigInt(index)))
                .then(() => alert("Claim tx sent."))
                .catch((e) => alert(String(e?.message ?? e)))
            }
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Claim
          </button>
          <button
            disabled={!mounted || isBusy}
            onClick={() =>
              retrieve(owner, BigInt(index))
                .then((res) =>
                  setLastRetrieve(
                    JSON.stringify(
                      res,
                      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
                      2
                    )
                  )
                )
                .catch((e) => alert(String(e?.message ?? e)))
            }
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 disabled:opacity-50"
          >
            Retrieve
          </button>
          <button
            disabled={!mounted || isBusy}
            onClick={() =>
              messageCount(owner)
                .then((n) => setLastCount(n.toString()))
                .catch((e) => alert(String(e?.message ?? e)))
            }
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 disabled:opacity-50"
          >
            Count
          </button>
        </div>

        {lastCount && (
          <p className="text-sm opacity-80 mt-2">
            messageCount: <span className="font-mono">{lastCount}</span>
          </p>
        )}

        {lastRetrieve && (
          <div className="mt-3 rounded-xl border border-white/10 p-3 bg-white/5">
            <h3 className="font-semibold mb-2">DeliveryPackage</h3>
            <pre className="whitespace-pre-wrap text-xs">{lastRetrieve}</pre>
          </div>
        )}
      </section>
    </div>
  );
}
