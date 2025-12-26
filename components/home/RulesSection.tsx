import React from 'react'
import { CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react'

export default function RulesSection() {
    const rules = [
        {
            icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
            title: "Eligibility",
            description: "Only approved students and faculty members can borrow equipment."
        },
        {
            icon: <Clock className="w-6 h-6 text-blue-600" />,
            title: "Duration",
            description: "Standard loan period is up to 7 days. Extensions must be approved."
        },
        {
            icon: <CheckCircle2 className="w-6 h-6 text-purple-600" />,
            title: "Responsibility",
            description: "Borrowers are fully responsible for any damage or loss during the loan period."
        },
        {
            icon: <AlertCircle className="w-6 h-6 text-orange-600" />,
            title: "Late Returns",
            description: "Late returns may result in suspension of borrowing privileges."
        }
    ]

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Usage Guidelines</h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Please adhere to the following rules to ensure fair access for everyone.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {rules.map((rule, index) => (
                        <div
                            key={index}
                            className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="mb-4 p-3 bg-white rounded-lg w-fit shadow-sm border border-gray-100">
                                {rule.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{rule.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {rule.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
