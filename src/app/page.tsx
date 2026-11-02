'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

const VAULT_ITEMS = [
  { icon: '🏦', label: 'Bank Accounts' },
  { icon: '📈', label: 'Fixed Deposits' },
  { icon: '₿', label: 'Crypto Wallets' },
  { icon: '🪙', label: 'Gold & Jewellery' },
  { icon: '🏠', label: 'Property Papers' },
  { icon: '📋', label: 'Insurance Policies' },
  { icon: '🔐', label: 'Passwords' },
  { icon: '🗝️', label: 'Bank Lockers' },
]

const STATS = [
  { number: '1.5M+', label: 'Inheritance cases\npending in Indian courts' },
  { number: '95%', label: 'Indians with\nzero will or plan' },
  { number: '₹3.7M', label: 'BTC lost forever\ndue to no inheritance plan' },
  { number: '2-of-3', label: 'Shamir Secret Sharing\nThreshold Encryption' },
]

export default function HomePage() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, -100])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Beta Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-gold/90 to-amber-600/90 text-vault-dark text-center py-2 px-4 text-sm font-medium tracking-wide">
        🧪 Vaaris is in <strong>Active Production Beta</strong> — Zero-Knowledge Inheritance Vault. <Link href="/beta" className="underline font-semibold">Learn more</Link>
      </div>

      {/* ─── NAV ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 transition-all duration-500 max-w-[100vw] overflow-hidden ${isScrolled ? 'bg-paper/90 backdrop-blur-md border-b border-gold/20 !py-4 shadow-sm' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 135 }}
            className="w-8 h-8 border border-gold/60 rotate-45 flex items-center justify-center transition-transform duration-700 bg-paper"
          >
            <div className="w-2 h-2 bg-gold" />
          </motion.div>
          <span className="font-display text-xl text-ink tracking-[0.2em] relative group cursor-pointer font-bold">
            VAARIS
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/nominee/login" className="font-mono text-xs text-ink/80 hover:text-gold-dark border border-gold/40 px-3 py-1.5 rounded transition-all bg-[#FAF6F0]">
            Nominee Portal →
          </Link>
          <Link href="/auth/login" className="font-body text-sm text-ink/80 hover:text-gold-dark transition-colors tracking-wide font-medium">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn-gold text-sm shadow-gold-glow">
            Start Free
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen paper-texture flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-10 pt-32 pb-20 xl:pr-[24rem]"
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-mono text-gold-dark text-xs tracking-[0.4em] uppercase mb-8 flex items-center gap-3 font-semibold"
            >
              <span className="w-6 h-px bg-gold/50"></span>
              Digital Legacy & Nominee Succession Platform — India
            </motion.p>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="font-display text-[clamp(2.5rem,7vw,6.5rem)] text-ink leading-[1.05] font-light mb-8 max-w-3xl"
            >
              Everything you built,<br />
              <em className="text-gold-dark italic font-light pr-4">safely passed on to your Vaaris.</em>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="font-body text-ink/75 text-xl max-w-xl leading-relaxed mb-12 font-light"
            >
               Your bank accounts, crypto, gold, property papers — encrypted with Shamir&apos;s Secret Sharing and AES-256, reaching your verified nominees when you&apos;re gone.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex items-center gap-6"
            >
              <Link href="/auth/signup" className="btn-gold text-base px-10 py-4 shadow-gold-glow animate-pulse-gold relative overflow-hidden group">
                <span className="relative z-10">Protect Your Family</span>
              </Link>
              <Link href="/nominee/login" className="font-mono text-ink/80 hover:text-gold-dark border border-gold/40 px-6 py-3.5 text-sm tracking-wide transition-all bg-[#FAF6F0]">
                Nominee Login →
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4"
          >
            {VAULT_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.08, duration: 0.6 }}
                whileHover={{ x: -10, scale: 1.05, backgroundColor: "#F2EBE0" }}
                className="flex items-center gap-4 bg-[#FAF6F0] border border-gold/30 px-5 py-3 rounded-md shadow-sm"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="w-8 h-8 rounded bg-paper flex items-center justify-center border border-gold/20 shadow-inner-gold">
                  <span className="text-base">{item.icon}</span>
                </div>
                <span className="font-mono text-ink/90 text-xs tracking-wider font-semibold">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-24 bg-gradient-to-b from-gold/0 via-gold to-gold/0 animate-float-slow" />
        </div>
      </section>

      {/* ─── STORY ─── */}
      <section className="py-32 px-10 max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-gold-shimmer opacity-30 blur-3xl pointer-events-none rounded-full transform -translate-y-1/2 h-[300px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="ornament-divider"><span>◆</span></div>
          <p className="font-display text-[clamp(1.5rem,3vw,2.5rem)] text-ink/90 leading-relaxed font-light text-center px-4 md:px-12">
            &quot;My father passed away last year. We spent <em className="text-ember font-medium drop-shadow-sm">8 months and ₹2 lakh</em> trying to find his FDs, access his crypto, and open his bank locker. His gold is still somewhere at home. Nobody knew anything.&quot;
          </p>
          <p className="text-center text-ash/80 font-body text-sm mt-8 tracking-widest uppercase items-center flex justify-center gap-4">
            <span className="w-8 h-px bg-ash/30"></span>
            A story shared by millions of Indian families
            <span className="w-8 h-px bg-ash/30"></span>
          </p>
          <div className="ornament-divider"><span>◆</span></div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="bg-paper py-24 px-10 border-y border-gold/20 relative overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-[#FAF6F0] border border-gold/30 p-10 text-center rounded shadow-sm relative group"
            >
              <div className="font-display text-5xl text-gold-dark font-light mb-4">
                {stat.number}
              </div>
              <div className="font-mono text-ink/70 text-xs tracking-wider uppercase leading-relaxed whitespace-pre-line relative z-10">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="relative py-40 px-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="font-mono text-gold-dark text-xs tracking-[0.4em] uppercase mb-4 font-semibold">The System</p>
          <h2 className="font-display text-5xl font-light text-ink">How Vaaris Works</h2>
          <div className="w-24 h-px bg-gold/50 mx-auto mt-8"></div>
        </motion.div>

        <div className="space-y-4 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-gold/0 via-gold/30 to-gold/0 hidden md:block"></div>
          {[
            { num: '01', title: 'Fill Your Vault', desc: 'Add bank accounts, FDs, crypto wallets, gold, insurance, and property. Encrypted in your browser using zero-knowledge AES-256 and Shamir secret splitting.' },
            { num: '02', title: 'Assign Your Nominees (Vaaris)', desc: 'Designate your trusted nominees and beneficiaries. Each nominee receives a Shamir cryptographic share.' },
            { num: '03', title: 'Automated Check-in', desc: 'Periodic check-in via email & WhatsApp. Missed check-ins automatically trigger alerts to your emergency contacts.' },
            { num: '04', title: 'Nominee Login & Death Certificate Verification', desc: 'Nominees log in via their dedicated portal, submit the municipal death certificate, and initiate the 48-hour security grace review.' },
            { num: '05', title: 'Shamir Key Reconstruction & Release', desc: 'When verification completes, the Nominee Share combines with the Server Share (2-of-3 threshold) to decrypt and transfer designated assets.' },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="glass-card flex flex-col md:flex-row gap-6 md:gap-10 p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(201,168,76,0.08)] group relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-colors duration-700"></div>
              <div className="font-mono text-gold/40 text-5xl font-light group-hover:text-gold transition-colors duration-500 w-16 shrink-0 pt-1 drop-shadow-sm md:text-right relative z-10">
                {step.num}
              </div>
              <div className="relative z-10">
                <h3 className="font-display text-3xl mb-3 text-ink group-hover:text-vault-dark transition-colors">{step.title}</h3>
                <p className="font-body text-ash/90 text-lg leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-paper py-40 px-10 text-center relative overflow-hidden border-t border-gold/20">
        {/* Legal Disclaimer Banner */}
        <div className="relative z-10 max-w-3xl mx-auto mb-8">
          <div className="bg-ember/10 border border-ember/30 p-5 rounded-sm">
            <p className="text-ember font-bold text-sm tracking-wider uppercase mb-2">
              ⚠️ Important — Not a Legal Service
            </p>
            <p className="text-ink/80 text-sm leading-relaxed">
              Vaaris is a secure storage and delivery tool. It does NOT replace a legal Will,
              Trust, or court-mandated succession process. Actual asset transfer requires valid legal
              documentation per applicable Indian laws. <Link href="/disclaimer" className="underline hover:text-gold-dark font-medium">Full Disclaimer →</Link>
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto bg-[#FAF6F0] p-12 md:p-20 rounded-2xl border border-gold/30 shadow-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-mono text-gold-dark text-xs tracking-[0.4em] uppercase mb-8 flex items-center justify-center gap-2 font-semibold">
              <span className="inline-block w-4 h-px bg-gold/50 mb-1"></span> Start Today <span className="inline-block w-4 h-px bg-gold/50 mb-1"></span>
            </p>
            <h2 className="font-display text-5xl md:text-6xl text-ink font-light mb-6">
              Free to start.<br />
              <em className="text-gold-dark italic font-serif">Takes 10 minutes.</em>
            </h2>
            <p className="font-body text-ink/70 mb-12 text-xl font-light">The best time to protect your family was yesterday. The second best time is now.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="btn-gold text-lg px-14 py-5 inline-block shadow-gold-glow animate-pulse-gold rounded-sm">
                Create Your Vault →
              </Link>
              <Link href="/nominee/login" className="border border-gold/50 text-ink hover:bg-gold/10 text-lg px-10 py-5 inline-block rounded-sm transition-colors font-medium">
                Nominee Login
              </Link>
            </div>
            <p className="font-mono text-ink/40 text-[10px] tracking-[0.2em] mt-8 uppercase font-semibold">
              FREE FOREVER · ZERO-KNOWLEDGE ENCRYPTION · SHAMIR SECRET SHARING · MADE IN INDIA
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#FAF6F0] border-t border-gold/20 px-10 py-12 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-3 hover:opacity-100 opacity-80 transition-opacity">
            <div className="w-6 h-6 border border-gold/60 rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gold" />
            </div>
            <span className="font-display text-ink tracking-[0.3em] text-sm font-bold">VAARIS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/nominee/login" className="font-mono text-ink/70 hover:text-gold-dark text-xs tracking-wider transition-colors font-medium">Nominee Portal</Link>
            <Link href="/terms" className="font-mono text-ink/50 text-xs tracking-wider hover:text-gold-dark transition-colors">Terms</Link>
            <Link href="/privacy" className="font-mono text-ink/50 text-xs tracking-wider hover:text-gold-dark transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="font-mono text-ink/50 text-xs tracking-wider hover:text-gold-dark transition-colors">Disclaimer</Link>
          </div>
          <p className="font-mono text-ink/50 text-xs tracking-wider">
            © {new Date().getFullYear()} Vaaris
          </p>
        </div>
      </footer>
    </>
  )
}
