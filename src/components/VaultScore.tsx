'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface VaultScoreData {
  score: number
  totalItems: number
  staleItems: number
  lastUpdated: string | null
  missingCategories: string[]
  categories: string[]
}

interface VaultScoreProps {
  userId: string
  compact?: boolean
}

export default function VaultScore({ userId, compact = false }: VaultScoreProps) {
  const [score, setScore] = useState<VaultScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reminderFreq, setReminderFreq] = useState('quarterly')

  useEffect(() => {
    fetchScore()
  }, [userId])

  const fetchScore = async () => {
    try {
      const res = await fetch(`/api/vault/score?userId=${userId}`)
      const json = await res.json()
      if (json.score !== undefined) {
        setScore(json)
      }
    } catch (err) {
      console.error('Failed to fetch score:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      await fetch('/api/vault/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reminderFrequency: reminderFreq, action: 'updateSettings' })
      })
      setSettingsOpen(false)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1B2F45] rounded-lg p-4 animate-pulse">
        <div className="h-20 bg-[#0D1B2A] rounded" />
      </div>
    )
  }

  if (!score) return null

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22C55E'
    if (s >= 60) return '#EAB308'
    if (s >= 40) return '#F97316'
    return '#EF4444'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Needs Work'
    return 'Out of Date'
  }

  if (compact) {
    return (
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setSettingsOpen(!settingsOpen)}
      >
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#1B2F45"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke={getScoreColor(score.score)}
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${(score.score / 100) * 125.6} 125.6`}
            />
          </svg>
          <span 
            className="absolute inset-0 flex items-center justify-center text-sm font-bold"
            style={{ color: getScoreColor(score.score) }}
          >
            {score.score}%
          </span>
        </div>
        <div>
          <p className="text-white text-sm font-medium">Vault Score</p>
          <p className="text-gray-400 text-xs">{score.totalItems} items</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1B2F45] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#C9A84C] font-medium">Vault Completeness</h3>
        <button 
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="text-gray-400 hover:text-white text-sm"
        >
          Settings
        </button>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#0D1B2A"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={getScoreColor(score.score)}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(score.score / 100) * 251.2} 251.2`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className="text-2xl font-bold"
              style={{ color: getScoreColor(score.score) }}
            >
              {score.score}%
            </span>
            <span className="text-gray-400 text-xs">
              {getScoreLabel(score.score)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Items</span>
            <span className="text-white">{score.totalItems}</span>
          </div>
          {score.staleItems > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Need Review</span>
              <span className="text-orange-400">{score.staleItems}</span>
            </div>
          )}
          {score.lastUpdated && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white text-xs">
                {new Date(score.lastUpdated).toLocaleDateString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>

      {score.missingCategories.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <p className="text-gray-400 text-sm mb-2">Consider adding:</p>
          <div className="flex flex-wrap gap-2">
            {score.missingCategories.slice(0, 5).map(cat => (
              <span 
                key={cat}
                className="bg-[#0D1B2A] text-gray-300 text-xs px-2 py-1 rounded"
              >
                {cat.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="border-t border-gray-800 pt-4 mt-4">
          <p className="text-gray-400 text-sm mb-2">Reminder Frequency</p>
          <select
            value={reminderFreq}
            onChange={(e) => setReminderFreq(e.target.value)}
            className="w-full bg-[#0D1B2A] border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannually">Twice a year</option>
            <option value="never">Never</option>
          </select>
          <button
            onClick={saveSettings}
            className="w-full mt-3 bg-[#C9A84C] text-[#0D1B2A] py-2 rounded font-medium text-sm"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  )
}