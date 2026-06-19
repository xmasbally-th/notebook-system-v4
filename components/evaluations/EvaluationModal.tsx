'use client'

import { useState, useEffect } from 'react'
import { Star, X, Loader2, Send, AlertTriangle, Monitor, Handshake, Laptop } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import confetti from 'canvas-confetti'

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
    icon: React.ReactNode
}

const QUESTIONS: RatingQuestion[] = [
    { 
        key: 'system_overall', 
        label: 'ระบบยืม-คืนออนไลน์', 
        description: 'ความง่าย ความเสถียร และความครบถ้วนของข้อมูลในระบบ',
        icon: <Monitor className="w-5 h-5 text-blue-600" />
    },
    { 
        key: 'service_speed', 
        label: 'ความรวดเร็วในการรับ-คืน', 
        description: 'ขั้นตอนการยืมและคืนอุปกรณ์รวดเร็วและคล่องตัว',
        icon: <Handshake className="w-5 h-5 text-amber-500" />
    },
    { 
        key: 'service_staff', 
        label: 'การให้บริการของเจ้าหน้าที่', 
        description: 'ความสุภาพ ความเต็มใจ และการติดต่อสื่อสาร',
        icon: <Handshake className="w-5 h-5 text-amber-500" />
    },
    { 
        key: 'equipment_quality', 
        label: 'สภาพและคุณภาพอุปกรณ์', 
        description: 'ความสะอาด สมบูรณ์ และพร้อมใช้งานของอุปกรณ์ที่ได้รับ',
        icon: <Laptop className="w-5 h-5 text-emerald-500" />
    },
    { 
        key: 'overall_satisfaction', 
        label: 'ความพึงพอใจโดยรวม', 
        description: 'ความพึงพอใจต่อบริการยืม-คืนอุปกรณ์ทั้งหมด',
        icon: <Star className="w-5 h-5 text-yellow-500" />
    }
]

export default function EvaluationModal({ isOpen, onClose, loan, onSuccess, mandatory = false }: EvaluationModalProps) {
    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [suggestions, setSuggestions] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCelebration, setShowCelebration] = useState(false)
    
    // Star Hover State tracker
    const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({})

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setRatings({})
            setSuggestions('')
            setError(null)
            setHoveredStars({})
            setShowCelebration(false)
        }
    }, [isOpen])

    if (!isOpen || !loan) return null

    const handleRate = (key: string, value: number) => {
        setRatings(prev => ({ ...prev, [key]: value }))
    }

    const calculateAverage = () => {
        let totalScore = 0
        let totalCount = 0

        Object.values(ratings).forEach(score => {
            if (score > 0) {
                totalScore += score
                totalCount++
            }
        })

        return totalCount === 0 ? 0 : Math.round(totalScore / totalCount)
    }

    const isFormValid = () => {
        return QUESTIONS.every(q => ratings[q.key] > 0)
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

            // Show Celebration
            setShowCelebration(true)
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
            
            setTimeout(() => {
                setShowCelebration(false)
                onSuccess()
                onClose()
            }, 2500)
            
        } catch (err: any) {
            console.error('Error submitting evaluation:', err)
            setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
            setIsSubmitting(false)
        }
    }

    if (showCelebration) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center animate-in zoom-in duration-300">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">ขอบคุณที่ช่วยประเมิน!</h2>
                    <div className="flex justify-center items-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star} 
                                className={`w-8 h-8 ${star <= calculateAverage() ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                            />
                        ))}
                    </div>
                    <p className="text-gray-500 mb-6">ข้อเสนอแนะของคุณจะช่วยให้เราปรับปรุงบริการให้ดีขึ้น 💪</p>
                </div>
            </div>
        )
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
                <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto bg-gray-50/20">
                    {/* Questions */}
                    <div className="space-y-3.5">
                        {QUESTIONS.map((q) => {
                            const currentRating = ratings[q.key] || 0
                            const hoverRating = hoveredStars[q.key] || 0
                            
                            return (
                                <div key={q.key} className="bg-white rounded-xl border border-gray-150 p-4 sm:p-5 shadow-sm hover:border-blue-300 transition-all duration-200">
                                    <div className="mb-3 flex items-center gap-2">
                                        {q.icon}
                                        <div>
                                            <p className="font-semibold text-gray-800 text-xs sm:text-sm">{q.label}</p>
                                            {q.description && (
                                                <p className="text-[11px] text-gray-400 mt-0.5">{q.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 pl-0 sm:pl-7">
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
                                                        onClick={() => handleRate(q.key, star)}
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

                    {/* Suggestions Section */}
                    <div className="space-y-4 pt-4">
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
