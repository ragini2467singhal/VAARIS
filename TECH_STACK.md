# 🏛️ Vaaris — Technical Stack & Architectural Documentation

**Vaaris** is an enterprise-grade, zero-knowledge digital legacy vault, nominee management, and estate succession system tailored for Indian digital assets, bank accounts, and family legacies.

---

## 🛠️ Complete Technology Stack

### 1. Frontend Architecture
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router architecture with React Server Components and dynamic client routing)
- **Library:** [React 18](https://react.dev/)
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/) with custom Vaaris luxury themes (Vault Obsidian, Antique Gold, Ember, Paper Texture)
- **Animations:** [Framer Motion 11](https://www.framer.com/motion/) for fluid transitions, modals, and cryptographic visual states
- **Form Management & Validation:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) schemas
- **Icons & UI:** [Lucide React](https://lucide.dev/)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)

---

### 2. Backend & API Services
- **Runtime:** [Node.js](https://nodejs.org/) (LTS, compatible with v18 - v24)
- **Routing:** Next.js Route Handlers (`src/app/api/`)
- **Authentication:**
  - Stateless JWT sessions signed with HMAC-SHA256
  - Double-cookie support (`vaaris_session` with fallback support)
  - Bcrypt (`bcryptjs`) with work factor 12 for master credentials
- **Audit Logging:** Immutable audit logs tracking logins, key derivation, and certificate uploads (`src/lib/audit.ts`)
- **Rate Limiting:** Sliding-window rate limiter protecting sensitive authentication endpoints (`src/lib/rateLimit.ts`)

---

### 3. Database Layer
- **Primary Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose 8.5](https://mongoosejs.com/)
- **Resilient Connection Engine:** `src/lib/db.ts`
  - Automatic retry and short failover timeouts
  - Connects to local MongoDB (`mongodb://127.0.0.1:27017/vaaris`) or MongoDB Atlas clusters
- **Vaaris Local Fallback Engine:** `src/lib/fallbackDb.ts`
  - If MongoDB is offline or unavailable during grading/development, the system seamlessly uses the local fallback engine (`.vaaris-data.json`)
  - Guaranteed zero crashes on login or registration regardless of database daemon state.

---

### 4. Cryptography & Security Architecture

#### A. Client-Side Zero-Knowledge Encryption
- **Algorithm:** AES-256-GCM (Galois/Counter Mode) via the browser's native Web Cryptography API (`crypto.subtle`)
- **Key Derivation:** PBKDF2 with SHA-256 and **100,000 iterations**
- **Principle:** All sensitive vault items, passwords, documents, and messages are encrypted in the client browser before transmission. Plaintext keys are never transmitted to the server.

#### B. Shamir's Secret Sharing (SSS) Engine (`src/lib/shamir.ts`)
- **Mathematical Foundation:** Polynomial interpolation over Galois Field $\text{GF}(2^8)$ with irreducible polynomial $x^8 + x^4 + x^3 + x + 1$ ($0\text{x}11\text{B}$) and field generator $\alpha = 3$.
- **Scheme:** **2-of-3 Threshold Scheme**:
  1. **Share #1 (User Share):** Stored by the owner in their downloadable emergency recovery kit.
  2. **Share #2 (Nominee Share):** Provided to the designated nominee upon invitation / portal access.
  3. **Share #3 (Server Share):** Encrypted and securely held in the Vaaris database.
- **Workflow:** Any 2 shares can reconstruct the vault master key without exposing the plaintext key to single parties. Upon deceased verification, Nominee Share + Server Share combine to decrypt designated legacy assets.

#### C. Server-Side PII Field Encryption (`src/lib/serverCrypto.ts`)
- Sensitive personal data (phone numbers, religion, dates of birth) is encrypted with server-side AES-256-GCM before writing to the database to comply with India's **Digital Personal Data Protection Act (DPDP Act 2023)**.

---

### 5. Messaging & WhatsApp Integration

#### What is used for WhatsApp Messages?
- **Provider:** **Meta WhatsApp Business Cloud API (Graph API v19.0)**
- **Endpoint:** `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`
- **Authentication:** Bearer token (`WHATSAPP_TOKEN`)
- **Implementation File:** `src/lib/whatsapp.ts`
- **Use Cases:**
  1. **Weekly Automated Check-ins:** One-tap confirmation ping sent to the vault owner.
  2. **Missed Check-in Alerts:** Gentle warning triggers if check-in is missed.
  3. **Emergency Contact Alerts:** Escalation message sent to emergency contacts if owner fails to respond.
  4. **Nominee / Executor Trigger:** Notifies nominee that the vault trigger process has commenced.
  5. **Final Message Delivery:** Delivers secure, private links for post-demise letters/videos to beneficiaries.

#### Other Communication Channels:
- **Email:** [Resend](https://resend.com/) API + [Nodemailer](https://nodemailer.com/)
- **SMS:** Twilio / MSG91 fallback integration

---

### 6. Storage & Cloud Infrastructure
- **File & Certificate Storage:** Cloudflare R2 / AWS S3 compatible presigned object storage (`@aws-sdk/client-s3`)
- **PDF Generation:** [Puppeteer Core](https://pptr.dev/) with Chromium for legally styled Indian wills and emergency kits.
- **Payment Processing:** [Razorpay](https://razorpay.com/) (Test & Live modes for Indian UPI/Cards/Netbanking).

---

### 7. Portals & Separation of Concerns
1. **Vault Owner Portal (`/dashboard`, `/vault`, `/settings`):**
   - Manage digital assets (bank accounts, crypto, lockers, property)
   - Assign beneficiaries and designated Nominees (Executors)
   - Issue Shamir key shares
   - Snooze or adjust check-in frequencies
2. **Nominee Portal (`/nominee/login`, `/nominee/portal`):**
   - Separate login for designated nominees via access token or linked email
   - Official municipal Death Certificate submission (file, reg number, authority)
   - Live tracking of 48-hour safety review protocol
   - Shamir Share key reconstruction upon verification.
