'use client'
import Link from 'next/link'

export default function TermsPage() {
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

        <h1 className="font-display text-4xl mb-8">Terms of Service</h1>
        <p className="text-ash/60 font-mono text-sm mb-12">Last updated: June 2026</p>

        <div className="space-y-8 text-ash/80 leading-relaxed">
          <section className="bg-ember/10 border border-ember/30 p-6">
            <p className="text-ember/90 font-bold text-lg">
              IMPORTANT — READ CAREFULLY BEFORE USING VIRASAT
            </p>
            <p className="text-ash/70 text-sm mt-3">
              Virasat is a secure storage and delivery tool only. It does NOT replace a legal Will, Trust,
              or court-mandated succession process. We do not provide legal advice. Users must consult a
              qualified lawyer for estate planning and succession under applicable Indian laws (Hindu Succession
              Act, Muslim Personal Law, Indian Succession Act, etc.). Virasat delivers your encrypted data
              and instructions to designated beneficiaries after verified death. Actual ownership transfer of
              assets (bank accounts, property, crypto, etc.) follows standard legal procedures.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Virasat ("the Service"), you agree to be bound by these Terms of Service.
               If you do not agree, do not use the Service. These terms apply to all users, including
               beneficiaries and executors who receive notifications.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">2. Description of Service</h2>
            <p>Virasat provides a digital legacy vault service that allows users to securely store information
               about their assets and deliver messages to designated beneficiaries upon verified death. The
               service uses zero-knowledge encryption — meaning your data is encrypted in your browser and
               we cannot access it.</p>
            <p className="mt-3">The Service includes:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Encrypted storage of asset information (bank accounts, crypto, property, etc.)</li>
              <li>Beneficiary designation and delivery system</li>
              <li>Executor verification process</li>
              <li>Shamir Secret Sharing for recovery (optional)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">3. Not Legal Advice or Substituted Legal Process</h2>
            <div className="bg-ember/10 border border-ember/30 p-4">
              <p className="text-ember/90 font-bold mb-2">CRITICAL DISCLAIMER</p>
              <p className="text-ash/70 text-sm leading-relaxed">Virasat is NOT a legal will, NOT legal advice, and does NOT create legally binding
                 instruments for asset transfer. The Service only stores and delivers information. Actual
                 inheritance requires valid legal documentation per applicable Indian laws:</p>
              <ul className="space-y-1 list-disc pl-6 mt-2 text-ash/60">
                <li>Hindu Succession Act, 1956 (and 2005 amendment)</li>
                <li>Muslim Personal Law (Sharia-based succession)</li>
                <li>Indian Succession Act, 1925</li>
                <li>Other applicable personal laws</li>
              </ul>
            </div>
            <p className="mt-3">Users must consult qualified legal counsel in their jurisdiction. Virasat does not guarantee
               that any delivered information will be legally recognized or accepted by banks, courts, or
               other institutions.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">4. Religion Selection and Guidance</h2>
            <p>During signup, you may select your religion for informational purposes. This selection does
               NOT create any religious or legal prescriptions. Virasat provides general guidance only and
               does not tailor legal recommendations to specific religious requirements. Always consult
               qualified legal counsel familiar with your personal law.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">5. User Responsibilities</h2>
            <ul className="space-y-2 list-disc pl-6">
              <li>You must be at least 18 years old to use the Service</li>
              <li>You are responsible for the accuracy of information you provide</li>
              <li>You must maintain the confidentiality of your master password</li>
              <li>You must designate a trustworthy executor and beneficiaries</li>
              <li>You must keep your recovery shares safe (if using Shamir recovery)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">6. Account Security</h2>
            <p>You acknowledge that:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Your master password is NEVER stored on our servers</li>
              <li>If you forget your master password AND lose your recovery shares, your data is permanently unrecoverable</li>
              <li>Loss of master password and shares = permanent data loss. No exceptions.</li>
              <li>You should write down your master password and recovery shares and store them securely</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">7. Check-in and Trigger Process</h2>
            <p>The Service monitors your activity through periodic check-ins. After 3 missed check-ins:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Your designated executor is notified</li>
              <li>They must upload a death certificate for verification</li>
              <li>A 30-day waiting period applies to prevent fraud</li>
              <li>Upon successful verification, beneficiaries receive vault access</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">8. Data Privacy and Security</h2>
            <p>Zero-knowledge encryption means:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>All vault data is encrypted in your browser using AES-256-GCM</li>
              <li>We cannot decrypt your data — never have, never will</li>
              <li>We only store encrypted data and metadata needed for delivery</li>
              <li>Your master password is never transmitted to our servers</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">9. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>VIRASAT IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE</li>
              <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">10. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the
               exclusive jurisdiction of courts in India.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">11. Changes to Terms</h2>
            <p>We may update these Terms. Continued use after changes constitutes acceptance.
               Material changes will be notified via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">12. Contact</h2>
            <p>For questions: <strong className="text-gold">support@virasat.in</strong></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gold/20 text-center">
          <Link href="/" className="text-gold hover:text-gold-dark transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
