'use server'

import {
    getReservationsAction as adminGetReservationsAction,
    approveReservationAction as adminApproveReservationAction,
    rejectReservationAction as adminRejectReservationAction,
    markReadyReservationAction as adminMarkReadyReservationAction,
    convertReservationToLoanAction as adminConvertReservationToLoanAction,
    type ReservationStats,
    type ReservationItemData,
    type GetReservationsResult
} from '@/app/admin/reservations/actions'

export type { ReservationStats, ReservationItemData, GetReservationsResult }

export async function getReservationsAction(...args: Parameters<typeof adminGetReservationsAction>) {
    return adminGetReservationsAction(...args)
}

export async function approveReservationAction(...args: Parameters<typeof adminApproveReservationAction>) {
    return adminApproveReservationAction(...args)
}

export async function rejectReservationAction(...args: Parameters<typeof adminRejectReservationAction>) {
    return adminRejectReservationAction(...args)
}

export async function markReadyReservationAction(...args: Parameters<typeof adminMarkReadyReservationAction>) {
    return adminMarkReadyReservationAction(...args)
}

export async function convertReservationToLoanAction(...args: Parameters<typeof adminConvertReservationToLoanAction>) {
    return adminConvertReservationToLoanAction(...args)
}

