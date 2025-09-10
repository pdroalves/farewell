# Farewell Frontend

<p align="center"> <img src="packages/site/public/farewell-logo.png" alt="Farewell Logo" width="400"/> </p>

**Farewell Frontend** is the web interface for the [Farewell](http://github.com/pdroalves/farewell-core) protocol.
It allows users to interact with the smart contract on Sepolia through a simple dApp experience.

🔗 **Live Demo**: [https://www.iampedro.com/farewell](https://www.iampedro.com/farewell)

---

## ✨ Features

* **Wallet & Network**
  Connect with MetaMask and check chain status.

* **Registration & Check-in**
  Register with a name, `checkInPeriod`, and `gracePeriod`.
  Ping the contract to keep your account alive.

* **Messages**

  * Add encrypted messages to recipients.
  * Include optional public notes.
  * Attach and release secret key shares (`skShare`).
  * Retrieve released messages, including recipient email and payload.

* **Lifecycle Controls**

  * Mark users as deceased (after timeout).
  * Claim messages with 24-hour priority.
  * View release status.

---

## 🚀 Getting Started

```bash
npm install
npx run dev:mock
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Learn More

For the **full protocol design, contract details, and encryption workflow**, see the main repository:
👉 [pdroalves/farewell-core](http://github.com/pdroalves/farewell-core)

---

## 📜 License

MIT
