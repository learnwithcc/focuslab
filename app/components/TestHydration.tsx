import { useState, useEffect } from 'react'

export function TestHydration() {
  const [mounted, setMounted] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('🧪 TestHydration: useEffect is running - React hydration working!')
    setMounted(true)
  }, [])

  if (!mounted) {
    console.log('🧪 TestHydration: not mounted, showing loading state')
    return <div className="p-2 bg-red-200">Loading...</div>
  }

  console.log('🧪 TestHydration: fully mounted and interactive')
  
  return (
    <div className="p-4 bg-green-200 rounded">
      <h3>React Hydration Test</h3>
      <p>Count: {count}</p>
      <button 
        onClick={() => {
          console.log('🧪 TestHydration: button clicked!')
          setCount(c => c + 1)
        }}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        Click me! (+1)
      </button>
    </div>
  )
} 