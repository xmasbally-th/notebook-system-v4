'use client'

import { useState, useEffect } from 'react'
import { Star, X, Loader2, Send, AlertTriangle, Monitor, Handshake, Laptop } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface EvaluationModalProps {
    isOpen: boolean
    onClose: () => void
    loan: any
    onSuccess: () => void
    mandatory?: boolean
}

interface RatingQuestion {
    key: string
    label: string
    description?: string
}

interface RatingSection {
    title: string
    category: 'system' | 'service' | 'equipment'
    icon: React.ReactNode
    questions: RatingQuestion[]
}

const SECTIONS: RatingSection[] = [
    {
        title: 'ด้านประสิทธิภาพของระบบ (System)',
        category: 'system',
        icon: <Monitor className="w-5 h-5 text-blue-600" />,
        questions: [
            { key: 'usability', label: '1. ด้านการออกแบบและการใช้งาน (Usability)', description: 'ความสะดวกและง่ายต่อการใช้งานระบบโดยรวม' },
            { key: 'information', label: '2. ด้านข้อมูล (Information)', description: 'ความครบถ้วนและถูกต้องของข้อมูลอุปกรณ์' },
            { key: 'performance', label: '3. ด้านเสถียรภาพ (Performance)', description: 'ความเสถียรและความรวดเร็วในการเข้าถึงระบบ' }
        ]
    },
    {
        title: 'กระบวนการให้บริการ (Process & Service)',
        category: 'service',
        icon: <Handshake className="w-5 h-5 text-amber-500" />,
        questions: [
            { key: 'speed', label: '1. ด้านความรวดเร็ว (Speed)', description: 'ความรวดเร็วและคล่องตัวในขั้นตอนการรับ-คืนอุปกรณ์' },
            { key: 'rules', label: '2. ด้านกฎระเบียบ (Rules)', description: 'ความชัดเจนของขั้นตอน กฎกติกา และเงื่อนไขการยืม-คืน' },
            { key: 'staff', label: '3. ด้านเจ้าหน้าที่ (Staff)', description: 'ความสุภาพ ความเต็มใจ และความเชี่ยวชาญในการให้บริการของเจ้าหน้าที่' },
            { key: 'communication', label: '4. ด้านการติดต่อสื่อสาร (Communication)', description: 'ประสิทธิภาพของการแจ้งเตือนและการติดต่อสื่อสารกับเจ้าหน้าที่' }
        ]
    },
    {
        title: 'คุณภาพอุปกรณ์ (Equipment)',
        category: 'equipment',
        icon: <Laptop className="w-5 h-5 text-emerald-500" />,
        questions: [
            { key: 'physical', label: '1. ด้านกายภาพ (Physical)', description: 'ความสะอาดและความสมบูรณ์แข็งแรงของอุปกรณ์ภายนอก' },
            { key: 'performance', label: '2. ด้านประสิทธิภาพการทำงาน (Performance)', description: 'ประสิทธิภาพการประมวลผลและความพร้อมใช้งานของระบบ' },
            { key: 'quantity', label: '3. ด้านปริมาณและความหลากหลาย (Quantity)', description: 'ความเพียงพอและความหลากหลายของอุปกรณ์ที่ให้บริการ' }
        ]
    }
]

