
import { prisma } from '@/lib/prisma'
import { addAccount, deleteAccount, toggleAccount, savePrompt } from './actions'
import { ChangePasswordForm } from './ChangePasswordForm'

export const dynamic = 'force-dynamic'

const DEFAULT_PROMPT = `You are a professional journalist and SEO expert.
Process this news article:
Title: \${originalTitle}
Content: \${originalContent}
Tasks:
1. Summarize in 5 points.
2. Rewrite in neutral journalistic tone (max 600 words).
3. Add insight paragraph.
4. Generate SEO Title, Slug, Meta Desc.
5. Score quality (0-100).
6. Create a short, descriptive English prompt for generating an image relevant to this news (max 15 words).
Return JSON ONLY with this structure:
{ "title": "", "content": "", "slug": "", "metaDesc": "", "qualityScore": 0, "insight": "", "imagePrompt": "" }`

export default async function SettingsPage() {
  const accounts = await prisma.externalAccount.findMany({
    orderBy: { createdAt: 'desc' },
  })
  
  const promptSetting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_prompt_template' }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings & Integrations</h1>
        <a href="/" className="bg-gray-200 px-4 py-2 rounded">Back to Dashboard</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* AI Prompt Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md border md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">AI Prompt Configuration</h2>
            <form action={savePrompt} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">System Prompt Template</label>
                    <p className="text-xs text-gray-500 mb-2">Use <code>{`\${originalTitle}`}</code> and <code>{`\${originalContent}`}</code> as placeholders.</p>
                    <textarea 
                        name="prompt" 
                        defaultValue={promptSetting?.value || DEFAULT_PROMPT} 
                        rows={10} 
                        className="w-full border p-2 rounded font-mono text-sm bg-slate-50"
                        required
                    />
                </div>
                <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700">
                    Save Prompt Configuration
                </button>
            </form>
        </div>

        {/* Add New Account Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Add WordPress Account</h2>
          <form action={addAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <input type="text" name="name" placeholder="My Tech Blog" className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API URL (WP JSON Endpoint)</label>
              <input type="url" name="apiUrl" placeholder="https://mysite.com/wp-json/wp/v2" className="w-full border p-2 rounded" required />
              <p className="text-xs text-gray-500 mt-1">Usually ends with /wp-json/wp/v2</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input type="text" name="username" className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Application Password</label>
              <input type="password" name="password" className="w-full border p-2 rounded" required />
              <p className="text-xs text-gray-500 mt-1">Generate in WP Admin &gt; Users &gt; Profile</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Category (Optional)</label>
              <select name="category" className="w-full border p-2 rounded">
                <option value="">All Categories (General)</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Sports">Sports</option>
                <option value="Health">Health</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Politics">Politics</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Only post articles matching this category</p>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Add Account
            </button>
          </form>
        </div>

        {/* Change Password */}
        <ChangePasswordForm />

        {/* List Accounts */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts connected yet.</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="border p-4 rounded flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{account.name}</h3>
                    <p className="text-sm text-gray-600 truncate max-w-xs">{account.apiUrl}</p>
                    {account.category && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mt-1">
                            Target: {account.category}
                        </span>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <form action={async () => {
                            'use server'
                            await toggleAccount(account.id, !account.isActive)
                        }}>
                             <button className="text-xs text-blue-600 underline">
                                {account.isActive ? 'Disable' : 'Enable'}
                             </button>
                        </form>
                    </div>
                  </div>
                  <form action={async () => {
                    'use server'
                    await deleteAccount(account.id)
                  }}>
                    <button className="text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
