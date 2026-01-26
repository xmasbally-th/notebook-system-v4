'use client'

import { useState, useEffect } from 'react'
import { Star, X, Loader2, Send, AlertTriangle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface EvaluationModalProps {
    isOpen: boolean
    onClose: () => void
    loan: any
    onSuccess: () => void
}

interface RatingSection {
    title: string
    category: 'system' | 'service' | 'equipment'
    questions: {
        key: string
        label: string
        description?: string
    }[]
}

const SECTIONS: RatingSection[] = [
    {
        title: 'ด้านประสิทธิภาพของระบบ (System)',
        category: 'system',
        questions: [
            { key: 'usability', label: '1. ด้านการออกแบบและการใช้งาน (Usability)', description: 'ความสะดวกและง่ายต่อการใช้งานระบบโดยรวม' },
            { key: 'information', label: '2. ด้านข้อมูล (Information)', description: 'ความครบถ้วนและถูกต้องของข้อมูลอุปกรณ์' },
            { key: 'performance', label: '3. ด้านเสถียรภาพ (Performance)', description: 'ความเสถียรและความรวดเร็วในการเข้าถึงระบบ' }
        ]
    },
    {
        title: 'กระบวนการให้บริการ (Process & Service)',
        category: 'service',
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
        questions: [
            { key: 'physical', label: '1. ด้านกายภาพ (Physical)', description: 'ความสะอาดและความสมบูรณ์แข็งแรงของอุปกรณ์ภายนอก' },
            { key: 'performance', label: '2. ด้านประสิทธิภาพการทำงาน (Performance)', description: 'ประสิทธิภาพการประมวลผลและความพร้อมใช้งานของระบบ' },
            { key: 'quantity', label: '3. ด้านปริมาณและความหลากหลาย (Quantity)', description: 'ความเพียงพอและความหลากหลายของอุปกรณ์ที่ให้บริการ' }
        ]
    }
]

export default function EvaluationModal({ isOpen, onClose, loan, onSuccess }: EvaluationModalProps) {
    const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({
        system: { usability: 0, information: 0, performance: 0 },
        service: { speed: 0, rules: 0, staff: 0, communication: 0 },
        equipment: { physical: 0, performance: 0, quantity: 0 }
    })
    const [suggestions, setSuggestions] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        // Check if all questions have been rated
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">แบบประเมินความพึงพอใจ</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            อุปกรณ์: {loan.equipment?.name} (#{loan.equipment?.equipment_number})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Sections */}
                    {SECTIONS.map((section) => (
                        <div key={section.category} className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-blue-600 pl-3">
                                {section.title}
                            </h3>
                            <div className="space-y-4 pl-4">
                                {section.questions.map((q) => (
                                    <div key={q.key} className="bg-gray-50 rounded-lg p-4">
                                        <div className="mb-3">
                                            <p className="font-medium text-gray-900">{q.label}</p>
                                            {q.description && (
                                                <p className="text-sm text-gray-500 mt-1">{q.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRate(section.category, q.key, star)}
                                                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                                >
                                                    <Star
                                                        className={`w-8 h-8 ${ratings[section.category][q.key] >= star
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-500 self-center">
                                                {ratings[section.category][q.key] > 0
                                                    ? `${ratings[section.category][q.key]} คะแนน`
                                                    : 'ยังไม่ระบุ'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Suggestions Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-blue-600 pl-3">
                            ส่วนที่ 5: ข้อเสนอแนะเพิ่มเติม (Suggestions)
                        </h3>
                        <div className="pl-4">
                            <textarea
                                value={suggestions}
                                onChange={(e) => setSuggestions(e.target.value)}
                                placeholder="ข้อเสนอแนะเพื่อการปรับปรุง..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        disabled={isSubmitting}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
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
