'use client'

import dynamic from 'next/dynamic'

// P4: Lazy load non-critical client components
// next/dynamic with ssr:false must be in a Client Component (Next.js 16+)
const DebugConsole = dynamic(() => import('@/components/debug/DebugConsole'), { ssr: false })

export { DebugConsole }
