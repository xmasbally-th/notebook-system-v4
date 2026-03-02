import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMyLoansPageData } from '@/lib/data/my-loans'
import MyLoansClient from '@/components/loans/MyLoansClient'

export default async function MyLoansPage() {
    // Auth check on server
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all data in parallel on the server
    const { loans, reservations, evaluationCutoffDate } = await getMyLoansPageData()

    return (
        <MyLoansClient
            loans={loans}
            reservations={reservations}
            evaluationCutoffDate={evaluationCutoffDate}
        />
    )
}
