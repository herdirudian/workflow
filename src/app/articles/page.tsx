import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ArticlesPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status || undefined
  
  const articles = await prisma.article.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    include: { source: true }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Article Management</h1>
        <Link href="/articles/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
            <Plus size={20} /> Import Article
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <Link href="/articles" className={`px-4 py-2 rounded ${!status ? 'bg-blue-600 text-white' : 'bg-white border'}`}>All</Link>
        <Link href="/articles?status=PUBLISHED" className={`px-4 py-2 rounded ${status === 'PUBLISHED' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Published</Link>
        <Link href="/articles?status=DRAFT" className={`px-4 py-2 rounded ${status === 'DRAFT' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Drafts</Link>
        <Link href="/articles?status=REJECTED" className={`px-4 py-2 rounded ${status === 'REJECTED' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Rejected</Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Source</th>
              <th className="p-4">Score</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map(article => (
              <tr key={article.id} className="hover:bg-slate-50">
                <td className="p-4">
                    <div className="flex items-center gap-3">
                        {article.imageUrl && (
                          <img src={article.imageUrl} alt="" className="w-12 h-12 object-cover rounded bg-slate-100" />
                        )}
                        <div>
                            <div className="font-medium">{article.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{article.slug}</div>
                        </div>
                    </div>
                </td>
                <td className="p-4 text-slate-500">{article.source.name}</td>
                <td className="p-4">
                    <span className={`font-bold ${article.qualityScore >= 75 ? 'text-green-600' : article.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {article.qualityScore}
                    </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    article.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
                    article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {article.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                    <Link href={`/articles/${article.id}`} className="text-blue-600 hover:underline font-medium">
                        Edit
                    </Link>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No articles found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
