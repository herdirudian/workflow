import Link from 'next/link'
import { Home, Rss, FileText, Settings, Activity, LogOut } from 'lucide-react'
import { logout } from '@/app/login/action'

export function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 h-full">
      <div className="text-2xl font-bold mb-8 text-center border-b border-slate-700 pb-4">AutoNews</div>
      <nav className="space-y-2">
        <Link href="/" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-colors">
          <Home size={20} /> Dashboard
        </Link>
        <Link href="/sources" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-colors">
          <Rss size={20} /> Sources
        </Link>
        <Link href="/articles" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-colors">
          <FileText size={20} /> Articles
        </Link>
        <Link href="/logs" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-colors">
          <Activity size={20} /> System Logs
        </Link>
        <Link href="/settings" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded transition-colors">
          <Settings size={20} /> Settings
        </Link>
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-700">
        <form action={logout}>
            <button type="submit" className="flex items-center gap-3 p-3 hover:bg-red-900/50 rounded transition-colors w-full text-left text-red-200 hover:text-red-100">
                <LogOut size={20} /> Logout
            </button>
        </form>
        <div className="text-xs text-slate-500 text-center mt-2">
            v1.0.0
        </div>
      </div>
    </div>
  )
}
