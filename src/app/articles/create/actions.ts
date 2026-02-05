
'use server'

import { scrapeArticle } from '@/lib/scraper'
import { processArticleWithAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function importArticle(formData: FormData) {
  const url = formData.get('url') as string
  if (!url) return

  try {
    // 1. Scrape
    console.log(`Scraping ${url}...`)
    const scraped = await scrapeArticle(url)
    
    // 2. Process with AI
    console.log(`Processing with AI...`)
    const processed = await processArticleWithAI(scraped.content, scraped.title)

    // 3. Find or Create "Manual Import" Source
    let source = await prisma.source.findFirst({ where: { name: 'Manual Import' } })
    if (!source) {
        source = await prisma.source.create({
            data: {
                name: 'Manual Import',
                rssUrl: 'manual://import',
                category: 'General',
                isActive: true
            }
        })
    }

    // 4. Save
    const status = processed.qualityScore >= 75 ? 'PUBLISHED' : (processed.qualityScore >= 60 ? 'DRAFT' : 'REJECTED')
    
    let slug = processed.slug
    const slugExists = await prisma.article.findUnique({ where: { slug } })
    if (slugExists) {
        slug = `${slug}-${Date.now()}`
    }

    const article = await prisma.article.create({
        data: {
            title: processed.title,
            slug: slug,
            content: processed.content,
            metaDesc: processed.metaDesc,
            imageUrl: processed.imageUrl || scraped.image, // Fallback to scraped image if AI didn't gen one (though AI gen is separate now)
            sourceId: source.id,
            sourceUrl: url,
            category: processed.category || "General",
            qualityScore: processed.qualityScore,
            status: status,
            publishedAt: status === 'PUBLISHED' ? new Date() : null,
        }
    })

    // 5. Log
    await prisma.processingLog.create({
        data: {
            articleId: article.id,
            step: 'MANUAL_IMPORT',
            status: 'SUCCESS',
            metadata: JSON.stringify({ ai_score: processed.qualityScore, original_url: url })
        }
    })

  } catch (error: any) {
    console.error('Import failed:', error)
    // In a real app we'd return the error to the UI, 
    // but for now we'll rely on server logs or a simple redirect
    throw new Error(error.message)
  }

  revalidatePath('/articles')
  redirect('/articles')
}
