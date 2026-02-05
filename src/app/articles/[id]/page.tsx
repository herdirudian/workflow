
import { prisma } from '@/lib/prisma'
import { updateArticle } from '../actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ArticleEditPage({ params }: Props) {
  const { id } = await params
  const article = await prisma.article.findUnique({
    where: { id }
  })

  if (!article) {
    return <div>Article not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Article</h1>
        <a href="/articles" className="text-sm text-slate-500 hover:underline">Back to List</a>
      </div>

      <form action={updateArticle.bind(null, article.id)} className="bg-white p-6 rounded-lg shadow border space-y-6">
        
        {/* Title */}
        <div>
          <label className="block text-sm font-bold mb-2">Title</label>
          <input 
            name="title" 
            defaultValue={article.title} 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-bold mb-2">Slug (URL)</label>
          <input 
            name="slug" 
            defaultValue={article.slug} 
            className="w-full border p-2 rounded bg-slate-50 font-mono text-sm"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-bold mb-2">Status</label>
          <select name="status" defaultValue={article.status} className="border p-2 rounded w-full md:w-1/3">
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-bold mb-2">Content (HTML)</label>
          <textarea 
            name="content" 
            defaultValue={article.content} 
            rows={15}
            className="w-full border p-2 rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Supports HTML tags like &lt;p&gt;, &lt;strong&gt;, etc.</p>
        </div>

        {/* Meta Desc */}
        <div>
          <label className="block text-sm font-bold mb-2">Meta Description (SEO)</label>
          <textarea 
            name="metaDesc" 
            defaultValue={article.metaDesc} 
            rows={3}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Read-Only Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 bg-gray-50 p-4 rounded">
            <div>
                <span className="font-semibold">Source:</span> {article.sourceUrl}
            </div>
            <div>
                <span className="font-semibold">Quality Score:</span> {article.qualityScore}
            </div>
            <div>
                <span className="font-semibold">Created:</span> {article.createdAt.toLocaleString()}
            </div>
        </div>

        {/* Image Section */}
        <div className="border p-4 rounded bg-gray-50">
            <h3 className="font-bold text-sm mb-3 text-gray-700">Image Details</h3>
            
            {article.imageUrl ? (
                <div className="space-y-3">
                    <img 
                        src={article.imageUrl} 
                        alt="Article Image" 
                        className="max-w-sm rounded border shadow-sm" 
                    />
                    <div className="text-xs text-gray-500 break-all">
                        <span className="font-semibold">URL:</span> {article.imageUrl}
                    </div>
                    {(article as any).imagePrompt && (
                        <div className="text-sm text-gray-600 italic border-l-2 border-blue-300 pl-3 py-1 bg-blue-50">
                            "{(article as any).imagePrompt}"
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No image generated.</p>
            )}
        </div>

        <div className="pt-4 border-t flex justify-end gap-4">
           <a href="/articles" className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</a>
           <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
             Save Changes
           </button>
        </div>

      </form>
    </div>
  )
}
