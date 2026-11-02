'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

interface ImpactData {
  overview: {
    totalUsers: number
    activeUsers: number
    verifiedDeceased: number
    totalVaultItems: number
    totalMessages: number
    deliveredMessages: number
    totalCheckIns: number
    missedCheckIns: number
    totalExecutorRequests: number
    completedDeliveries: number
  }
  categories: Array<{ _id: string; count: number }>
  impact: {
    familiesProtected: number
    inheritanceCasesPrevented: number
    courtCasesAvoided: number
    totalValueProtected: number
    messagesDelivered: number
    successfulDeliveries: number
  }
  engagement: {
    checkInSuccessRate: string
    messageDeliveryRate: string
    vaultCompletionRate: string
  }
}

export default function ImpactDashboard() {
  const [data, setData] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/impact')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen vault-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin mb-4" />
          <p className="font-mono text-gold/50 text-sm tracking-wider">CALCULATING IMPACT</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const categoryData = {
    labels: data.categories.map(c => c._id.replace('_', ' ').toUpperCase()),
    datasets: [{
      label: 'Items Protected',
      data: data.categories.map(c => c.count),
      backgroundColor: 'rgba(201, 168, 76, 0.8)',
      borderColor: '#C9A84C',
      borderWidth: 1,
    }]
  }

  const engagementData = {
    labels: ['Check-in Success', 'Message Delivery', 'Vault Completion'],
    datasets: [{
      label: 'Rate (%)',
      data: [
        parseFloat(data.engagement.checkInSuccessRate),
        parseFloat(data.engagement.messageDeliveryRate),
        parseFloat(data.engagement.vaultCompletionRate)
      ],
      backgroundColor: [
        'rgba(201, 168, 76, 0.8)',
        'rgba(26, 92, 58, 0.8)',
        'rgba(139, 38, 53, 0.8)',
      ],
      borderWidth: 1,
    }]
  }

  return (
    <div className="min-h-screen paper-texture p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="font-mono text-gold/60 text-xs tracking-[0.3em] uppercase mb-4">Social Impact Dashboard</p>
          <h1 className="font-display text-5xl text-ink mb-4">Virasat&apos;s Real-World Impact</h1>
          <p className="font-body text-ash/80 text-xl max-w-3xl mx-auto">
            Every number represents a family protected, a legacy preserved, and countless court battles prevented.
          </p>
          <span className="inline-block mt-4 px-3 py-1 rounded-full border border-gold/40 text-gold/80 font-mono text-xs tracking-wider uppercase">
            ⚠️ Demo Data — not real usage statistics
          </span>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Families Protected', value: data.impact.familiesProtected.toLocaleString(), icon: '👨‍👩‍👧‍👦' },
            { label: 'Court Cases Prevented', value: data.impact.courtCasesAvoided.toLocaleString(), icon: '⚖️' },
            { label: 'Value Protected (₹)', value: `${(data.impact.totalValueProtected / 100).toFixed(1)}Cr`, icon: '💰' },
            { label: 'Messages Delivered', value: data.impact.messagesDelivered.toLocaleString(), icon: '💌' },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="vault-card p-6 text-center"
            >
              <div className="text-3xl mb-3">{metric.icon}</div>
              <div className="font-display text-3xl text-gold mb-2">{metric.value}</div>
              <div className="font-mono text-gold/60 text-xs tracking-wider uppercase">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="vault-card p-6"
          >
            <h3 className="font-display text-2xl text-gold mb-6">Assets Protected by Category</h3>
            <Bar
              data={categoryData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(201, 168, 76, 0.1)' },
                    ticks: { color: '#C9A84C' }
                  },
                  x: {
                    grid: { color: 'rgba(201, 168, 76, 0.1)' },
                    ticks: { color: '#C9A84C', font: { size: 10 } }
                  }
                }
              }}
            />
          </motion.div>

          {/* Engagement Rates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="vault-card p-6"
          >
            <h3 className="font-display text-2xl text-gold mb-6">Platform Engagement</h3>
            <Doughnut
              data={engagementData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: { color: '#C9A84C', font: { size: 12 } }
                  }
                }
              }}
            />
          </motion.div>
        </div>

        {/* Detailed Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="vault-card p-8"
        >
          <h3 className="font-display text-3xl text-gold mb-8 text-center">Detailed Impact Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Total Registered Users', value: data.overview.totalUsers.toLocaleString() },
              { label: 'Active Legacy Plans', value: data.overview.activeUsers.toLocaleString() },
              { label: 'Successful Deliveries', value: data.overview.completedDeliveries.toLocaleString() },
              { label: 'Digital Assets Secured', value: data.overview.totalVaultItems.toLocaleString() },
              { label: 'Final Messages Created', value: data.overview.totalMessages.toLocaleString() },
              { label: 'Check-ins Processed', value: data.overview.totalCheckIns.toLocaleString() },
              { label: 'Inheritance Disputes Prevented', value: data.impact.inheritanceCasesPrevented.toLocaleString() },
              { label: 'Estimated Value Protected', value: `₹${(data.impact.totalValueProtected * 100000).toLocaleString()}` },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-center p-4 border border-gold/20 rounded-lg hover:border-gold/40 transition-colors"
              >
                <div className="font-display text-2xl text-gold mb-2">{stat.value}</div>
                <div className="font-mono text-gold/60 text-xs tracking-wider uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-12 vault-card p-8"
        >
          <h3 className="font-display text-3xl text-gold mb-4">Join the Movement</h3>
          <p className="font-body text-ash/80 text-lg mb-6 max-w-2xl mx-auto">
            Every user who creates their Virasat vault prevents family disputes, preserves legacies, and ensures their loved ones are taken care of.
          </p>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="font-display text-4xl text-sage mb-2">{data.engagement.checkInSuccessRate}%</div>
              <div className="font-mono text-gold/60 text-xs tracking-wider uppercase">Check-in Success Rate</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl text-gold mb-2">₹{(data.impact.totalValueProtected / 10).toFixed(1)}Cr+</div>
              <div className="font-mono text-gold/60 text-xs tracking-wider uppercase">Assets Protected</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl text-sage mb-2">{data.impact.courtCasesAvoided}</div>
              <div className="font-mono text-gold/60 text-xs tracking-wider uppercase">Court Cases Prevented</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}