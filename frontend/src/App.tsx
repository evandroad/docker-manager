import { useState } from 'react'
import ContainersPage from './pages/ContainersPage'

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
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-950 p-4 text-xl">Docker Manager</header>

      <nav className="bg-slate-800 px-4 py-2 flex gap-4">
        {pages.map(p => (
          <button
            key={p}
            className={`bg-transparent border-none text-sm cursor-pointer px-0 py-1 ${
              p === page ? 'text-white font-bold underline' : 'text-slate-400 hover:underline'
            }`}
            onClick={() => navigate(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </nav>

      <div className="p-5">
        {page === 'containers' && <ContainersPage />}
      </div>
    </div>
  )
}

export default App
