'use client'

import { SlidersHorizontal, Star, Info, ChevronUp, ChevronDown } from 'lucide-react'

interface EvaluationSectionAveragesProps {
    sectionAvgs: Record<string, { sum: number; count: number }>
    starDistribution: Record<number, number>
    starTotal: number
    showScoringInfo: boolean
    setShowScoringInfo: (show: boolean) => void
}

export default function EvaluationSectionAverages({
    sectionAvgs,
    starDistribution,
    starTotal,
    showScoringInfo,
    setShowScoringInfo
}: EvaluationSectionAveragesProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. คะแนนเฉลี่ยแยกตามด้าน */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                        คะแนนเฉลี่ยแยกตามด้าน
                    </h4>
                    <div className="space-y-3.5">
                        {[
                            { key: 'system', label: 'ด้านระบบออนไลน์ (System)' },
                            { key: 'service', label: 'ด้านการให้บริการ (Service)' },
                            { key: 'equipment', label: 'ด้านอุปกรณ์ (Equipment)' },
                            { key: 'overall', label: 'ความพึงพอใจภาพรวม (Overall)' },
                        ].map(({ key, label }) => {
                            const stats = sectionAvgs?.[key]
                            const avg = stats && stats.count > 0 ? stats.sum / stats.count : 0
                            return (
                                <div key={key} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                                        <span>{label}</span>
                                        <span className="text-gray-900 bg-amber-50 px-2 py-0.5 rounded text-amber-700 font-bold border border-amber-100">
                                            {avg ? avg.toFixed(2) : '-'} / 5.0
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/20">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                                            style={{ width: `${(avg / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 2. การกระจายตัวของระดับดาว (Review Bars) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        การกระจายตัวของระดับดาว
                    </h4>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = starDistribution[stars] || 0
                            const total = starTotal || 1
                            const percentage = (count / total) * 100
                            return (
                                <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                                    <span className="w-10 whitespace-nowrap">{stars} ดาว</span>
                                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/20">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                                stars === 5 ? 'from-emerald-400 to-green-500' :
                                                stars === 4 ? 'from-green-400 to-lime-500' :
                                                stars === 3 ? 'from-yellow-400 to-amber-500' :
                                                stars === 2 ? 'from-orange-400 to-orange-500' :
                                                'from-red-400 to-rose-500'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-gray-400">{count} รีวิว</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 3. หลักการคำนวณและรายละเอียดข้อคําถาม */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between">
                <button
                    onClick={() => setShowScoringInfo(!showScoringInfo)}
                    className="w-full p-5 flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/30"
                >
                    <div className="flex items-center gap-2">
                        <Info className="w-4.5 h-4.5 text-blue-500" />
                        หลักการคำนวณและรายละเอียดข้อคําถาม
                    </div>
                    {showScoringInfo ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                </button>
                <div className="flex-1 p-5 text-xs text-slate-650 space-y-3 bg-white overflow-y-auto max-h-[160px] scrollbar-thin">
                    {showScoringInfo ? (
                        <>
                            <p>แบบประเมินมี <strong>รวมทั้งหมด 5 ข้อคําถามหลัก</strong> (คะแนน 1-5 ⭐):</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="font-bold text-slate-800">🖥 ระบบ:</p>
                                    <p className="text-slate-500 pl-2">ความง่าย ความเสถียร และความครบถ้วนของข้อมูล</p>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">🤝 บริการ:</p>
                                    <p className="text-slate-500 pl-2">ความรวดเร็วในการรับ-คืน, การให้บริการของเจ้าหน้าที่</p>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">📦 อุปกรณ์:</p>
                                    <p className="text-slate-500 pl-2">สภาพและคุณภาพความพร้อมใช้งานของอุปกรณ์</p>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">⭐ ภาพรวม:</p>
                                    <p className="text-slate-500 pl-2">ความพึงพอใจโดยรวม</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100/50 text-blue-900 flex items-start gap-2 h-full">
                            <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                                <strong>หลักการปัดเศษ:</strong> คะแนนเฉลี่ยรวมในแต่ละรายการ คำนวณจากค่าเฉลี่ยของทุกข้อ จากนั้นจะถูกปัดเศษตามหลักทศนิยมทางสถิติออกมาเป็นดาวรวม
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
