export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Executor, Beneficiary, Message, VaultItem, CheckIn, TriggerEvent } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError, badRequest } from '@/lib/api'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

export async function DELETE(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized('Authentication required')

    await connectDB()

    const { confirm } = await req.json().catch(() => ({ confirm: '' }))
    if (confirm !== 'DELETE_MY_ACCOUNT') {
      return badRequest('Confirmation phrase required: DELETE_MY_ACCOUNT')
    }

    const userId = user.id

    await Promise.all([
      Executor.deleteMany({ userId }),
      Beneficiary.deleteMany({ ownerId: userId }),
      Message.deleteMany({ userId }),
      VaultItem.deleteMany({ userId }),
      CheckIn.deleteMany({ userId }),
      TriggerEvent.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ])

    await logAuditEvent({
      userId,
      action: AUDIT_ACTIONS.AUTH.LOGOUT,
      metadata: { reason: 'account_deleted' },
      success: true
    })

    return ok(null, 'Account and all data deleted successfully')
  } catch (err) {
    console.error('Delete account error:', err)
    return serverError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      { error: 'Use DELETE to delete your account. Confirmation is required.' },
      { status: 405 }
    )
  } catch (err) {
    return serverError(err)
  }
}
