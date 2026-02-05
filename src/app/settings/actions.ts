
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key')

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload.username as string
  } catch {
    return null
  }
}

export async function changePassword(prevState: any, formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' }
  }

  const username = await getAuthenticatedUser()
  if (!username) {
    return { error: 'Unauthorized' }
  }

  const user = await prisma.adminUser.findUnique({ where: { username } })
  if (!user) {
    return { error: 'User not found' }
  }

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    return { error: 'Incorrect current password' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.adminUser.update({
    where: { username },
    data: { password: hashedPassword }
  })

  return { success: 'Password updated successfully' }
}

export async function addAccount(formData: FormData) {
  const name = formData.get('name') as string
  const apiUrl = formData.get('apiUrl') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const category = formData.get('category') as string || null

  if (!name || !apiUrl || !username || !password) {
    throw new Error('All fields are required')
  }

  await prisma.externalAccount.create({
    data: {
      name,
      apiUrl,
      username,
      password, // Note: Should encrypt in production
      category
    },
  })

  revalidatePath('/settings')
}

export async function deleteAccount(id: string) {
  await prisma.externalAccount.delete({
    where: { id },
  })
  revalidatePath('/settings')
}

export async function toggleAccount(id: string, isActive: boolean) {
    await prisma.externalAccount.update({
        where: { id },
        data: { isActive }
    })
    revalidatePath('/settings')
}

export async function savePrompt(formData: FormData) {
  const prompt = formData.get('prompt') as string
  if (!prompt) return

  const key = 'ai_prompt_template'
  
  const existing = await prisma.systemSetting.findUnique({ where: { key } })

  if (existing) {
      await prisma.systemSetting.update({
          where: { key },
          data: { value: prompt }
      })
  } else {
      await prisma.systemSetting.create({
          data: {
              key,
              value: prompt,
              description: 'Custom AI Prompt Template'
          }
      })
  }
  revalidatePath('/settings')
}
