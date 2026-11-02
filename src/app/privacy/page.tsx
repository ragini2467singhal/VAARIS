'use client'
import Link from 'next/link'

const CONSENT_VERSION = '2026-06-11'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen paper-texture p-8 lg:p-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <Link href="/">
            <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gold" />
            </div>
          </Link>
          <span className="font-display text-lg text-gold tracking-[0.2em]">VIRASAT</span>
        </div>

        <h1 className="font-display text-4xl mb-8">Privacy Policy</h1>
        <p className="text-ash/60 font-mono text-sm mb-12">Last updated: June 2026 · Consent Version: {CONSENT_VERSION}</p>

        <div className="space-y-8 text-ash/80 leading-relaxed">
          <section className="bg-ember/10 border border-ember/30 p-6">
            <p className="text-ember/90 font-bold text-lg mb-3">IMPORTANT — NOT A LEGAL SERVICE</p>
            <p className="text-ash/70 text-sm leading-relaxed">
              Virasat is a secure storage and delivery tool only. It does NOT replace a legal Will, Trust,
              or court-mandated succession process. We do not provide legal advice. Users must consult a
              qualified lawyer for estate planning and succession under applicable Indian laws (Hindu Succession
              Act, Muslim Personal Law, Indian Succession Act, etc.). Virasat delivers your encrypted data
              and instructions to designated beneficiaries after verified death. Actual ownership transfer of
              assets (bank accounts, property, crypto, etc.) follows standard legal procedures.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">1. Introduction & Data Controller</h2>
            <p>Virasat ("we", "us", "our") is the data controller for your personal information.
               We are committed to protecting your privacy in accordance with the Digital Personal Data
               Protection Act, 2023 (DPDP Act) of India.</p>
            <p className="mt-3">This Privacy Policy explains how we collect, use, and protect your information.
               By using Virasat, you consent to our data practices as described here.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">2. Data We Collect</h2>
            <p>We collect the following personal data for specific purposes:</p>
            <ul className="space-y-2 list-disc pl-6 mt-3">
              <li><strong>Account Information:</strong> Name, email, phone, date of birth, religion selection</li>
              <li><strong>Encryption Data:</strong> Salt and key check value (never your master password)</li>
              <li><strong>Vault Contents:</strong> Messages, beneficiary details, vault items (encrypted before storage)</li>
              <li><strong>Check-in Data:</strong> Last check-in timestamp, missed count</li>
              <li><strong>Audit Logs:</strong> Access logs for security and compliance (retained 90 days)</li>
            </ul>
            <p className="mt-3 text-ember/70 font-mono text-sm">Note: Your master password and vault contents are NEVER stored or transmitted in plaintext.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">3. Purpose of Data Processing</h2>
            <p>Under the DPDP Act, we process your data for the following purposes:</p>
            <ul className="space-y-2 list-disc pl-6 mt-3">
              <li>To create and manage your account</li>
              <li>To send check-in reminders (email/WhatsApp)</li>
              <li>To deliver your messages to beneficiaries when triggered</li>
              <li>To communicate important updates about your account</li>
              <li>To comply with legal obligations</li>
              <li>To ensure security and prevent fraud</li>
            </ul>
            <p className="mt-3">We do NOT process your data for automated decision-making or profiling.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">4. Consent Under DPDP Act</h2>
            <p>By checking the consent box during signup, you expressly consent to our processing of your
               personal data as described in this Privacy Policy and for the purposes stated above.</p>
            <p className="mt-3"><strong>Consent Details:</strong></p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Consent Version: <code className="text-gold">{CONSENT_VERSION}</code></li>
              <li>Consent Timestamp: Recorded at signup (stored in your account)</li>
              <li>You may withdraw consent at any time by deleting your account</li>
              <li>Withdrawal does not affect prior processing</li>
              <li>Consent is NOT a condition for service provision</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">5. Data Sharing</h2>
            <p>We do NOT sell, rent, or share your personal data with third parties, except:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li><strong>Service Providers:</strong> Email delivery (Resend), hosting (Vercel)</li>
              <li><strong>Legal Requirements:</strong> If required by law or court order</li>
              <li><strong>Trigger Event:</strong> When your executor portal is activated after missed check-ins</li>
            </ul>
            <p className="mt-3">Vault contents remain encrypted and are never shared in plaintext with any party, including us.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">6. Data Retention & Deletion</h2>
            <p>In accordance with the DPDP Act:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Personal data is retained only as long as your account is active</li>
              <li>You may request complete data deletion at any time via Settings → Delete Account</li>
              <li>Upon deletion request, all personal data, vault data, and metadata are permanently removed within 30 days</li>
              <li>Audit logs are retained for 90 days for security purposes then auto-deleted</li>
              <li>Data is deleted when the purpose for collection has ceased</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">7. Your Rights Under DPDP Act</h2>
            <p>You have the following rights:</p>
            <ul className="space-y-2 list-disc pl-6 mt-3">
              <li><strong>Right to Access:</strong> Download your data at any time via Settings</li>
              <li><strong>Right to Correction:</strong> Update your information via Settings</li>
              <li><strong>Right to Deletion:</strong> Request account deletion (grievance: support@virasat.in)</li>
              <li><strong>Right to Grievance Redressal:</strong> Contact support@virasat.in for any privacy concerns</li>
              <li><strong>Right to Withdraw Consent:</strong> Delete your account at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">8. Encryption & Zero-Knowledge Architecture</h2>
            <p>Our encryption model is zero-knowledge — meaning we have zero access to your data content:</p>
            <ul className="space-y-2 list-disc pl-6 mt-3">
              <li>All vault data is encrypted in your browser using AES-256-GCM</li>
              <li>Your master password never leaves your device</li>
              <li>We store only encrypted blobs and metadata (salt, key check, timestamps)</li>
              <li>We cannot decrypt your data even if compelled by legal process</li>
              <li>If you forget your master password and recovery shares, data is irrecoverable — this is by design</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">9. Data Security & Breach Response</h2>
            <p>We implement technical and organizational measures to protect your data:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Zero-knowledge encryption (AES-256-GCM)</li>
              <li>Secure session key management (sessionStorage, cleared on logout)</li>
              <li>Audit logging for all access and changes (90-day retention)</li>
              <li>In the event of a breach that compromises non-encrypted data, we will notify affected users and the Data Protection Board of India within the timeline prescribed by the DPDP Act</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">10. Children's Privacy</h2>
            <p>Virasat is not intended for users under 18 years of age. We do not knowingly collect
               personal information from minors. If you believe a minor has provided us with personal
               information, please contact us.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">11. Grievance Redressal</h2>
            <p>In accordance with the DPDP Act, you may raise concerns or complaints about data handling
               by contacting our Grievance Officer:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li><strong>Email:</strong> support@virasat.in</li>
              <li><strong>Response Time:</strong> We aim to respond within 30 days</li>
              <li><strong>Escalation:</strong> If unsatisfied, you may approach the Data Protection Board of India</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy to reflect changes in our practices or legal requirements.
               Material changes will be communicated via in-app notification and/or email. Continued use
               after changes constitutes acceptance.
               <br /><br />
               The current consent version is <code className="text-gold">{CONSENT_VERSION}</code>.
               If you do not agree with changes, you may delete your account.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">13. Contact</h2>
            <p>For questions about this policy or to exercise your rights:
              <br /><strong className="text-gold">support@virasat.in</strong></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gold/20 text-center">
          <Link href="/" className="text-gold hover:text-gold-dark transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
