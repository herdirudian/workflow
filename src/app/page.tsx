import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Activity, FileText, ArrowRight } from 'lucide-react'

function StatCard({ title, value, sub }: { title: string, value: string | number, sub?: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const totalArticles = await prisma.article.count()
  const published = await prisma.article.count({ where: { status: 'PUBLISHED' } })
  const rejected = await prisma.article.count({ where: { status: 'REJECTED' } })
  
  // Avg quality score
  const aggregate = await prisma.article.aggregate({
    _avg: { qualityScore: true }
  })
  const avgScore = Math.round(aggregate._avg.qualityScore || 0)

  // Fetch Recent Logs
  const recentLogs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
  })

  // Fetch Recent Articles
  const recentArticles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true, qualityScore: true }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Articles" value={totalArticles} />
        <StatCard title="Published" value={published} sub="Ready for readers" />
        <StatCard title="Avg Quality Score" value={avgScore} sub="Target: >75" />
        <StatCard title="Rejected" value={rejected} sub="Low quality / Duplicates" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Recent Articles Column */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <FileText size={20} className="text-blue-600"/> Recent Articles
                    </h2>
                    <Link href="/articles" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>
                
                {recentArticles.length === 0 ? (
                    <p className="text-gray-500 text-sm">No articles processed yet.</p>
                ) : (
                    <div className="space-y-4">
                        {recentArticles.map(article => (
                            <div key={article.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                <div>
                                    <Link href={`/articles/${article.id}`} className="font-medium hover:text-blue-600 line-clamp-1">
                                        {article.title}
                                    </Link>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(article.createdAt).toLocaleDateString()} • Score: {article.qualityScore}
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold
                                    ${article.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                                      article.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}>
                                    {article.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4 items-center">
                    <p className="text-sm text-slate-500">Run the processing pipeline manually:</p>
                    <a href="/api/cron" target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition inline-block text-sm">
                        Trigger Cron Job
                    </a>
                </div>
            </div>
         </div>

         {/* Recent Logs Column */}
         <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Activity size={20} className="text-purple-600"/> System Logs
                </h2>
                <Link href="/logs" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    View All <ArrowRight size={14} />
                </Link>
            </div>
            
            {recentLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs recorded yet.</p>
            ) : (
                <div className="space-y-3">
                    {recentLogs.map(log => (
                        <div key={log.id} className="text-sm border-l-2 pl-3 py-1" 
                            style={{borderColor: log.level === 'ERROR' ? '#ef4444' : log.level === 'WARN' ? '#eab308' : '#3b82f6'}}>
                            <div className="flex justify-between items-start">
                                <span className={`font-bold text-xs ${
                                    log.level === 'ERROR' ? 'text-red-600' : 
                                    log.level === 'WARN' ? 'text-yellow-600' : 
                                    'text-blue-600'
                                }`}>{log.level}</span>
                                <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-gray-700 mt-1 line-clamp-2" title={log.message}>{log.message}</p>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>
    </div>
  )
}
