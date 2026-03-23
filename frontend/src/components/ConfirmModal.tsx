import { useState, useCallback, createContext, useContext, useEffect } from 'react'

type ConfirmOptions = { message: string; onConfirm: () => void }

const ConfirmContext = createContext<(opts: ConfirmOptions) => void>(() => {})
const AlertContext = createContext<(msg: string) => void>(() => {})

export const useConfirm = () => useContext(ConfirmContext)
export const useAlert = () => useContext(AlertContext)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const [alertMsg, setAlertMsg] = useState('')

  const confirm = useCallback((o: ConfirmOptions) => setOpts(o), [])
  const alert = useCallback((msg: string) => setAlertMsg(msg), [])

  useEffect(() => {
    if (!alertMsg) return
    const t = setTimeout(() => setAlertMsg(''), 5000)
    return () => clearTimeout(t)
  }, [alertMsg])

  return (
    <ConfirmContext.Provider value={confirm}>
      <AlertContext.Provider value={alert}>
        {children}
        {opts && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-lg w-[400px] border border-zinc-700">
              <div className="p-4 text-sm text-zinc-200">{opts.message}</div>
              <div className="flex justify-end gap-2 p-3 border-t border-zinc-700">
                <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={() => setOpts(null)}>Cancel</button>
                <button className="px-3 py-1.5 text-sm bg-red-800 border-none rounded-md text-white cursor-pointer hover:bg-red-700" onClick={() => { setOpts(null); opts.onConfirm() }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
        {alertMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white text-sm px-4 py-3 rounded-lg border border-red-700 shadow-lg max-w-md">
            {alertMsg}
          </div>
        )}
      </AlertContext.Provider>
    </ConfirmContext.Provider>
  )
}
