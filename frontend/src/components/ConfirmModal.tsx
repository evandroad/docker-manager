import { useState, useCallback, createContext, useContext, useEffect } from 'react'

type ConfirmOptions = { message: string; onConfirm: () => void }
type AlertOptions = { message: string; type?: 'error' | 'success' }

const ConfirmContext = createContext<(opts: ConfirmOptions) => void>(() => {})
const AlertContext = createContext<(msg: string, type?: 'error' | 'success') => void>(() => {})

export const useConfirm = () => useContext(ConfirmContext)
export const useAlert = () => useContext(AlertContext)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const [alertOpts, setAlertOpts] = useState<AlertOptions | null>(null)

  const confirm = useCallback((o: ConfirmOptions) => setOpts(o), [])
  const alert = useCallback((msg: string, type: 'error' | 'success' = 'error') => setAlertOpts({ message: msg, type }), [])

  useEffect(() => {
    if (!alertOpts) return
    const t = setTimeout(() => setAlertOpts(null), 5000)
    return () => clearTimeout(t)
  }, [alertOpts])

  const isSuccess = alertOpts?.type === 'success'

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
        {alertOpts && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white text-sm px-4 py-3 rounded-lg shadow-lg max-w-md border ${isSuccess ? 'bg-green-900/90 border-green-700' : 'bg-red-900/90 border-red-700'}`}>
            {alertOpts.message}
          </div>
        )}
      </AlertContext.Provider>
    </ConfirmContext.Provider>
  )
}
