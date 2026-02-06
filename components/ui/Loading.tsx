import { ComponentPropsWithoutRef } from 'react'

interface LoadingProps extends ComponentPropsWithoutRef<'div'> {
    text?: string
}

export default function Loading({ text = 'กำลังโหลด…', className, ...props }: LoadingProps) {
    return (
        <div className={`flex flex-col items-center justify-center min-h-[50vh] p-8 ${className}`} {...props}>
            <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[var(--primary)] rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
                    <span className="text-2xl">📦</span>
                </div>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-500 animate-pulse font-body">
                {text}
            </p>
        </div>
    )
}
