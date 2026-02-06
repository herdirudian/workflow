import { prisma } from './prisma'
import { fetchRSS } from './rss'
import { processArticleWithAI } from './ai'
import { logSystem } from './logger'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const RATE_DELAY_MS = parseInt(process.env.AI_RATE_DELAY_MS || '10000', 10)

export async function runPipeline() {
  await logSystem('INFO', 'Pipeline started')
  const sources = await prisma.source.findMany({ where: { isActive: true } })
  const results = []
  
  if (sources.length === 0) {
      await logSystem('WARN', 'No active sources found')
      return []
  }

  for (const source of sources) {
    if (source.rssUrl.startsWith('manual://')) continue;

    // console.log(`Fetching source: ${source.name}`)
    
    const items = await fetchRSS(source.rssUrl)
    // console.log(`Found ${items.length} items from ${source.name}`)
    
    let processedCount = 0;
    
    for (const item of items) {
      if (processedCount >= source.hourlyLimit) {
          // console.log(`Hourly limit reached for ${source.name}`)
          break;
      }
      
      if (!item.link) continue

      // Check duplicate by sourceUrl
      const exists = await prisma.article.findUnique({ where: { sourceUrl: item.link } })
      if (exists) {
          // console.log(`Skipping duplicate: ${item.link}`)
          continue
      }

      console.log(`Processing new item: ${item.title}`)
      
      try {
          // Process
          const contentToProcess = item.content || item.contentSnippet || item.summary || ""
          // Rate limit AI calls to avoid 429
          if (RATE_DELAY_MS > 0) {
            await sleep(RATE_DELAY_MS)
          }
          const processed = await processArticleWithAI(contentToProcess, item.title || "Untitled")

          // Skip saving if AI failed (qualityScore <= 0)
          if (!processed || processed.qualityScore <= 0) {
            await logSystem('WARN', `AI failed or returned low score for: ${item.title}`)
            continue
          }

          // Save
          const status = processed.qualityScore >= 75 ? 'PUBLISHED' : (processed.qualityScore >= 60 ? 'DRAFT' : 'REJECTED')
          
          // Ensure unique slug
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
              imageUrl: processed.imageUrl,
              imagePrompt: processed.imagePrompt,
              sourceId: source.id,
              sourceUrl: item.link,
              category: processed.category || source.category || "General",
              qualityScore: processed.qualityScore,
              status: status,
              publishedAt: status === 'PUBLISHED' ? new Date() : null,
              }
          })
          
          // Create log
          await prisma.processingLog.create({
              data: {
                  articleId: article.id,
                  step: 'FULL_PIPELINE',
                  status: 'SUCCESS',
                  metadata: JSON.stringify({ ai_score: processed.qualityScore })
              }
          })
          
          results.push(article)
          processedCount++;
      } catch (e: any) {
          console.error(`Failed to save article ${item.title}`, e)
          await logSystem('ERROR', `Failed to process/save article: ${item.title}`, { error: e.message })
      }
    }
    
    if (processedCount > 0) {
        await logSystem('INFO', `Processed ${processedCount} articles from ${source.name}`)
    }
  }
  
  await logSystem('INFO', `Pipeline finished. Total new articles: ${results.length}`)
  return results
}
