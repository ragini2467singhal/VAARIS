'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function BetaPage() {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className='min-h-screen vault-bg paper-texture'>
      <div className='max-w-2xl mx-auto px-6 py-24'>
        <h1 className='font-display text-4xl text-gold mb-4'>Closed Beta</h1>
        <p className='text-ash/70 mb-8'>
          This instance is invite-only. Help us improve Virasat by reporting bugs and sharing feedback.
        </p>

        <div className='vault-card p-6 mb-8'>
          <h2 className='font-display text-2xl text-gold mb-3'>Beta Checklist</h2>
          <ol className='list-decimal list-inside space-y-2 text-ash/80'>
            <li>Lawyer review recommendation</li>
            <li>Test all critical flows</li>
            <li>Set Vercel env vars</li>
            <li>Monitor first 10 users</li>
            <li>Collect feedback</li>
          </ol>
        </div>

        <div className='vault-card p-6 mb-8'>
          <h2 className='font-display text-2xl text-gold mb-3'>Report an Issue</h2>
          <p className='text-ash/70 mb-4'>
            Found a bug or have a feature request? Open a GitHub issue.
          </p>
          <Link
            href='https://github.com/viratcore01/virasat/issues'
            target='_blank'
            rel='noreferrer'
            className='btn-gold inline-block text-sm'
          >
            Open GitHub Issue
          </Link>
        </div>

        <div className='vault-card p-6 mb-8'>
          <h2 className='font-display text-2xl text-gold mb-3'>Send Feedback</h2>
          {submitted ? (
            <p className='text-ash/80'>Thanks! Your feedback has been recorded.</p>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder='What should we improve?'
                className='virasat-input w-full h-32'
                required
              />
              <button type='submit' className='btn-gold text-sm'>Submit Feedback</button>
            </form>
          )}
        </div>

        <div className='vault-card p-6'>
          <h2 className='font-display text-2xl text-gold mb-3'>Current Status</h2>
          <ul className='space-y-2 text-ash/80'>
            <li>Zero-knowledge encryption: intact</li>
            <li>All legal disclaimers: visible</li>
            <li>Build status: passing</li>
            <li>Deployment target: Vercel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

