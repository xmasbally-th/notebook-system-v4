'use client';

import { useEffect, useState } from 'react';

/**
 * DebugConsole component ใช้โหลด Eruda สำหรับ debug บนมือถือ
 * จะแสดงปุ่มลอยบนหน้าจอใน development mode เท่านั้น
 * หรือเมื่อมี ?debug=true ใน URL
 */
export default function DebugConsole() {
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        // ตรวจสอบว่าอยู่ใน development mode หรือมี ?debug=true ใน URL
        const urlParams = new URLSearchParams(window.location.search);
        const debugParam = urlParams.get('debug');
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev || debugParam === 'true') {
            setIsEnabled(true);

            // โหลด Eruda จาก CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/eruda';
            script.onload = () => {
                // @ts-ignore
                if (window.eruda) {
                    // @ts-ignore
                    window.eruda.init();
                }
            };
            document.body.appendChild(script);

            return () => {
                // Cleanup
                document.body.removeChild(script);
                // @ts-ignore
                if (window.eruda) {
                    // @ts-ignore
                    window.eruda.destroy();
                }
            };
        }
    }, []);

    return null;
}
