'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addSource(formData: FormData) {
  const name = formData.get('name') as string
  const rssUrl = formData.get('rssUrl') as string
  const category = formData.get('category') as string
  
  if (!name || !rssUrl) {
      // return { error: 'Missing fields' } 
      // For now just logging, as simple form action expects void
      console.error('Missing fields')
      return
  }

  try {
    await prisma.source.create({
      data: { name, rssUrl, category }
    })
    revalidatePath('/sources')
  } catch (e) {
    console.error(e)
    // return { error: 'Failed to create source. URL might be duplicate.' }
  }
}

export async function toggleSource(id: string, currentState: boolean) {
    await prisma.source.update({
        where: { id },
        data: { isActive: !currentState }
    })
    revalidatePath('/sources')
}

export async function deleteSource(id: string) {
    try {
        await prisma.source.delete({ where: { id } })
        revalidatePath('/sources')
    } catch (e) {
        console.error("Failed to delete source", e)
    }
}
