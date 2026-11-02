'use client'
import Link from 'next/link'

export default function DisclaimerPage() {
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

        <h1 className="font-display text-4xl mb-8">Legal Disclaimer</h1>
        <p className="text-ash/60 font-mono text-sm mb-12">Last updated: June 2026</p>

        <div className="space-y-8 text-ash/80 leading-relaxed">
          <section className="bg-ember/10 border border-ember/30 p-6">
            <p className="text-ember/90 font-bold text-lg mb-3">
              IMPORTANT — THIS IS NOT LEGAL ADVICE
            </p>
            <p className="text-ash/70 text-sm leading-relaxed">
              Virasat is a secure storage and delivery tool only. It does NOT replace a legal Will,
              Trust, or court-mandated succession process. We do not provide legal advice. Users must
              consult a qualified lawyer for estate planning and succession under applicable Indian laws.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">1. No Legal Advice</h2>
            <p>
              The information provided through Virasat is for organizational purposes only and does not
              constitute legal advice. No attorney-client relationship is created by using our Service.
            </p>
            <p className="mt-3">
              For legal succession matters, you MUST consult:
            </p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>A qualified advocate in your jurisdiction</li>
              <li>A legal expert specializing in inheritance law</li>
              <li>An estate planning professional familiar with your personal law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">2. Not a Substitute for Legal Documentation</h2>
            <p>
              Virasat does NOT:
            </p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Create legally binding wills or testamentary instruments</li>
              <li>Establish trust arrangements or legal fiduciary relationships</li>
              <li>Provide court-recognized succession documentation</li>
              <li>Guarantee asset transfer to designated beneficiaries</li>
            </ul>
            <p className="mt-3">
              Actual ownership transfer of assets requires valid legal documentation and court processes
              where applicable, regardless of digital records.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">3. Applicable Indian Laws</h2>
            <p>
              Estate planning and succession in India is governed by various personal laws depending on
              your religion. Virasat provides general guidance only and does not interpret these laws:
            </p>
            <ul className="space-y-2 list-disc pl-6 mt-3">
              <li><strong>Hindu Succession Act, 1956</strong> (as amended in 2005 for daughters' rights)</li>
              <li><strong>Muslim Personal Law</strong> (Sharia-based succession rules)</li>
              <li><strong>Indian Succession Act, 1925</strong> (for Christians, Parsis, and others)</li>
              <li><strong>Sikh Gurdwara Act and Sikh Succession</strong></li>
              <li><strong>Jain Succession</strong></li>
            </ul>
            <p className="mt-3">
              Your religion selection in Virasat is for informational context only and does not create
              any legally binding prescriptions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">4. Information Delivery ≠ Legal Recognition</h2>
            <p>
              While Virasat delivers encrypted information to your beneficiaries, this does NOT mean:
            </p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>Banks will recognize digital records without proper legal documents</li>
              <li>Property will be transferred based on vault entries</li>
              <li>Crypto exchanges will transfer assets without legal heir documentation</li>
              <li>Insurance companies will process claims based on our notifications</li>
            </ul>
            <p className="mt-3">
              Your beneficiaries must still follow standard legal procedures with banks, courts, and
              other institutions to claim assets.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">5. Zero-Knowledge Encryption</h2>
            <p>
              Our zero-knowledge architecture means:
            </p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li>We cannot access your vault contents</li>
              <li>We cannot recover your master password if lost</li>
              <li>We cannot bypass encryption even under legal pressure</li>
              <li>If you lose your master password and shares, data is permanently lost</li>
            </ul>
            <p className="mt-3 bg-ember/10 border border-ember/30 p-4">
              <strong className="text-ember/90">WARNING:</strong> Losing your master password AND all
              recovery shares (Share 2 from executor + Share 3 written down) results in permanent,
              irreversible data loss. No amount of legal documentation can recover encrypted data we
              never had access to.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">6. Shamir Secret Sharing Recovery</h2>
            <p>
              The Shamir Secret Sharing recovery system allows password reset but requires:
            </p>
            <ul className="space-y-2 list-disc pl-6 mt-2">
              <li><strong>Share 2</strong> — Your executor must provide this share</li>
              <li><strong>Share 3</strong> — You must have written this down and kept it safe</li>
              <li>Any 2 of 3 shares reconstruct the original password</li>
            </ul>
            <p className="mt-3">
              This is NOT a substitute for proper estate planning documentation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">7. No Warranty</h2>
            <p>
              The Service is provided "as is" without warranties of any kind, either express or implied.
              We do not warrant that the Service will meet your requirements or that it will be
              uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Virasat shall not be liable for any indirect,
              incidental, special, consequential or punitive damages, or any loss of data, profits,
              revenue, or business opportunity, arising out of or related to your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Virasat, its affiliates, and their respective
              officers, directors, employees, and agents from any claim or demand arising from your
              breach of these terms or your violation of any law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold mb-4">10. Contact Information</h2>
            <p>
              For questions about this disclaimer or the Service:
              <br />
              <strong className="text-gold">support@virasat.in</strong>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gold/20 text-center">
          <Link href="/" className="text-gold hover:text-gold-dark transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}