'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

/**
 * Global Error Boundary Component
 * จับ errors ที่เกิดใน child components และแสดง fallback UI
 * ป้องกันไม่ให้ทั้งแอปล่มเมื่อเกิด error
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so next render shows fallback UI
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        this.setState({ errorInfo })

        // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
        // if (process.env.NODE_ENV === 'production') {
        //     sendToErrorService(error, errorInfo)
        // }
    }

    handleRefresh = (): void => {
        window.location.reload()
    }

    handleGoHome = (): void => {
        window.location.href = '/'
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        {/* Error Message */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            เกิดข้อผิดพลาด
                        </h1>
                        <p className="text-gray-500 mb-6">
                            ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
                        </p>

                        {/* Error Details (Development only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-40">
                                <p className="text-sm font-mono text-red-800 break-all">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="mt-2 text-xs font-mono text-red-600 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRefresh}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                รีเฟรชหน้า
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                กลับหน้าหลัก
                            </button>
                        </div>

                        {/* Try Again Link */}
                        <button
                            onClick={this.handleReset}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                            ลองใหม่โดยไม่รีเฟรช
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
