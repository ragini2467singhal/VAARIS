import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose | null> | null
  isFallback: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null, isFallback: false }
global.mongooseCache = cached

export function isFallbackActive(): boolean {
  return cached.isFallback || !cached.conn || mongoose.connection.readyState !== 1
}

export async function connectDB(): Promise<typeof mongoose | null> {
  let uri = process.env.MONGODB_URI

  // Clean placeholder URIs
  if (!uri || uri === 'your_value_here' || uri.includes('<USER>') || uri.includes('placeholder')) {
    uri = 'mongodb://127.0.0.1:27017/vaaris'
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
    }).then(conn => {
      cached.isFallback = false
      console.log('✅ Vaaris: MongoDB connected successfully')
      return conn
    }).catch(err => {
      cached.isFallback = true
      console.warn('⚠️ Vaaris: MongoDB offline or unreachable (' + err.message + '). Vaaris Local Fallback Engine is active.')
      return null
    })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch {
    cached.isFallback = true
    return null
  }
}
