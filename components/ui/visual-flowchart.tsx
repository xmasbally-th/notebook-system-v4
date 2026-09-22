'use client'

import React, { useState } from 'react'
import {
    GitBranch,
    ArrowDown,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Play,
    Flag,
    Workflow,
    ListOrdered,
    Sparkles,
} from 'lucide-react'

export interface FlowchartBranch {
    type: 'success' | 'danger' | 'alert' | 'special' | 'neutral'
    label: string
    text: string
    status?: string
}

export interface FlowchartStep {
    stepNum: number
    actor: string
    actorRole?: 'user' | 'staff' | 'counter' | 'system'
    title: string
    desc: string
    statusBadge?: string
    isDecision?: boolean
    branches?: FlowchartBranch[]
}

export interface VisualFlowchartProps {
    steps: FlowchartStep[]
    startLabel?: string
    endLabel?: string
    defaultMode?: 'flowchart' | 'stepper'
    roleTheme?: 'user' | 'staff' | 'admin'
}

const actorRoleStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    user: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
    },
    staff: {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
    },
    counter: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
    },
    system: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
    },
}

const branchStyles: Record<string, {
    bg: string
    border: string
    text: string
    badge: string
    iconColor: string
    lineColor: string
}> = {
    success: {
        bg: 'bg-emerald-50/90',
        border: 'border-emerald-300',
        text: 'text-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        iconColor: 'text-emerald-600',
        lineColor: 'border-emerald-400',
    },
    danger: {
        bg: 'bg-rose-50/90',
        border: 'border-rose-300',
        text: 'text-rose-900',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        iconColor: 'text-rose-600',
        lineColor: 'border-rose-400',
    },
    alert: {
        bg: 'bg-amber-50/90',
        border: 'border-amber-300',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        iconColor: 'text-amber-600',
        lineColor: 'border-amber-400',
    },
    special: {
        bg: 'bg-indigo-50/90',
        border: 'border-indigo-300',
        text: 'text-indigo-900',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        iconColor: 'text-indigo-600',
        lineColor: 'border-indigo-400',
    },
    neutral: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        iconColor: 'text-slate-500',
        lineColor: 'border-slate-300',
    },
}

