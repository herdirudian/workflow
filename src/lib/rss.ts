import Parser from 'rss-parser'

const parser = new Parser()

export async function fetchRSS(url: string) {
  try {
    const feed = await parser.parseURL(url)
    return feed.items
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error)
    return []
  }
}
