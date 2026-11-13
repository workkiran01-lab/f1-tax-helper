import { useEffect, useState } from 'react'

// Re-render when saved progress changes in this tab or another one.
export default function useStoredRefresh() {
  const [, refresh] = useState(0)
  useEffect(() => {
    const update = () => refresh((v) => v + 1)
    window.addEventListener('storage', update)
    window.addEventListener('f1-storage-change', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('f1-storage-change', update)
    }
  }, [])
}
