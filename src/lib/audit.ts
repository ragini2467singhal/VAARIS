import { AuditLog } from '@/models/index'
import { AuditAction } from '@/types'

interface AuditLogInput {
  userId?: string
  executorId?: string
  action: AuditAction
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  success?: boolean
  errorMessage?: string
}

let auditBatch: AuditLogInput[] = []
let batchTimeout: NodeJS.Timeout | null = null

export async function logAuditEvent(input: AuditLogInput) {
  const entry = {
    ...input,
    createdAt: new Date()
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', entry.action, entry.userId ? `user:${entry.userId}` : '', entry.success === false ? 'FAILED' : '')
    return
  }

  auditBatch.push(entry)
  
  if (auditBatch.length >= 10) {
    await flushAuditLogs()
  } else if (!batchTimeout) {
    batchTimeout = setTimeout(flushAuditLogs, 5000)
  }
}

async function flushAuditLogs() {
  if (batchTimeout) {
    clearTimeout(batchTimeout)
    batchTimeout = null
  }
  
  if (auditBatch.length === 0) return
  
  const batch = [...auditBatch]
  auditBatch = []
  
  try {
    await AuditLog.insertMany(batch, { ordered: false })
  } catch (error) {
    console.error('Failed to write audit logs:', error)
  }
}

export async function getAuditLogs(userId: string, options: {
  action?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
} = {}) {
  const query: Record<string, any> = { userId }
  
  if (options.action) {
    query.action = options.action
  }
  
  if (options.startDate || options.endDate) {
    query.timestamp = {}
    if (options.startDate) query.timestamp.$gte = options.startDate
    if (options.endDate) query.timestamp.$lte = options.endDate
  }

  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .skip(options.offset || 0)
    .limit(options.limit || 50)
    .lean()

  const total = await AuditLog.countDocuments(query)

  return { logs, total }
}

export function getClientInfo(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || 'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ipAddress, userAgent }
}

export const AUDIT_ACTIONS = {
  AUTH: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    PASSWORD_CHANGED: 'password_changed'
  },
  VAULT: {
    ACCESS: 'vault_access',
    UPDATE: 'vault_update',
    ITEM_CREATE: 'vault_item_create',
    ITEM_DELETE: 'vault_item_delete'
  },
  BENEFICIARY: {
    ADD: 'beneficiary_add',
    REMOVE: 'beneficiary_remove'
  },
  MESSAGE: {
    CREATE: 'message_create'
  },
  TRIGGER: {
    INITIATED: 'trigger_initiated',
    CANCELLED: 'trigger_cancelled',
    COMPLETED: 'trigger_completed'
  },
  RECOVERY: {
    INITIATED: 'recovery_initiated',
    COMPLETED: 'recovery_completed',
    CANCELLED: 'recovery_cancelled'
  },
  SETTINGS: {
    CHANGED: 'settings_changed'
  },
  EXECUTOR: {
    VERIFIED: 'executor_verified',
    ADDED: 'executor_added'
  },
  DATA: {
    EXPORTED: 'data_exported'
  }
} as const