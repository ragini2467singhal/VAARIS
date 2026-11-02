'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'

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
  { number: '0', label: 'Serious death tech\nstartups in India' },
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

      {/* ─── NAV ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 transition-all duration-500 max-w-[100vw] overflow-hidden ${isScrolled ? 'bg-vault-dark/80 backdrop-blur-md border-b border-gold/10 !py-4 shadow-vault-deep' : 'mix-blend-normal'}`}>
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 135 }}
            className="w-8 h-8 border border-gold/60 rotate-45 flex items-center justify-center transition-transform duration-700"
          >
            <div className="w-2 h-2 bg-gold animate-glow-pulse" />
          </motion.div>
          <span className="font-display text-xl text-gold tracking-[0.2em] relative group cursor-none">
            VIRASAT
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/auth/login" className="font-body text-sm text-ash hover:text-gold-light transition-colors tracking-wide">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn-gold text-sm shadow-gold-glow cursor-none">
            Start Free
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen vault-bg flex items-center overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        {/* Radial glow */}
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
              className="font-mono text-gold text-xs tracking-[0.4em] uppercase mb-8 flex items-center gap-3 drop-shadow-[0_0_8px_rgba(201,168,76,0.4)]"
            >
              <span className="w-6 h-px bg-gold/50"></span>
              Digital Legacy Vault — India
            </motion.p>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="font-display text-[clamp(2.5rem,7vw,6.5rem)] text-paper leading-[1.05] font-light mb-8 max-w-3xl"
            >
              Everything you built,<br />
              <em className="text-gradient-gold italic font-light pr-4">safely passed on.</em>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="font-body text-vault-light/80 text-xl max-w-xl leading-relaxed mb-12 text-paper/70 font-light"
            >
               Your bank accounts, crypto, gold, property papers — stored in an encrypted vault that automatically reaches your family when you&apos;re gone.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex items-center gap-6"
            >
              <Link href="/auth/signup" className="btn-gold text-base px-10 py-4 cursor-none animate-pulse-gold relative overflow-hidden group">
                <span className="relative z-10">Protect Your Family</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gold via-white to-gold opacity-0 group-hover:opacity-20 group-hover:animate-shimmer transition-opacity"></div>
              </Link>
              <Link href="#how" className="font-body text-gold/70 hover:text-gold cursor-none hover:text-shadow-[0_0_8px_rgba(201,168,76,0.8)] text-sm tracking-wide transition-all flex items-center gap-2 group">
                See how it works
                <span className="text-lg group-hover:translate-y-1 transition-transform">↓</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Vault items floating */}
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
                whileHover={{ x: -10, scale: 1.05, backgroundColor: "rgba(20, 35, 50, 0.95)" }}
                className="flex items-center gap-4 premium-glass px-5 py-3 rounded-md cursor-none"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="w-8 h-8 rounded bg-vault-dark flex items-center justify-center border border-gold/10 shadow-inner-gold">
                  <span className="text-base">{item.icon}</span>
                </div>
                <span className="font-mono text-gold/80 text-xs tracking-wider font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-24 bg-gradient-to-b from-gold/0 via-gold to-gold/0 animate-float-slow" />
        </div>
      </section>

      {/* ─── STORY ─── */}
      <section className="py-32 px-10 max-w-4xl mx-auto relative cursor-none">
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
      <section className="vault-bg py-24 px-10 border-y border-gold/10 relative overflow-hidden cursor-none">
        <div className="absolute inset-0 bg-premium-glass-grad opacity-40"></div>
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gold/20 shadow-vault-deep">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, zIndex: 10, backgroundColor: "#0f1c2b" }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-vault-mid/95 p-12 text-center group transition-colors duration-500 backdrop-blur-md relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="font-display text-5xl text-gold-light font-light mb-4 drop-shadow-[0_0_15px_rgba(201,168,76,0.3)] group-hover:text-gold group-hover:drop-shadow-gold-glow-strong transition-all duration-300">
                {stat.number}
              </div>
              <div className="font-mono text-paper/50 group-hover:text-gold/80 transition-colors text-xs tracking-wider uppercase leading-relaxed whitespace-pre-line relative z-10">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="relative py-40 px-10 max-w-5xl mx-auto cursor-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="font-mono text-gold-dark text-xs tracking-[0.4em] uppercase mb-4 font-semibold">The System</p>
          <h2 className="font-display text-5xl font-light text-ink">How Virasat Works</h2>
          <div className="w-24 h-px bg-gold/50 mx-auto mt-8"></div>
        </motion.div>

        <div className="space-y-4 relative">
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-gold/0 via-gold/30 to-gold/0 hidden md:block"></div>
          {[
            { num: '01', title: 'Fill Your Vault', desc: 'Add your bank accounts, FDs, crypto wallets, gold, insurance, property — everything encrypted in your browser. We never see your data.' },
            { num: '02', title: 'Assign to Family', desc: 'Tell us who gets what. Your FD goes to your wife. Your crypto to your son. Your letters to your daughter on her 18th birthday.' },
            { num: '03', title: 'Weekly Check-in', desc: 'Every week, one WhatsApp. One tap. That\'s it. Miss 3 times and your Executor gets notified.' },
            { num: '04', title: 'Executor Verifies', desc: 'Your trusted Executor uploads the death certificate. A 30-day waiting period begins to prevent fraud.' },
            { num: '05', title: 'Family Receives', desc: 'Everyone gets exactly what you intended. Your letters are delivered. Your assets are documented. Your family is okay.' },
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
      <section className="vault-bg py-40 px-10 text-center relative overflow-hidden border-t border-gold/20 cursor-none">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #C9A84C 1.5px, transparent 1.5px)',
            backgroundSize: '48px 48px'
          }}
        />
        
        {/* Cinematic light leaks */}
        <div className="absolute -top-[20%] left-[10%] w-[40%] h-[140%] bg-gold opacity-10 blur-[100px] rounded-full rotate-45 transform pointer-events-none"></div>
        <div className="absolute -top-[20%] right-[10%] w-[40%] h-[140%] bg-vault-light opacity-30 blur-[100px] rounded-full -rotate-45 transform pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto premium-glass p-12 md:p-20 rounded-2xl border border-gold/20 shadow-vault-deep">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-mono text-gold-light/60 text-xs tracking-[0.4em] uppercase mb-8 flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-px bg-gold/50 mb-1"></span> Start Today <span className="inline-block w-4 h-px bg-gold/50 mb-1"></span>
            </p>
            <h2 className="font-display text-5xl md:text-6xl text-paper font-light mb-6">
              Free to start.<br />
              <em className="text-gradient-gold">Takes 10 minutes.</em>
            </h2>
            <p className="font-body text-paper/60 mb-12 text-xl font-light">The best time to do this was yesterday. The second best time is now.</p>
            <Link href="/auth/signup" className="btn-gold text-lg px-14 py-5 inline-block cursor-none shadow-gold-glow animate-pulse-gold rounded-sm">
              Create Your Vault →
            </Link>
            <p className="font-mono text-paper/40 text-[10px] tracking-[0.2em] mt-8 opacity-70">
              FREE FOREVER · ZERO-KNOWLEDGE ENCRYPTION · MADE IN INDIA
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-vault-dark border-t border-gold/10 px-10 py-16 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10 hover:opacity-100 opacity-80 transition-opacity cursor-none">
          <div className="w-6 h-6 border border-gold/40 rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gold/70" />
          </div>
          <span className="font-display text-gold/70 tracking-[0.3em] text-sm">VIRASAT</span>
        </div>
        <p className="font-mono text-gold/40 text-xs tracking-[0.2em] text-center relative z-10">
          A LOVE LETTER TO YOUR FAMILY&apos;S FUTURE
        </p>
        <p className="font-mono text-gold/30 text-xs tracking-wider relative z-10">© {new Date().getFullYear()} Virasat</p>
      </footer>
    </>
  )
}