export default function EvaluationModal({ isOpen, onClose, loan, onSuccess, mandatory = false }: EvaluationModalProps) {
    const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({
        system: { usability: 0, information: 0, performance: 0 },
        service: { speed: 0, rules: 0, staff: 0, communication: 0 },
        equipment: { physical: 0, performance: 0, quantity: 0 }
    })
    const [suggestions, setSuggestions] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Star Hover State tracker
    const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({})

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setRatings({
                system: { usability: 0, information: 0, performance: 0 },
                service: { speed: 0, rules: 0, staff: 0, communication: 0 },
                equipment: { physical: 0, performance: 0, quantity: 0 }
            })
            setSuggestions('')
            setError(null)
            setHoveredStars({})
        }
    }, [isOpen])

    if (!isOpen || !loan) return null

    const handleRate = (category: string, key: string, value: number) => {
        setRatings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }))
    }

    const calculateAverage = () => {
        let totalScore = 0
        let totalCount = 0

        Object.values(ratings).forEach(category => {
            Object.values(category).forEach(score => {
                if (score > 0) {
                    totalScore += score
                    totalCount++
                }
            })
        })

        return totalCount === 0 ? 0 : Math.round(totalScore / totalCount)
    }

    const isFormValid = () => {
        return Object.values(ratings).every(category =>
            Object.values(category).every(score => score > 0)
        )
    }

    const handleSubmit = async () => {
        if (!isFormValid()) {
            setError('กรุณาประเมินให้ครบทุกข้อ')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Not authenticated')

            const { error: submitError } = await supabase
                .from('evaluations')
                .insert({
                    loan_id: loan.id,
                    user_id: session.user.id,
                    rating: calculateAverage(),
                    details: ratings,
                    suggestions: suggestions.trim() || null
                })

            if (submitError) throw submitError

            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Error submitting evaluation:', err)
            setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={mandatory ? undefined : onClose}
        >
            <div className="bg-white rounded-none sm:rounded-2xl shadow-xl w-full max-w-2xl my-0 sm:my-8 h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] flex flex-col transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-150 sticky top-0 bg-white sm:rounded-t-2xl z-25 shadow-sm sm:shadow-none">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            แบบประเมินความพึงพอใจ
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            อุปกรณ์: <span className="font-semibold text-gray-800">{loan.equipment?.name}</span> (#{loan.equipment?.equipment_number})
                        </p>
                    </div>
                    {!mandatory && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5 text-gray-550" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto bg-gray-50/20">
                    {/* Sections */}
                    {SECTIONS.map((section) => (
                        <div key={section.category} className="space-y-4">
                            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 border-l-4 border-blue-600 pl-3 flex items-center gap-2 uppercase tracking-wide">
                                {section.icon}
                                {section.title}
                            </h3>
                            <div className="space-y-3.5 pl-0 sm:pl-3">
                                {section.questions.map((q) => {
                                    const currentRating = ratings[section.category][q.key]
                                    const hoverRating = hoveredStars[q.key] || 0
                                    
                                    return (
                                        <div key={q.key} className="bg-white rounded-xl border border-gray-150 p-4 sm:p-5 shadow-sm hover:border-blue-300 transition-all duration-200">
                                            <div className="mb-3">
                                                <p className="font-semibold text-gray-800 text-xs sm:text-sm">{q.label}</p>
                                                {q.description && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{q.description}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div 
                                                    className="flex gap-1.5"
                                                    onMouseLeave={() => setHoveredStars(prev => ({ ...prev, [q.key]: 0 }))}
                                                >
                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                        const isLit = hoverRating > 0 ? star <= hoverRating : star <= currentRating
                                                        
                                                        return (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => handleRate(section.category, q.key, star)}
                                                                onMouseEnter={() => setHoveredStars(prev => ({ ...prev, [q.key]: star }))}
                                                                className="focus:outline-none transform hover:scale-115 active:scale-95 transition-all duration-100"
                                                            >
                                                                <Star
                                                                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-all duration-150 ${
                                                                        isLit
                                                                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_3px_rgba(245,158,11,0.35)]'
                                                                            : 'text-gray-200 hover:text-amber-300'
                                                                    }`}
                                                                />
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded-lg">
                                                    {currentRating > 0 ? `${currentRating} คะแนน` : 'ยังไม่ระบุ'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Suggestions Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm sm:text-base font-extrabold text-gray-900 border-l-4 border-blue-600 pl-3 flex items-center gap-2 uppercase tracking-wide">
                            <Send className="w-4.5 h-4.5 text-blue-500" />
                            ข้อเสนอแนะเพิ่มเติมเพื่อปรับปรุงระบบ
                        </h3>
                        <div className="pl-0 sm:pl-3 relative">
                            <textarea
                                value={suggestions}
                                onChange={(e) => {
                                    if (e.target.value.length <= 500) {
                                        setSuggestions(e.target.value)
                                    }
                                }}
                                placeholder="เขียนแนะนำเพิ่มเติมเพื่อเป็นกำลังใจและให้เราปรับปรุงบริการดูแลคุณได้ดีขึ้นในคราวหน้า... 🙏"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px] text-xs sm:text-sm transition-shadow hover:shadow-sm"
                            />
                            <span className="absolute bottom-3 right-3 text-[10px] font-extrabold text-gray-400 bg-white/90 px-2 py-0.5 rounded-lg border border-gray-100">
                                {suggestions.length}/500 ตัวอักษร
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-semibold">
                            <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-150 bg-gray-50 sm:rounded-b-2xl flex justify-end gap-3 sticky bottom-0 z-20">
                    {!mandatory && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-bold"
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm shadow-sm hover:shadow"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                ส่งแบบประเมิน
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
