import EquipmentForm from '@/components/admin/EquipmentForm'

export const dynamic = 'force-dynamic'

export default function NewEquipmentPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add New Equipment</h1>
            <p className="text-gray-500 mb-8">
                Enter the details for the new equipment below. Fields marked with * are required.
            </p>

            <EquipmentForm />
        </div>
    )
}
