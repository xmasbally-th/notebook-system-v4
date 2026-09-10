'use server'

/**
 * Staff Reservation Actions — Co-located
 * Re-exports actions permitted for Staff role
 */
export {
    getReservationsAction,
    approveReservationAction,
    rejectReservationAction,
    markReadyReservationAction,
    convertReservationToLoanAction,
    type ReservationStats,
    type ReservationItemData,
    type GetReservationsResult
} from '@/app/admin/reservations/actions'
