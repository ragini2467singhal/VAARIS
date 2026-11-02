import { connectDB } from '../src/lib/db'
import { User, UserDocument } from '../src/models/User'
import { encryptField, decryptField } from '../src/lib/serverCrypto'

async function migrateUsers() {
  console.log('Connecting to database...')
  await connectDB()

  console.log('Finding unencrypted users...')
  const unencryptedUsers = await User.find({ isDataEncrypted: false }) as UserDocument[]

  if (unencryptedUsers.length === 0) {
    console.log('No users need migration.')
    return
  }

  console.log(`Found ${unencryptedUsers.length} users to migrate.`)

  let migrated = 0
  const errors: string[] = []

  for (const user of unencryptedUsers) {
    try {
      const originalPhone = user.phone
      const originalReligion = user.religion
      const originalDob = user.dob

      const encryptedPhone = encryptField(originalPhone)
      const encryptedReligion = encryptField(originalReligion)
      const encryptedDob = encryptField(originalDob)

      const verifyPhone = decryptField(encryptedPhone)
      const verifyReligion = decryptField(encryptedReligion)
      const verifyDob = decryptField(encryptedDob)

      if (verifyPhone !== originalPhone || verifyReligion !== originalReligion || verifyDob !== originalDob) {
        errors.push(`User ${user._id}: Decryption verification failed`)
        continue
      }

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            phone: encryptedPhone,
            religion: encryptedReligion,
            dob: encryptedDob,
            isDataEncrypted: true
          }
        }
      )

      migrated++
      console.log(`Migrated user ${migrated}/${unencryptedUsers.length}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`User ${user._id}: ${errorMessage}`)
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`Migrated: ${migrated}`)
  console.log(`Failed: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(e => console.log(`  - ${e}`))
  }
}

migrateUsers().catch(console.error)