"use client";

import React, { useState } from "react";
import { isHex } from "viem";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useFarewell } from "@/hooks/useFarewell";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { ethers } from "ethers";

export default function Farewell() {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
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
    error: fhevmError,
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

  // form state// form state
  const [showDetails, setShowDetails] = useState(false); // hide chain/status cards by default

  const [email, setEmail] = useState("");
  const [skShare, setSkShare] = useState("");
  const [payload, setPayload] = useState<string>("");
  const [publicMessage, setPublicMessage] = useState("");
  // markDeceased input (allow empty string for UX)
  const [deceasedTarget, setDeceasedTarget] = useState<`0x${string}` | "">("");
  // Claim / Retrieve inputs
  const [claimOwner, setClaimOwner] = useState<`0x${string}` | "">("");
  const [claimIndex, setClaimIndex] = useState("0");

  const [retrieveOwner, setRetrieveOwner] = useState<`0x${string}` | "">("");
  const [retrieveIndex, setRetrieveIndex] = useState("0");

  // Retrieve outputs (read-only boxes)
  const [retrievedSkShare, setRetrievedSkShare] = useState<
    string | bigint | boolean
  >("");
  const [retrievedEmailLen, setRetrievedEmailLen] = useState<string>("");
  const [retrievedLimbCount, setRetrievedLimbCount] = useState<string>("");
  const [retrievedPayloadHex, setRetrievedPayloadHex] = useState("");
  const [retrievedPayloadUtf8, setRetrievedPayloadUtf8] = useState("");
  const [retrievedPubMsg, setRetrievedPubMsg] = useState("");

  // Recipient email (decrypted)
  const [retrievedRecipientEmail, setRetrievedRecipientEmail] = useState("");

  // registration inputs (prefilled)
  const [checkInDays, setCheckInDays] = useState("30");
  const [graceDays, setGraceDays] = useState("7");

  const [lastCount, setLastCount] = useState<string>("");


  // === Style tokens (Tailwind) ==============================================
  const cardClass =
    "rounded-2xl border border-slate-200 bg-slate-50/80 backdrop-blur-sm shadow-sm p-5";
  const sectionClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3";
  const titleClass = "font-semibold text-slate-800 text-lg";
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500";
  const inputReadonlyClass =
    "w-40 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 font-mono text-slate-800";
  const labelClass = "text-sm font-medium text-slate-600 mb-1";
  const btnPrimary =
    "inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow-sm " +
    "hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500";
  const btnSecondary =
    "inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 " +
    "hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300";

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-md p-8">
        <div className={cardClass + " text-center"}>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Connect your wallet
          </h1>
          <button className={btnPrimary + " w-full"} onClick={connect}>
            <span className="text-base">Connect to MetaMask</span>
          </button>
        </div>
      </div>
    );
  }

  if (farewell.isDeployed === false) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className={cardClass}>
          <p className="text-slate-800">
            Farewell is not deployed on chain{" "}
            <span className="font-mono">{chainId}</span>.
          </p>
        </div>
      </div>
    );
  }

  // Pick friendly name for current account
  // Friendly greeting name
  // --- Friendly name mapping (robust) ---
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

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Toggle button */}
      <div className="flex justify-end">
        <button
          className={btnSecondary}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide chain / status" : "Show chain / status"}
        </button>
      </div>

      {showDetails && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={cardClass + " lg:col-span-8"}>
              <p className={titleClass}>Chain & Wallet</p>
              {printProperty("ChainId", chainId)}
              {printProperty(
                "Metamask accounts",
                accounts
                  ? accounts.length === 0
                    ? "No accounts"
                    : `{ length: ${accounts.length}, [${accounts[0]}, ...] }`
                  : "undefined"
              )}
              {printProperty(
                "Signer",
                ethersSigner ? accounts?.[0] : "No signer"
              )}
              <div className="mt-3 h-px bg-slate-200" />
              <div className="mt-3">
                {printProperty("Contract", farewell.contractAddress)}
              </div>
              {printBooleanProperty("isDeployed", Boolean(farewell.isDeployed))}
            </div>

            <div className={cardClass + " lg:col-span-4"}>
              <p className={titleClass}>Status</p>
              {printProperty(
                "Fhevm Instance",
                fhevmInstance ? "OK" : "undefined"
              )}
              {printProperty("Fhevm Status", fhevmStatus)}
              {printProperty("Fhevm Error", fhevmError ?? "No Error")}
              {printProperty("isBusy", farewell.isBusy)}
            </div>
          </div>
        </>
      )}

      {friendlyName && (
        <div className="text-xl font-semibold text-slate-800">
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

      {farewell.message && (
        <div className={cardClass}>
          <p className="text-sm text-slate-700">{farewell.message}</p>
        </div>
      )}
      {/* Register / Ping */}
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-slate-800">
          Register / Ping
        </h2>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className={labelClass}>Check-in (days)</label>
            <input
              type="number"
              min={1}
              step={1}
              className={inputClass + " w-36"}
              value={checkInDays}
              onChange={(e) => setCheckInDays(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>Grace (days)</label>
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass + " w-36"}
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              disabled={farewell.isBusy || !isConnected}
              onClick={() => {
                const dToSec = (d: string) =>
                  BigInt(Math.max(0, Number(d || 0))) * BigInt(24 * 60 * 60);
                const checkInSec = dToSec(checkInDays);
                const graceSec = dToSec(graceDays);
                farewell
                  .registerWithParams(checkInSec, graceSec)
                  .catch((e) => alert(String(e?.message ?? e)));
              }}
              className={btnPrimary}
            >
              register
            </button>

            <button
              disabled={farewell.isBusy || !isConnected}
              onClick={() =>
                farewell.ping().catch((e) => alert(String(e?.message ?? e)))
              }
              className={btnSecondary}
            >
              ping()
            </button>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-800">Message Count</h2>
        <div className="flex items-center gap-3">
          <button
            disabled={farewell.isBusy || !fhevmReady}
            onClick={() =>
              farewell
                .messageCount()
                .then((n) => setLastCount(n.toString()))
                .catch((e) => alert(String(e?.message ?? e)))
            }
            className={btnPrimary}
          >
            Count
          </button>

          <input
            className={inputReadonlyClass}
            value={lastCount || ""}
            onChange={() => {}}
            readOnly
            placeholder="—"
            aria-label="messageCount result"
          />
        </div>
      </section>

      {/* Add Message */}
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-slate-800">Add Message</h2>
        <div className="grid gap-3">
          <input
            className={inputClass}
            placeholder="recipient email (UTF-8)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="skShare (e.g., 42)"
            inputMode="numeric"
            value={skShare}
            onChange={(e) => setSkShare(e.target.value)}
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

          <div className="flex justify-end">
            <button
              disabled={farewell.isBusy || !fhevmReady}
              onClick={() =>
                (async () => {
                  const share = BigInt(skShare);
                  const payloadValue = isHex(payload)
                    ? (payload as `0x${string}`)
                    : payload;

                  await farewell.addMessage(
                    email,
                    share,
                    payloadValue,
                    publicMessage.trim() ? publicMessage : undefined
                  );
                })().catch((e) =>
                  alert(`Add Message failed:\n${String(e?.message ?? e)}`)
                )
              }
              className={btnPrimary}
            >
              Add Message
            </button>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-slate-800">Mark Deceased</h2>

        <div className="text-sm text-slate-600">
          Anyone can mark a user as deceased after their check-in + grace period
          has elapsed. Leave the address empty to use your connected account.
        </div>

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
            className={btnPrimary}
          >
            markDeceased()
          </button>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-slate-800">Claim</h2>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
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
              className={inputClass + " w-28"}
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
            className={btnPrimary}
          >
            claim()
          </button>
        </div>
      </section>
      <section className={sectionClass}>
        <h2 className="text-xl font-semibold text-slate-800">Retrieve</h2>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
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
              className={inputClass + " w-28"}
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
                const res = await farewell.retrieve(owner, idx);

                // Always show raw payload/pm first
                setRetrievedPayloadHex(res.payload);
                try {
                  setRetrievedPayloadUtf8(
                    res.payload?.startsWith("0x")
                      ? ethers.toUtf8String(res.payload as `0x${string}`)
                      : String(res.payload ?? "")
                  );
                } catch {
                  setRetrievedPayloadUtf8("Couldn't decode as UTF-8");
                }
                setRetrievedPubMsg(res.publicMessage ?? "");
                setRetrievedEmailLen(String(res.emailByteLen));
                setRetrievedLimbCount(
                  Array.isArray(res.encodedRecipientEmail)
                    ? String((res.encodedRecipientEmail as unknown[]).length)
                    : "0"
                );
                // Decrypt skShare and recipient email if FHEVM is ready & signer present
                if (
                  !fhevmReady ||
                  !fhevmInstance ||
                  !ethersSigner ||
                  !farewell.contractAddress
                ) {
                  return; // show lengths; user can still see raw data
                }
                setRetrievedSkShare("Decrypting...");
                setRetrievedRecipientEmail("Decrypting..."); // reset

                try {
                  const sig = await FhevmDecryptionSignature.loadOrSign(
                    fhevmInstance,
                    [farewell.contractAddress as `0x${string}`],
                    ethersSigner,
                    fhevmDecryptionSignatureStorage
                  );

                  if (!sig) {
                    setRetrievedRecipientEmail(
                      "(decryption signature unavailable)"
                    );
                    setRetrievedSkShare("(decryption signature unavailable)");
                    return;
                  }

                  const limbsHandles =
                    res.encodedRecipientEmail as `0x${string}`[];
                  if (
                    !Array.isArray(limbsHandles) ||
                    limbsHandles.length === 0
                  ) {
                    setRetrievedRecipientEmail("(no limbs)");
                    return;
                  }

                  // Build decrypt tasks and run
                  const emailTasks = limbsHandles.map((h) => ({
                    handle: h,
                    contractAddress: farewell.contractAddress as `0x${string}`,
                  }));

                  const emailDecMap = await fhevmInstance.userDecrypt(
                    emailTasks,
                    sig.privateKey,
                    sig.publicKey,
                    sig.signature,
                    sig.contractAddresses,
                    sig.userAddress,
                    sig.startTimestamp,
                    sig.durationDays
                  );

                  // Recompose UTF-8 from 32-byte big-endian limbs
                  const bytes: number[] = [];
                  for (const h of limbsHandles) {
                    const clear = emailDecMap[h] as bigint;
                    const limbHex = ethers.toBeHex(clear, 32);
                    const limbBytes = Array.from(ethers.getBytes(limbHex));
                    bytes.push(...limbBytes);
                  }
                  const trimmed = bytes.slice(0, res.emailByteLen);
                  let emailText = "";
                  try {
                    emailText = ethers.toUtf8String(new Uint8Array(trimmed));
                  } catch {
                    emailText = "(invalid UTF-8 after decryption)";
                  }
                  setRetrievedRecipientEmail(emailText);

                  // Decrypt skShare
                  const decSkShare = await fhevmInstance.userDecrypt(
                    [
                      {
                        handle: res.skShare as `0x${string}`,
                        contractAddress: farewell.contractAddress,
                      },
                    ],
                    sig.privateKey,
                    sig.publicKey,
                    sig.signature,
                    sig.contractAddresses,
                    sig.userAddress,
                    sig.startTimestamp,
                    sig.durationDays
                  );
                  console.log("decSkShare", decSkShare);
                  setRetrievedSkShare(decSkShare[res.skShare as `0x${string}`]);
                } catch (e: unknown) {
                  if (e instanceof Error) {
                    setRetrievedRecipientEmail(
                      `(decrypt failed: ${String(e.message ?? e)})`
                    );
                  } else {
                    setRetrievedRecipientEmail(
                      `(decrypt failed: ${String(e)})`
                    );
                  }
                }
              })().catch((e) => alert(String(e?.message ?? e)))
            }
            className={btnPrimary}
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
                value={retrievedRecipientEmail}
                readOnly
                placeholder="— requires claim + FHEVM ready —"
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass}>Recipient Email (meta)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputReadonlyClass}
                  value={retrievedEmailLen}
                  readOnly
                  placeholder="byteLen"
                  aria-label="email byte length"
                />
                <input
                  className={inputReadonlyClass}
                  value={retrievedLimbCount}
                  readOnly
                  placeholder="limbs"
                  aria-label="limbs count"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>skShare</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputReadonlyClass}
                value={retrievedSkShare.toString()}
                readOnly
                placeholder="shared secret"
                aria-label="email byte length"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>payload (UTF-8, best effort)</label>
            <textarea
              className={inputReadonlyClass + " w-full min-h-[160px] resize-y"}
              value={retrievedPayloadUtf8}
              readOnly
              placeholder="hidden message (as UTF-8, if possible)"
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>payload (hex)</label>
            <textarea
              className={
                inputReadonlyClass + " w-full min-h-[160px] font-mono resize-y"
              }
              value={retrievedPayloadHex}
              readOnly
              placeholder="hidden message (as hex)"
            />
          </div>

          <div className="flex flex-col">
            <label className={labelClass}>publicMessage</label>
            <textarea
              className={inputReadonlyClass + " w-full min-h-[160px] resize-y"}
              value={retrievedPubMsg}
              readOnly
              placeholder="—"
            />
          </div>
        </div>
      </section>

      {!farewell.isDeployed && (
        <p className="text-sm text-amber-600">
          Farewell is not deployed for the current chain.
        </p>
      )}
    </div>
  );
}

/* ——— Pretty property renderers ——— */

function printProperty(name: string, value: unknown) {
  let displayValue: string;

  if (typeof value === "boolean") {
    return printBooleanProperty(name, value);
  } else if (typeof value === "string" || typeof value === "number") {
    displayValue = String(value);
  } else if (typeof value === "bigint") {
    displayValue = String(value);
  } else if (value === null) {
    displayValue = "null";
  } else if (value === undefined) {
    displayValue = "undefined";
  } else if (value instanceof Error) {
    displayValue = value.message;
  } else {
    displayValue = JSON.stringify(value);
  }

  return (
    <p className="text-slate-700">
      <span className="text-slate-500">{name}:</span>{" "}
      <span className="font-mono font-semibold text-slate-900">
        {displayValue}
      </span>
    </p>
  );
}

function printBooleanProperty(name: string, value: boolean) {
  return (
    <p className="text-slate-700">
      <span className="text-slate-500">{name}:</span>{" "}
      <span
        className={
          "font-mono font-semibold " +
          (value ? "text-green-600" : "text-rose-600")
        }
      >
        {String(value)}
      </span>
    </p>
  );
}
