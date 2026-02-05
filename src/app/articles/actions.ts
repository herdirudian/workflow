
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateArticle(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const slug = formData.get('slug') as string
  const metaDesc = formData.get('metaDesc') as string
  const status = formData.get('status') as string

  await prisma.article.update({
    where: { id },
    data: {
      title,
      content,
      slug,
      metaDesc,
      status,
      updatedAt: new Date()
    }
  })

  revalidatePath('/articles')
  revalidatePath(`/articles/${id}`)
  redirect('/articles')
}
