# 🏛️ Vaaris — Zero-Knowledge Digital Legacy Vault & Nominee Succession Platform

> **Everything you built, safely passed on to your Vaaris.**  
> Built for Indian digital assets, bank accounts, crypto wallets, and family legacies with **Zero-Knowledge AES-256** and **Shamir's Secret Sharing (2-of-3 Threshold Scheme)**.

---

## ⚡ Key Highlights & Architecture

- **Zero-Knowledge Encryption:** All assets, passwords, and documents are encrypted directly in the browser via Web Crypto AES-256-GCM. Plaintext keys never touch the server.
- **Shamir's Secret Sharing (SSS):** The master vault key is mathematically split into 3 shares:
  1. **User Recovery Share** (Saved by the owner)
  2. **Nominee Share** (Assigned to the trusted nominee)
  3. **Server Share** (Encrypted in the database)  
  *Any 2 shares can reconstruct the vault without exposing keys to a single party.*
- **Dedicated Nominee Portal (`/nominee/login`):** Separate login section for nominees to log in, view linked owner status, upload municipal death certificates, and track the 48-hour safety grace protocol.
- **Automated Check-in via WhatsApp & Email:** Uses **Meta WhatsApp Business Cloud API** and **Resend** to send automated weekly pings. If missed, escalates to emergency contacts and nominees.
- **Resilient Database Layer:** Supports live MongoDB clusters with an automatic local fallback engine (`.vaaris-data.json`) ensuring 100% login and registration uptime even when MongoDB daemon is not running.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### 2. Environment Setup
The project includes a pre-configured `.env.local` file. If creating a new one:
```bash
cp .env.example .env.local
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Access Credentials

### 1. Vault Owner Login (`/auth/login`)
- **Email:** `demo@vaaris.in`
- **Password:** `demo123`
- **Master Password (Encryption Key):** `demomaster123`
*(Or click "⚡ Fill Demo Account" on the login screen)*

### 2. Nominee Portal Login (`/nominee/login`)
- **Option A (By Email):**
  - **Nominee Email:** `nominee@vaaris.in`
  - **Vault Owner Email:** `demo@vaaris.in`
- **Option B (By Access Token):**
  - **Token:** `vaaris-nominee-token-demo-2026`
*(Or click "⚡ Auto-fill Demo Nominee" on the nominee login screen)*

---

## 📲 WhatsApp Messaging Integration

### What is used for WhatsApp Messages?
Vaaris integrates directly with the **Meta WhatsApp Business Cloud API (Graph API v19.0)**:
- **Endpoint:** `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`
- **Source File:** `src/lib/whatsapp.ts`
- **Environment Variables:** `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID`
- **Use Cases:**
  1. *Weekly Check-in Ping:* 1-tap confirmation URL sent every week.
  2. *Missed Check-in Warnings:* Alerts when check-ins are pending.
  3. *Emergency Contact Alert:* Escalation when owner misses multiple check-ins.
  4. *Executor / Nominee Trigger Alert:* Alerts nominee to open the portal and submit verification.
  5. *Final Message Delivery:* Delivers private letters/videos to beneficiaries.

---

## 📂 Project Structure

```
├── src/
│   ├── app/
│   │   ├── auth/              # Owner Login & Signup
│   │   ├── nominee/           # Nominee Login & Portal
│   │   │   ├── login/         # Dedicated Nominee Login page
│   │   │   └── portal/        # Death certificate upload & status tracking
│   │   ├── dashboard/         # Owner Dashboard
│   │   ├── vault/             # Encrypted asset vault
│   │   ├── settings/          # Nominees & Shamir Keys configuration
│   │   ├── messages/          # Post-demise legacy messages
│   │   ├── will/              # Legal will generator
│   │   └── api/               # Serverless API routes
│   │       ├── auth/          # Authentication & sessions
│   │       ├── nominee/       # Nominee auth & death certificate API
│   │       ├── executor/      # Nominee & Shamir key endpoints
│   │       └── vault/         # Encrypted vault endpoints
│   ├── lib/
│   │   ├── shamir.ts          # Shamir's Secret Sharing (GF(2^8) math engine)
│   │   ├── crypto.ts          # Client-side AES-256-GCM Web Crypto
│   │   ├── serverCrypto.ts    # Server-side PII field encryption (DPDP Act)
│   │   ├── db.ts              # Resilient MongoDB connection manager
│   │   ├── fallbackDb.ts      # Local persistent storage engine (zero-crash fallback)
│   │   ├── whatsapp.ts        # Meta WhatsApp Business Cloud API
│   │   └── email.ts           # Resend email notifications
│   └── models/                # Mongoose database models
├── TECH_STACK.md              # Detailed technical stack documentation
├── package.json               # Project manifest
└── README.md                  # This file
```

---

## 🛡️ Legal & Compliance Notice
Vaaris is a secure storage, nominee management, and cryptographic delivery platform designed in compliance with the **Digital Personal Data Protection Act (DPDP Act 2023)**. It assists families with digital asset documentation and works alongside standard Indian legal succession procedures (Indian Succession Act, 1925).
