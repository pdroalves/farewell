"use client";

import React, { useState, useMemo } from "react";
import { isHex } from "viem";
import { useFhevm } from "@/fhevm/useFhevm";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useFarewell } from "@/hooks/useFarewell";
import { ethers } from "ethers";
import TopBar from "@/components/TopBar";
import Image from "next/image";
import { getBasePath } from "@/fhevm/internal/constants";

import { randomHex16, hex16ToBigint, bigintToHex16 } from "@/lib/bit128";
import { MyStatus, NetworkStats } from "@/components/StatsBlocks";
import { COMMIT_ID } from "@/lib/commit-id";

// ——— Small UI helpers ————————————————————————————————————————————————
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-2">
      <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function Callout({
  title,
  children,
  variant = "info", // default
}: {
  title?: string;
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
}) {
  const colors: Record<typeof variant, string> = {
    info: "border-sky-200 bg-sky-50/60 text-slate-700",
    success: "border-green-200 bg-green-50/60 text-green-800",
    warning: "border-yellow-200 bg-yellow-50/60 text-yellow-800",
    danger: "border-rose-200 bg-rose-50/60 text-rose-800",
  };

  return (
    <div className={`rounded-xl p-3 text-sm border ${colors[variant]}`}>
      {title && <p className="font-medium mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export default function Farewell() {
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    // error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });
  const fhevmReady = fhevmStatus === "ready" && !!fhevmInstance;

  // Farewell hook
  const farewell = useFarewell({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const isRegLoading = farewell.isRegistered === undefined;

  // form state
  // const [showDetails, setShowDetails] = useState(false); // hide chain/status cards by default

  const [email, setEmail] = useState("");
  const [payload, setPayload] = useState<string>("");
  const [publicMessage, setPublicMessage] = useState("");
  // markDeceased input (allow empty string for UX)
  const [deceasedTarget, setDeceasedTarget] = useState<`0x${string}` | "">("");
  // Claim / Retrieve inputs
  const [claimOwner, setClaimOwner] = useState<`0x${string}` | "">("");
  const [claimIndex, setClaimIndex] = useState("0");

  const [retrieveOwner, setRetrieveOwner] = useState<`0x${string}` | "">("");
  const [retrieveIndex, setRetrieveIndex] = useState("0");

  // registration inputs (prefilled)
  const [checkInDays, setCheckInDays] = useState("30");
  const [graceDays, setGraceDays] = useState("7");

  const [lastCount, setLastCount] = useState<string>("");

  // AES secret key
  const [sHex, setSHex] = useState<`0x${string}`>("0x");
  const [sPrimeHex, setSPrimeHex] = useState<`0x${string}`>("0x");

  const [pingBusy, setPingBusy] = useState(false);

  // Randomizers
  function handleRandSPrime() {
    setSPrimeHex(randomHex16());
  }
  function handleRandS() {
    setSHex(randomHex16());
  }

  const xorHex = useMemo(() => {
    try {
      const v = hex16ToBigint(sPrimeHex) ^ hex16ToBigint(sHex);
      return bigintToHex16(v);
    } catch {
      return "0x";
    }
  }, [sHex, sPrimeHex]);

  function handleSChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.trim().toLowerCase();
    if (!v.startsWith("0x")) v = "0x" + v;
    v = v.replace(/[^0-9a-f]/g, "");
    if (v.length > 64) v = v.slice(0, 64);
    setSHex(("0x" + v) as `0x${string}`);
  }

  function handleSPrimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.trim().toLowerCase();
    if (!v.startsWith("0x")) v = "0x" + v; // ensure 0x prefix
    v = v.replace(/[^0-9a-f]/g, ""); // strip non-hex chars
    if (v.length > 64) v = v.slice(0, 64); // max 32 bytes = 64 hex chars
    setSPrimeHex(("0x" + v) as `0x${string}`);
  }

  // Put this in a utils file or top of the component
  function clampHex128Input(raw: string): `0x${string}` {
    let v = raw.trim().toLowerCase();
    if (v.startsWith("0x")) v = v.slice(2); // drop prefix
    v = v.replace(/[^0-9a-f]/g, ""); // keep only hex
    if (v.length > 64) v = v.slice(0, 64); // max 32 bytes
    return ("0x" + v) as `0x${string}`;
  }
  function handlePasteClamp(
    e: React.ClipboardEvent<HTMLInputElement>,
    setter: (v: `0x${string}`) => void
  ) {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    setter(clampHex128Input(text));
  }

  // === Style tokens (Tailwind) ==============================================
  const cardClass =
    "rounded-2xl border border-slate-200 bg-slate-50/80 backdrop-blur-sm shadow-sm p-4 sm:p-5";
  const sectionClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-3";
  // const titleClass = "font-semibold text-slate-800 text-base sm:text-lg";
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500";
  const inputReadonlyClass =
    "w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 font-mono text-slate-800";
  const labelClass = "text-xs sm:text-sm font-medium text-slate-600 mb-1";
  const btnBase =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-center transition";
  const btnPrimary = `${btnBase} bg-sky-600 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500`;
  const btnSecondary = `${btnBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300`;

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-md p-4 sm:p-8">
        <div className={cardClass + " text-center space-y-3"}>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Connect your wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Farewell uses your wallet to sign and send transactions to the
            chain. We do not custody your keys.
          </p>
          <button className={btnPrimary + " w-full"} onClick={connect}>
            <span className="text-base">Connect to MetaMask</span>
          </button>
        </div>
      </div>
    );
  }

  if (farewell.isDeployed === false) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className={cardClass}>
          <p className="text-slate-800">
            Farewell is not deployed on chain{" "}
            <span className="font-mono">{chainId}</span>.
          </p>
          <Callout>
            The UI loads but the contract for this chain isn’t available. Switch
            networks in MetaMask (e.g., Sepolia or your Hardhat local node) to
            continue.
          </Callout>
        </div>
      </div>
    );
  }

  // Pick friendly name for current account
  const normalizeEvm = (addr?: string) => {
    try {
      return ethers.getAddress((addr ?? "").trim());
    } catch {
      return "";
    }
  };

  const connectedRaw = (accounts?.[0] ?? "").trim();
  const connectedEvm = normalizeEvm(connectedRaw);

  // Known IDs (normalize EVM ones)
  const ALICE_EVM = normalizeEvm("0x89b91f8f6A90E7460fe5E62Bcd6f50e74f2e46D4");
  const BOB_EVM = normalizeEvm("0xF21D8d19E0De068076851A7BC26d0d57fE670Ae4");
  const CHARLIE_EVM = normalizeEvm(
    "0xc674BB946782992C7C869dCb514a3AfeBD575564"
  );

  let friendlyName: string | null = null;

  if (connectedEvm && connectedEvm === ALICE_EVM) {
    friendlyName = "Alice";
  } else if (connectedEvm && connectedEvm === BOB_EVM) {
    friendlyName = "Bob";
  } else if (connectedEvm && connectedEvm === CHARLIE_EVM) {
    friendlyName = "Charlie";
  }

  const handlePing = async () => {
    if (!farewell || !isConnected) return;
    setPingBusy(true);
    try {
      farewell.ping();
      try {
        const n = await farewell.messageCount();
        setLastCount(n.toString());
      } catch {}
    } finally {
      setPingBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-4 sm:space-y-6 pt-14 sm:pt-16">
      <TopBar
        address={
          ethersSigner ? accounts?.[0] : "No signer" /* string | undefined */
        }
        chainName={farewell.chainName /* e.g., 'sepolia' */}
        status={
          fhevmReady ? "ready" : "error" /* 'ready' | 'connecting' | 'error' */
        }
        messageCount={Number(lastCount) /* number | null */}
        message={farewell.message /* string | undefined */}
        onPing={farewell.isRegistered ? handlePing : undefined} // only show if registered
        pingBusy={pingBusy}
      />
      
      {/* Logo - Centered and prominent */}
      <div className="flex justify-center items-center py-2 sm:py-4">
        <Image
          src={`${getBasePath()}/farewell-logo.png`}
          alt="Farewell Logo"
          width={200}
          height={200}
          className="h-[125px] w-auto sm:h-[166px] md:h-52"
          priority
        />
      </div>
      
      {/* Proof of Concept Warning */}
      <Callout variant="danger" title="⚠️ Proof of Concept - Important Notice">
        <div className="space-y-2 text-sm">
          <p>
            <strong>This is a proof of concept implementation</strong> running on Sepolia with FHEVM testnet. 
            <strong className="text-rose-900"> Do not use this for real data.</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Data loss risk:</strong> Your data can be lost at any moment. 
              This is experimental software and should not be used for production purposes.
            </li>
            <li>
              <strong>Incomplete protocol:</strong> The data recovery protocol is not complete 
              and still needs significant work before it can be considered production-ready.
            </li>
          </ul>
          <p className="pt-2 border-t border-rose-300">
            <strong>Want to help bring this project to life?</strong> We welcome contributions! 
            Check out our{" "}
            <a
              href="https://github.com/pdroalves/farewell-core"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-rose-900"
            >
              GitHub repository
            </a>
            {" "}to contribute financially, with code, or share your ideas.
          </p>
        </div>
      </Callout>
      {/* Toggle button */}
      {/* <div className="flex justify-end">
        <button
          className={btnSecondary + " w-full sm:w-auto"}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide chain / status" : "Show chain / status"}
        </button>
      </div> */}

      {/* {showDetails && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={cardClass + " lg:col-span-8"}>
              <p className={titleClass}>Chain & Wallet</p>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">
                Quick debugging info about your current network, account and the bound Farewell contract.
              </p>
              {printProperty("ChainId", chainId)}
              {printProperty(
                "Metamask accounts",
                accounts
                  ? accounts.length === 0
                    ? "No accounts"
                    : `{ length: ${accounts.length}, [${accounts[0]}, ...] }`
                  : "undefined"
              )}
              {printProperty("Signer", ethersSigner ? accounts?.[0] : "No signer")}
              <div className="mt-3 h-px bg-slate-200" />
              <div className="mt-3">{printProperty("Contract", farewell.contractAddress)}</div>
              {printBooleanProperty("isDeployed", Boolean(farewell.isDeployed))}
            </div>

            <div className={cardClass + " lg:col-span-4"}>
              <p className={titleClass}>Status</p>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">
                Internal SDK state. If something looks off, try reconnecting your wallet or switching chains.
              </p>
              {printProperty("Fhevm Instance", fhevmInstance ? "OK" : "undefined")}
              {printProperty("Fhevm Status", fhevmStatus)}
              {printProperty("Fhevm Error", fhevmError ?? "No Error")}
              {printProperty("isBusy", farewell.isBusy)}
            </div>
          </div>
        </>
      )} */}

      {friendlyName && (
        <div className="text-lg sm:text-xl font-semibold text-slate-800">
          Hello, {friendlyName}!{" "}
          {farewell && accounts?.[0] && (
            <span className="font-normal text-slate-600">
              {farewell.isRegistered === undefined
                ? "(checking…)"
                : farewell.isRegistered
                  ? "You are registered :-)"
                  : "You are not registered :-("}
            </span>
          )}
        </div>
      )}

      {farewell.isRegistered && 
        (
    <MyStatus hook={farewell} />
        )
      }

      {/* Register (only when NOT registered) */}
      {!farewell.isRegistered &&
        (console.log(
          "Rendering register section because isRegistered is",
          farewell.isRegistered
        ), // DEBUG
        (
          <section className={sectionClass}>
            <SectionHeader
              title="Register"
              subtitle="Register on Farewell and define your check-in cadence."
            />

            <Callout>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li>
                  <strong>Check-in:</strong> number of days before Farewell considers that you have passed away.
                </li>
                <li>
                  <strong>Grace:</strong> number of days additional days, after the end of the check-in period, which Farewell will accept actions to prevent message release.
                </li>
              </ul>
            </Callout>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mt-2">
              <div className="flex flex-col sm:w-auto w-full">
                <label className={labelClass}>Check-in (days)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputClass + " w-full sm:w-36"}
                  value={checkInDays}
                  onChange={(e) => setCheckInDays(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:w-auto w-full">
                <label className={labelClass}>Grace (days)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputClass + " w-full sm:w-36"}
                  value={graceDays}
                  onChange={(e) => setGraceDays(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-1">
                <button
                  disabled={farewell.isBusy || !isConnected}
                  onClick={() => {
                    const dToSec = (d: string) =>
                      BigInt(Math.max(0, Number(d || 0))) *
                      BigInt(24 * 60 * 60);
                    const checkInSec = dToSec(checkInDays);
                    const graceSec = dToSec(graceDays);
                    farewell
                      .registerWithParams(checkInSec, graceSec)
                      // OPTIONAL: refresh lastCount after register:
                      .then(() =>
                        farewell
                          .messageCount()
                          .then((n) => setLastCount(n.toString()))
                          .catch(() => {})
                      )
                      .catch((e) => alert(String(e?.message ?? e)));
                  }}
                  className={btnPrimary + " w-full sm:w-auto"}
                >
                  register
                </button>
              </div>
            </div>
          </section>
        ))}

      {/* (Optional) Small loading card while we check registration */}
      {isRegLoading && (
        <section className={sectionClass}>
          <SectionHeader
            title="Loading"
            subtitle="Checking your registration status…"
          />
          <p className="text-sm text-slate-700">Please wait…</p>
        </section>
      )}

      {/* Set cryptographic keys */}
      <section className={sectionClass}>
        <SectionHeader
          title="Set AES Key and s"
          subtitle="Choose s and s′ to compose the secret key. Your AES key is defined as sk = s′ ⊕ s. The share s is kept under FHE permissions on‑chain; s′ is your off‑chain counterpart to hand to the recipient."
        />
        <Callout title="Under the hood">
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li>
              <code>s</code> is encrypted and stored through the fhEVM flow;
              only authorized readers can decrypt it after <em>claim</em>.
            </li>
            <li>
              <code>s′</code> never touches the chain. You must deliver it
              out‑of‑band to the recipient.
            </li>
            <li>
              When retrieving, the app recombines <code>sk = s ⊕ s′</code>{" "}
              client‑side to decrypt the payload.
            </li>
          </ul>
        </Callout>

        <Callout title="Choosing s and s′" variant="danger">
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li>
              You can choose not to set <code>s′</code>. In this case you don′t
              have to share anything with the recipient. On the other hand, this
              means that whoever retrieve the message will be able to decrypt
              it, since <code>sk = s</code> .
            </li>
            <li>
              You may choose not to set <code>s</code>, but this is{" "}
              <b>not recommended</b>. In that case, the recipient, who receives{" "}
              <code>s′</code>, would possess the entire secret key. Because the
              encrypted message is stored publicly on-chain, the recipient could
              retrieve and decrypt it prematurely.
            </li>
          </ul>
        </Callout>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
          {farewell.isRegistered && (
            <div className="flex flex-col sm:w-auto w-full">
              <label className={labelClass}>s (hex)</label>
              <input
                className={inputClass}
                placeholder="0x… (32 hex bytes)"
                value={sHex}
                onChange={handleSChange}
                onPaste={(e) => handlePasteClamp(e, setSHex)}
                maxLength={66}
                inputMode="text"
                pattern="0x[0-9a-fA-F]*"
                spellCheck={false}
              />
            </div>
          )}

          <div className="flex flex-col sm:w-auto w-full">
            <label className={labelClass}>s′ (hex)</label>
            <input
              className={inputClass}
              placeholder="0x… (32 hex bytes)"
              value={sPrimeHex}
              onChange={handleSPrimeChange}
              onPaste={(e) => handlePasteClamp(e, setSPrimeHex)}
              maxLength={66}
              inputMode="text"
              pattern="0x[0-9a-fA-F]*"
              spellCheck={false}
            />
          </div>

          {farewell.isRegistered && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                disabled={farewell.isBusy || !isConnected}
                onClick={handleRandS}
                className={btnPrimary + " w-full sm:w-auto"}
              >
                randomize s
              </button>

              <button
                disabled={farewell.isBusy || !isConnected}
                onClick={handleRandSPrime}
                className={btnSecondary + " w-full sm:w-auto"}
              >
                randomize s′
              </button>
            </div>
          )}

          {!farewell.isRegistered && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                disabled={farewell.isBusy || !isConnected}
                onClick={handleRandSPrime}
                className={btnSecondary + " w-full sm:w-auto"}
              >
                randomize s′
              </button>
            </div>
          )}
          <div className="text-[10px] sm:text-xs text-slate-500">
            sk = s ⊕ s′ = <span className="font-mono">{xorHex}</span>
          </div>
        </div>
      </section>

      {/* Add Message */}
      {farewell.isRegistered && (
        <section className={sectionClass}>
          <SectionHeader
            title="Add Message"
            subtitle="Store an encrypted payload and the recipient’s email metadata on‑chain. You choose whether the payload is a hex blob (0x…) or plain UTF‑8 text (we’ll convert)."
          />
          <Callout title="What happens on click?">
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>
                We encrypt the on‑chain <em>Message</em> using your inputs.
              </li>
              <li>
                <code>s</code> and the recipient address are handled through FHE
                permissions so only the rightful claimer can decrypt later.
              </li>
              <li>
                The transaction is sent with your wallet. Gas costs apply.
              </li>
            </ul>
          </Callout>
          <div className="grid gap-3 mt-2">
            <input
              className={inputClass}
              placeholder="recipient email (UTF‑8)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              className={inputClass + " min-h-[100px]"}
              placeholder="payload (string or 0x...)"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="publicMessage (optional)"
              value={publicMessage}
              onChange={(e) => setPublicMessage(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                disabled={farewell.isBusy || !fhevmReady}
                onClick={() =>
                  (async () => {
                    const payloadValue = isHex(payload)
                      ? (payload as `0x${string}`)
                      : payload;

                    await farewell.addMessage(
                      email,
                      payloadValue,
                      sHex,
                      sPrimeHex,
                      publicMessage.trim() ? publicMessage : undefined
                    );

                    const n = await farewell.messageCount();
                    setLastCount(n.toString());

                    // Reset message form
                    setPublicMessage("");
                    setPayload("");
                    setEmail("");
                  })().catch((e) =>
                    alert(`Add Message failed:\n${String(e?.message ?? e)}`)
                  )
                }
                className={btnPrimary + " w-full sm:w-auto"}
              >
                Add Message
              </button>
            </div>
          </div>
        </section>
      )}
      {/* Mark Deceased */}
      <section className={sectionClass}>
        <SectionHeader
          title="Mark Deceased"
          subtitle="Anyone can call this after a user’s check‑in + grace have both elapsed. It flips the on‑chain flag that allows a message to be claimed."
        />
        <Callout>
          Try to mark an address as deceased. The contract will revert if the
          timing conditions are not met.
        </Callout>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end mt-2">
          <div className="flex flex-col">
            <label className={labelClass}>Target user (0x…)</label>
            <input
              className={inputClass + " font-mono"}
              placeholder={accounts?.[0] ?? "0x0000…"}
              value={deceasedTarget}
              onChange={(e) =>
                setDeceasedTarget(e.target.value as `0x${string}`)
              }
            />
          </div>

          <button
            disabled={farewell.isBusy || !isConnected}
            onClick={() =>
              farewell
                .markDeceased(deceasedTarget || undefined)
                .catch((e) => alert(String(e?.message ?? e)))
            }
            className={btnPrimary + " w-full sm:w-auto"}
          >
            markDeceased()
          </button>
        </div>
      </section>

      {/* Claim */}
      <section className={sectionClass}>
        <SectionHeader
          title="Claim"
          subtitle="The intended recipient (or notifier) calls this to gain permission to read the FHE‑protected fields (email limbs and skShare)."
        />
        <Callout title="Under the hood">
          The contract grants FHE read permissions to the claimer, which is
          known as the <em>notifier</em>. For 24 hours, only the{" "}
          <em>notifier</em> may claim; afterwards, it becomes available to
          anyone.
        </Callout>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end mt-2">
          <div className="flex flex-col">
            <label className={labelClass}>Owner (0x…)</label>
            <input
              className={inputClass + " font-mono"}
              placeholder={accounts?.[0] ?? "0x0000…"}
              value={claimOwner}
              onChange={(e) => setClaimOwner(e.target.value as `0x${string}`)}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Index</label>
            <input
              className={inputClass}
              inputMode="numeric"
              value={claimIndex}
              onChange={(e) => setClaimIndex(e.target.value)}
            />
          </div>

          <button
            disabled={farewell.isBusy || !isConnected}
            onClick={() => {
              const owner = (claimOwner ||
                (accounts?.[0] as `0x${string}`)) as `0x${string}`;
              if (!owner) {
                alert("Provide an owner address or connect your wallet");
                return;
              }
              const idx = BigInt(claimIndex || "0");
              farewell
                .claim(owner, idx)
                .then(() => alert("Claim tx sent."))
                .catch((e) => alert(String(e?.message ?? e)));
            }}
            className={btnPrimary + " w-full sm:w-auto"}
          >
            claim()
          </button>
        </div>
      </section>

      {/* Retrieve */}
      <section className={sectionClass}>
        <SectionHeader
          title="Retrieve"
          subtitle="Fetch the message data. If you’re authorized and FHE is ready, the UI will decrypt the email and skShare client‑side; then it uses skShare as s to reconstruct sk and decrypt your payload."
        />
        <Callout variant="warning" title="Important">
          Make sure you’ve set <code>s′</code> above before retrieving;
          otherwise recombining <code>sk</code> will be impossible.
        </Callout>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end mt-2">
          <div className="flex flex-col">
            <label className={labelClass}>Target address (0x…)</label>
            <input
              className={inputClass + " font-mono"}
              placeholder={accounts?.[0] ?? "0x0000…"}
              value={retrieveOwner}
              onChange={(e) =>
                setRetrieveOwner(e.target.value as `0x${string}`)
              }
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Index</label>
            <input
              className={inputClass}
              inputMode="numeric"
              value={retrieveIndex}
              onChange={(e) => setRetrieveIndex(e.target.value)}
            />
          </div>

          <button
            disabled={farewell.isBusy || !isConnected}
            onClick={() =>
              (async () => {
                const owner = (retrieveOwner ||
                  (accounts?.[0] as `0x${string}`)) as `0x${string}`;
                if (!owner) {
                  alert("Provide an owner address or connect your wallet");
                  return;
                }
                const idx = BigInt(retrieveIndex || "0");
                await farewell.retrieve(owner, idx, sPrimeHex, fhevmInstance);
              })().catch((e) => alert(String(e?.message ?? e)))
            }
            className={btnPrimary + " w-full sm:w-auto"}
          >
            retrieve()
          </button>
        </div>

        {/* Results */}
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <label className={labelClass}>Recipient Email (decrypted)</label>
              <input
                className={inputReadonlyClass + " font-mono w-full"}
                value={farewell.retrievedRecipientEmail}
                readOnly
                placeholder="— requires claim + FHEVM ready —"
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Recipient Email (meta)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputReadonlyClass}
                  value={farewell.retrievedEmailLen}
                  readOnly
                  placeholder="byteLen"
                  aria-label="email byte length"
                />
                <input
                  className={inputReadonlyClass}
                  value={farewell.retrievedLimbCount}
                  readOnly
                  placeholder="limbs"
                  aria-label="limbs count"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>skShare</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className={inputReadonlyClass}
                value={farewell.retrievedSkShare.toString()}
                readOnly
                placeholder="shared secret"
                aria-label="email byte length"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>payload (UTF‑8, best effort)</label>
            <textarea
              className={inputReadonlyClass + " w-full min-h-[160px] resize-y"}
              value={farewell.retrievedPayloadUtf8}
              readOnly
              placeholder="hidden message (as UTF‑8, if possible)"
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>payload (hex)</label>
            <textarea
              className={
                inputReadonlyClass + " w-full min-h-[160px] font-mono resize-y"
              }
              value={farewell.retrievedPayloadHex}
              readOnly
              placeholder="hidden message (as hex)"
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>publicMessage</label>
            <textarea
              className={inputReadonlyClass + " w-full min-h-[160px] resize-y"}
              value={farewell.retrievedPubMsg}
              readOnly
              placeholder="—"
            />
          </div>
        </div>
      </section>

    <NetworkStats hook={farewell} />

      {!farewell.isDeployed && (
        <p className="text-xs sm:text-sm text-amber-600">
          Farewell is not deployed for the current chain.
        </p>
      )}

      {/* Commit ID footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500">
          Commit: <code className="font-mono">{COMMIT_ID}</code>
        </p>
      </div>
    </div>
  );
}



