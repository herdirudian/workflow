import { prisma } from '@/lib/prisma'
import { addSource, deleteSource, toggleSource } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Source Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-bold mb-4">Add New Source</h2>
        <form action={addSource} className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" type="text" className="border rounded px-3 py-2 w-64" placeholder="e.g. CNN Tech" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">RSS URL</label>
            <input name="rssUrl" type="url" className="border rounded px-3 py-2 w-96" placeholder="https://..." required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input name="category" type="text" className="border rounded px-3 py-2 w-48" placeholder="Technology" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Source</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">URL</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map(source => (
              <tr key={source.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium">{source.name}</td>
                <td className="p-4 text-slate-500 truncate max-w-xs">{source.rssUrl}</td>
                <td className="p-4">{source.category || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${source.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {source.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <form action={toggleSource.bind(null, source.id, source.isActive)}>
                    <button className="text-blue-600 hover:underline">Toggle</button>
                  </form>
                  <span className="text-slate-300">|</span>
                  <form action={deleteSource.bind(null, source.id)}>
                     <button className="text-red-600 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No sources found. Add one above.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
