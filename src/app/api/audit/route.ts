import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getAuditLogs } from '@/lib/audit'
import { AuditAction } from '@/types'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const { logs, total } = await getAuditLogs(user.id, {
      action,
      limit,
      offset,
      startDate,
      endDate
    })

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log._id,
        action: log.action,
        timestamp: log.timestamp,
        success: log.success,
        metadata: log.metadata,
        ipAddress: log.ipAddress
      })),
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Audit log fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}