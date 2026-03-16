import { useState } from 'react'
import ContainersPage from './pages/ContainersPage'
import ImagesPage from './pages/ImagesPage'

type Page = 'containers' | 'images' | 'volumes' | 'networks'

function App() {
  const [page, setPage] = useState<Page>(() =>
    (localStorage.getItem('activePage') as Page) || 'containers'
  )

  function navigate(p: Page) {
    localStorage.setItem('activePage', p)
    setPage(p)
  }

  const pages: Page[] = ['containers', 'images', 'volumes', 'networks']

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex">
      <aside className="w-52 bg-slate-950 flex flex-col shrink-0">
        <div className="p-4 text-xl font-bold">Docker Manager</div>
        <nav className="flex flex-col gap-1 px-2">
          {pages.map(p => (
            <button
              key={p}
              className={`text-left text-sm px-3 py-2 rounded-md border-none cursor-pointer ${
                p === page ? 'bg-slate-700 text-white font-bold' : 'bg-transparent text-slate-400 hover:bg-slate-800'
              }`}
              onClick={() => navigate(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-5 overflow-auto">
        {page === 'containers' && <ContainersPage />}
        {page === 'images' && <ImagesPage />}
      </main>
    </div>
  )
}

export default App
