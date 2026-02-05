
import * as cheerio from 'cheerio'

export interface ScrapedArticle {
  title: string
  content: string
  image?: string
}

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, .ad, .advertisement, .social-share, .comments, .related-posts, .promo, .subscription, [class*="ad-"], [id*="ad-"], iframe, .cookie-banner').remove()

  // Clean specific text patterns often found in scrapes
  $('p').each((_, el) => {
    const text = $(el).text().trim().toUpperCase();
    if (text === 'ADVERTISEMENT' || text.includes('SCROLL TO CONTINUE') || text.includes('READ ALSO')) {
        $(el).remove();
    }
  });

  // Extract Title
  const title = $('meta[property="og:title"]').attr('content') || 
                $('h1').first().text().trim() || 
                $('title').text().trim()

  // Extract Image
  const image = $('meta[property="og:image"]').attr('content')

  // Extract Content
  // Try common content selectors
  let content = ''
  const selectors = [
    'article',
    '[role="main"]',
    '.post-content',
    '.article-body',
    '.entry-content',
    'main'
  ]

  for (const selector of selectors) {
    if ($(selector).length > 0) {
      // Get text but preserve paragraph structure
      content = $(selector).find('p').map((_, el) => $(el).text().trim()).get().join('\n\n')
      if (content.length > 200) break // Found substantial content
    }
  }

  // Fallback: If no specific selector found enough content, try to find the container with the most <p> tags
  if (content.length < 200) {
    let maxPCount = 0
    let bestContainer = $('body')

    $('div, section').each((_, el) => {
        const pCount = $(el).find('p').length
        // Ensure it's not a container of containers that we already checked (simple heuristic: depth)
        if (pCount > maxPCount) {
            maxPCount = pCount
            bestContainer = $(el)
        }
    })

    if (maxPCount > 0) {
         content = bestContainer.find('p').map((_, el) => $(el).text().trim()).get().join('\n\n')
    }
  }
  
  // Final fallback: body text (messy but better than nothing)
  if (!content) {
      content = $('body').text().replace(/\s+/g, ' ').trim()
  }

  return {
    title: title || 'Untitled',
    content: content || 'No content found',
    image
  }
}
