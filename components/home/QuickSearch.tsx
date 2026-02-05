'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function QuickSearch() {
    return (
        <form action="/equipment" method="GET" className="w-full max-w-md mx-auto mb-8 relative group">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-blue-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    name="search"
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-blue-400/30 rounded-full text-white placeholder-blue-200 focus:outline-none focus:bg-white focus:text-gray-900 focus:ring-2 focus:ring-white transition-all shadow-lg backdrop-blur-sm"
                    placeholder="ค้นหาอุปกรณ์ เช่น MacBook, iPad..."
                />
                <button type="submit" className="absolute inset-y-1 right-1 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-colors">
                    ค้นหา
                </button>
            </div>
        </form>
    )
}
