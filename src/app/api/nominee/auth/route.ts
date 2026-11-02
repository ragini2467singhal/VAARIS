export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { Executor } from '@/models/Executor'
import { User } from '@/models/User'
import { FallbackDB } from '@/lib/fallbackDb'
import { ok, badRequest, serverError, unauthorized } from '@/lib/api'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { token, nomineeEmail, ownerEmail } = body

    let matchedNominee: any = null
    let matchedOwner: any = null

    // 1. Check by direct unique token
    if (token && token.trim()) {
      const cleanToken = token.trim()
      if (!isFallbackActive()) {
        try {
          matchedNominee = await Executor.findOne({ uniqueToken: cleanToken }).lean()
          if (matchedNominee) {
            matchedOwner = await User.findById(matchedNominee.userId).lean()
          }
        } catch {}
      }

      if (!matchedNominee) {
        matchedNominee = FallbackDB.findNomineeByToken(cleanToken)
        if (matchedNominee) {
          matchedOwner = FallbackDB.findUserById(matchedNominee.userId)
        }
      }
    }

    // 2. Check by Nominee Email + Owner Email
    if (!matchedNominee && nomineeEmail && ownerEmail) {
      const cleanNominee = nomineeEmail.toLowerCase().trim()
      const cleanOwner = ownerEmail.toLowerCase().trim()

      if (!isFallbackActive()) {
        try {
          const ownerDoc = await User.findOne({ email: cleanOwner }).lean()
          if (ownerDoc) {
            matchedOwner = ownerDoc
            matchedNominee = await Executor.findOne({
              userId: ownerDoc._id,
              email: cleanNominee
            }).lean()
          }
        } catch {}
      }

      if (!matchedNominee) {
        const ownerDoc = FallbackDB.findUserByEmail(cleanOwner)
        if (ownerDoc) {
          matchedOwner = ownerDoc
          const nominees = FallbackDB.getNominees(ownerDoc.id || ownerDoc._id)
          matchedNominee = nominees.find(n => n.email.toLowerCase().trim() === cleanNominee)
        }
      }
    }

    // Demo fallback convenience
    if (!matchedNominee && (nomineeEmail === 'nominee@vaaris.in' || token === 'vaaris-nominee-token-demo-2026')) {
      matchedNominee = FallbackDB.findNomineeByEmail('nominee@vaaris.in')
      if (matchedNominee) {
        matchedOwner = FallbackDB.findUserById(matchedNominee.userId)
      }
    }

    if (!matchedNominee) {
      return unauthorized('Nominee credentials not found. Check token or email combination.')
    }

    return ok({
      nominee: {
        id: (matchedNominee._id || matchedNominee.id).toString(),
        name: matchedNominee.name,
        email: matchedNominee.email,
        phone: matchedNominee.phone,
        relationship: matchedNominee.relationship,
        role: matchedNominee.role || 'primary',
        status: matchedNominee.status,
        uniqueToken: matchedNominee.uniqueToken,
        nomineeShare: matchedNominee.nomineeShare || matchedNominee.executorShare || '3e8b4a2f1c9d8e7b6a5c4d3e2f1a0b9c8d7e6f5a',
      },
      owner: matchedOwner ? {
        id: (matchedOwner._id || matchedOwner.id).toString(),
        name: matchedOwner.name,
        email: matchedOwner.email,
        status: matchedOwner.status,
      } : {
        name: 'Vaaris Vault Owner',
        email: ownerEmail || 'owner@vaaris.in',
        status: 'active'
      }
    }, 'Nominee authenticated successfully')
  } catch (err) {
    console.error('Nominee auth error:', err)
    return serverError(err)
  }
}
