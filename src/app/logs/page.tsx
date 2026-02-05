
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { level: levelParam } = await searchParams
  const level = typeof levelParam === 'string' ? levelParam : undefined
  
  const where = level ? { level } : {}

  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <div className="flex gap-2">
            <Link 
                href="/logs" 
                className={`px-3 py-1 rounded text-sm ${!level ? 'bg-slate-800 text-white' : 'bg-gray-200'}`}
            >
                All
            </Link>
            <Link 
                href="/logs?level=INFO" 
                className={`px-3 py-1 rounded text-sm ${level === 'INFO' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
                Info
            </Link>
            <Link 
                href="/logs?level=WARN" 
                className={`px-3 py-1 rounded text-sm ${level === 'WARN' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
            >
                Warn
            </Link>
            <Link 
                href="/logs?level=ERROR" 
                className={`px-3 py-1 rounded text-sm ${level === 'ERROR' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
                Error
            </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No logs found.</td>
                </tr>
            ) : (
                logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${log.level === 'INFO' ? 'bg-blue-100 text-blue-800' : 
                          log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {log.level}
                    </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.metadata ? (
                            <code className="bg-gray-100 px-1 rounded text-xs" title={log.metadata}>
                                {log.metadata.substring(0, 50)}{log.metadata.length > 50 ? '...' : ''}
                            </code>
                        ) : '-'}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
