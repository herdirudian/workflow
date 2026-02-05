
import { prisma } from './prisma'

type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export async function logSystem(level: LogLevel, message: string, metadata?: any) {
  try {
    await prisma.systemLog.create({
      data: {
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })
    console.log(`[${level}] ${message}`, metadata || '')
  } catch (e) {
    // Fallback if DB logging fails
    console.error(`FAILED TO LOG: [${level}] ${message}`, e)
  }
}
