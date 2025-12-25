import EquipmentListContainer from '@/components/equipment/EquipmentList'

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Equipment Lending System</h1>
                    <div className="flex gap-4">
                        {/* Auth buttons could go here */}
                        <a href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">Login</a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800">Available Equipment</h2>
                    <p className="mt-1 text-sm text-gray-500">Browse and reserve equipment for your department.</p>
                </div>

                <EquipmentListContainer />
            </div>
        </main>
    )
}
