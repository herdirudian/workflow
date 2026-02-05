
'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { redirect } from 'next/navigation'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key')

export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Missing credentials' }
  }

  const user = await prisma.adminUser.findUnique({ where: { username } })

  if (!user) {
    return { error: 'Invalid credentials' }
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return { error: 'Invalid credentials' }
  }

  // Create JWT
  const token = await new SignJWT({ username: user.username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(SECRET_KEY)

  // Set Cookie
  const cookieStore = await cookies()
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  })

  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
  redirect('/login')
}
