import Link from 'next/link'
import { ClipboardList, RotateCcw } from 'lucide-react'
import { Children } from 'react'

// Server Component — ไม่ต้องการ useSearchParams อีกต่อไป
// activeTab มาจาก searchParams ของ page แทน ทำให้ Tab Nav render ทันที
// children[0] = LoanRequestsFetcher, children[1] = ActiveLoansFetcher
export default function LoansTabs({
    activeTab,
    children,
}: {
    activeTab: 'requests' | 'returns'
    children: React.ReactNode
}) {
    const tabs: { key: 'requests' | 'returns'; label: string; Icon: React.ElementType }[] = [
        { key: 'requests', label: 'คำขอยืม', Icon: ClipboardList },
        { key: 'returns', label: 'รับคืนอุปกรณ์', Icon: RotateCcw },
    ]

    // children[0] = requests, children[1] = returns
    const childArray = Children.toArray(children)

    return (
        <div>
            {/* Tab Nav — render ทันที ไม่รอ data */}
            <div className="flex gap-2 mb-6">
                {tabs.map(({ key, label, Icon }) => (
                    <Link
                        key={key}
                        href={`/admin/loans?tab=${key}`}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === key
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </Link>
                ))}
            </div>

            {/* Tab Content — แต่ละ Suspense stream อิสระ */}
            {activeTab === 'requests' ? childArray[0] : childArray[1]}
        </div>
    )
}

