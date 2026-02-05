
'use client'

import { useActionState } from 'react'
import { importArticle } from './actions'
import { LinkIcon, ArrowRight } from 'lucide-react'

// Wrapper function to handle the Promise return type of importArticle for useActionState
// and to swallow the redirect error if it happens (Next.js redirection throws an error)
async function importAction(prevState: any, formData: FormData) {
    try {
        await importArticle(formData)
        return { success: true }
    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT') throw e;
        return { error: e.message }
    }
}

export default function ImportPage() {
  const [state, action, isPending] = useActionState(importAction, null)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <LinkIcon /> Import Article
      </h1>

      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200">
        <p className="text-gray-600 mb-6">
          Paste a URL to a news article below. The system will scrape the content, rewrite it using AI, and save it to your library.
        </p>

        <form action={action} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Article URL</label>
            <input 
              name="url" 
              type="url" 
              placeholder="https://example.com/news/article-slug"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
              required
            />
          </div>

          {state?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
              Error: {state.error}
            </div>
          )}

          <div className="flex justify-end gap-4">
             <a href="/articles" className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                 Cancel
             </a>
             <button 
                type="submit" 
                disabled={isPending}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors shadow-sm"
             >
                {isPending ? (
                    <>Processing <span className="animate-pulse">...</span></>
                ) : (
                    <>Import & Process <ArrowRight size={18} /></>
                )}
             </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">How it works</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>We fetch the HTML from the provided URL.</li>
            <li>We extract the main content (ignoring ads, navigation, etc.).</li>
            <li>The content is sent to Gemini AI for rewriting and SEO optimization.</li>
            <li>The result is saved as a new article with source "Manual Import".</li>
        </ul>
      </div>
    </div>
  )
}
