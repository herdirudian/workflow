import Parser from 'rss-parser'

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
})

export async function fetchRSS(url: string) {
  try {
    const feed = await parser.parseURL(url)
    return feed.items
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error)
    return []
  }
}