export function VisualFlowchart({
    steps,
    startLabel = 'เริ่มต้นกระบวนการ (Start)',
    endLabel = 'สิ้นสุดกระบวนการสมบูรณ์ (End)',
    defaultMode = 'flowchart',
}: VisualFlowchartProps) {
    const [mode, setMode] = useState<'flowchart' | 'stepper'>(defaultMode)

    return (
        <div className="space-y-4">
            {/* View Mode Toggle Header (Hidden when printing on paper) */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/80 print-hidden">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>โหมดแสดงผลผังงานกระบวนการ</span>
                </div>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setMode('flowchart')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mode === 'flowchart'
                                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Workflow className="w-3.5 h-3.5" />
                        <span>ผังงาน (Flowchart)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('stepper')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mode === 'stepper'
                                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span>รายละเอียด (Stepper)</span>
                    </button>
                </div>
            </div>

            {/* Mode 1: Graphical Visual Flowchart View */}
            {mode === 'flowchart' && (
                <div className="py-2 print:py-0">
                    {/* START NODE */}
                    <div className="flex flex-col items-center print-avoid-break">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 border-2 border-emerald-500 shadow-xs font-bold text-xs sm:text-sm ring-4 ring-emerald-50/60 print:bg-slate-100 print:text-black print:border-slate-800 print:ring-0">
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 print:bg-slate-800">
                                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                            </div>
                            <span>{startLabel}</span>
                        </div>
                        {/* Connector Arrow Down */}
                        <div className="flex flex-col items-center my-1.5 print:my-1">
                            <div className="w-0.5 h-5 bg-emerald-500 print:bg-slate-800" />
                            <ArrowDown className="w-4 h-4 text-emerald-600 print:text-slate-800 -mt-1" />
                        </div>
                    </div>

                    {/* STEPS FLOW */}
                    <div className="space-y-0">
                        {steps.map((step, idx) => {
                            const isLast = idx === steps.length - 1
                            const actorStyle = actorRoleStyles[step.actorRole || 'user'] || actorRoleStyles.user
                            const hasBranches = step.branches && step.branches.length > 0

                            return (
                                <div key={step.stepNum} className="flex flex-col items-center w-full print-avoid-break">
                                    {/* Flowchart Node Box */}
                                    <div
                                        className={`w-full max-w-2xl bg-white rounded-2xl border-2 transition-all shadow-xs hover:shadow-md print:max-w-full print:rounded-md print:border-slate-500 print:shadow-none ${
                                            hasBranches
                                                ? 'border-amber-300 ring-4 ring-amber-50/60 print:ring-0'
                                                : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        {/* Node Header */}
                                        <div className="p-3.5 sm:p-4 print:p-2.5">
                                            <div className="flex items-center justify-between gap-2 flex-wrap mb-2 print:mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0 print:bg-slate-800">
                                                        {step.stepNum}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${actorStyle.bg} ${actorStyle.text} ${actorStyle.border} print:bg-slate-100 print:text-black print:border-slate-400`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${actorStyle.dot} print:bg-slate-800`} />
                                                        {step.actor}
                                                    </span>
                                                </div>
                                                {step.statusBadge && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 print:text-black print:border-slate-400">
                                                        {step.statusBadge}
                                                    </span>
                                                )}
                                            </div>

                                            <h5 className="font-bold text-slate-900 text-sm sm:text-base leading-snug print:text-black print:text-sm">
                                                {step.title}
                                            </h5>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1 print:text-slate-800 print:text-xs">
                                                {step.desc}
                                            </p>

                                            {/* Decision Point Marker if branches exist */}
                                            {hasBranches && (
                                                <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center gap-1.5 text-xs font-bold text-amber-800 print:border-slate-300 print:text-black print:mt-2 print:pt-1.5">
                                                    <GitBranch className="w-4 h-4 text-amber-600 print:text-slate-800" />
                                                    <span>จุดแยกตัดสินใจ (Decision Branches):</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* BRANCHING PATHS VISUALIZATION */}
                                        {hasBranches && (
                                            <div className="bg-gradient-to-b from-amber-50/50 to-slate-50/80 p-3.5 sm:p-4 border-t border-amber-200/70 rounded-b-2xl print:bg-white print:border-slate-300 print:p-2 print:rounded-none">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:gap-2">
                                                    {step.branches!.map((branch, bIdx) => {
                                                        const bStyle = branchStyles[branch.type] || branchStyles.neutral
                                                        const isTerminalExit = branch.type === 'danger'

                                                        return (
                                                            <div
                                                                key={bIdx}
                                                                className={`p-3 rounded-xl border-2 flex flex-col justify-between ${bStyle.bg} ${bStyle.border} shadow-2xs print:bg-white print:border-slate-400 print:p-2 print:shadow-none`}
                                                            >
                                                                <div>
                                                                    <div className="flex items-center justify-between gap-1.5 mb-1">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {branch.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 print:text-slate-800" />}
                                                                            {branch.type === 'danger' && <XCircle className="w-4 h-4 text-rose-600 shrink-0 print:text-slate-800" />}
                                                                            {branch.type === 'alert' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 print:text-slate-800" />}
                                                                            {branch.type === 'special' && <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 print:text-slate-800" />}
                                                                            <span className={`font-bold text-xs ${bStyle.text} print:text-black`}>{branch.label}</span>
                                                                        </div>
                                                                        {branch.status && (
                                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${bStyle.badge} print:bg-slate-100 print:text-black print:border-slate-400`}>
                                                                                {branch.status}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-700 leading-relaxed mt-1 print:text-slate-800">
                                                                        {branch.text}
                                                                    </p>
                                                                </div>

                                                                {/* Flow Indicator on branch */}
                                                                <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-semibold text-slate-500 print:border-slate-200 print:text-slate-700 print:mt-1.5 print:pt-1">
                                                                    <span>ผลลัพธ์:</span>
                                                                    <span className={`inline-flex items-center gap-1 ${isTerminalExit ? 'text-rose-600 print:text-black' : 'text-emerald-700 print:text-black'}`}>
                                                                        {isTerminalExit ? (
                                                                            <>
                                                                                <span>สิ้นสุดคำขอ</span>
                                                                                <XCircle className="w-3 h-3" />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span>เข้าสู่ขั้นตอนถัดไป</span>
                                                                                <ArrowDown className="w-3 h-3" />
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Connector Arrow Down between nodes */}
                                    {!isLast && (
                                        <div className="flex flex-col items-center my-2 print:my-1">
                                            <div className="w-0.5 h-6 bg-slate-300 print:bg-slate-800" />
                                            <ArrowDown className="w-4 h-4 text-slate-400 print:text-slate-800 -mt-1" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Connector Arrow Down to END NODE */}
                    <div className="flex flex-col items-center my-2 print:my-1">
                        <div className="w-0.5 h-6 bg-slate-400 print:bg-slate-800" />
                        <ArrowDown className="w-4 h-4 text-slate-500 print:text-slate-800 -mt-1" />
                    </div>

                    {/* END NODE */}
                    <div className="flex flex-col items-center print-avoid-break">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white border-2 border-slate-900 shadow-sm font-bold text-xs sm:text-sm ring-4 ring-slate-200 print:bg-slate-100 print:text-black print:border-slate-800 print:ring-0">
                            <div className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 print:bg-slate-800">
                                <Flag className="w-3 h-3" />
                            </div>
                            <span>{endLabel}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Mode 2: Detailed Stepper List View */}
            {mode === 'stepper' && (
                <div className="space-y-3.5 py-1">
                    {steps.map((step) => {
                        const actorStyle = actorRoleStyles[step.actorRole || 'user'] || actorRoleStyles.user
                        return (
                            <div
                                key={step.stepNum}
                                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-colors shadow-2xs print-avoid-break print:p-2.5 print:shadow-none"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                                        {step.stepNum}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${actorStyle.bg} ${actorStyle.text} ${actorStyle.border}`}>
                                                    {step.actor}
                                                </span>
                                                <h5 className="font-bold text-slate-900 text-sm sm:text-base">{step.title}</h5>
                                            </div>
                                            {step.statusBadge && (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                                                    {step.statusBadge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>

                                        {step.branches && step.branches.length > 0 && (
                                            <div className={`mt-3 pt-3 border-t border-slate-100 grid gap-2.5 ${step.branches.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                                {step.branches.map((b, bIdx) => {
                                                    const bStyle = branchStyles[b.type] || branchStyles.neutral
                                                    return (
                                                        <div key={bIdx} className={`p-3 rounded-xl border ${bStyle.bg} ${bStyle.border} ${bStyle.text}`}>
                                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                                <span className="font-bold text-xs">{b.label}</span>
                                                                {b.status && (
                                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${bStyle.badge}`}>
                                                                        {b.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs opacity-90 leading-relaxed">{b.text}</p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
