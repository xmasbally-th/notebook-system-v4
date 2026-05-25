/**
 * Data Delete Functions
 */

import { DataType, DateRange, PreviewData } from './dataHelpers'
import { fetchExportData } from './dataExport'
import {
    safeSoftDeleteDataServer,
    safeHardDeleteNotificationsServer,
    fetchNotificationsPreviewServer,
    DeleteResult,
    NotificationDeleteResult
} from '../../app/admin/data-management/actions'

export type { DeleteResult, NotificationDeleteResult }

export async function fetchDeletePreview(
    dataType: DataType,
    dateRange: DateRange,
    statusFilter?: string[]
): Promise<PreviewData> {
    return fetchExportData({
        dataType,
        format: 'json',
        dateRange,
        statusFilter,
        includeRelated: true
    })
}

export async function softDeleteData(
    ids: string[],
    dataType: DataType
): Promise<DeleteResult> {
    return safeSoftDeleteDataServer(ids, dataType)
}

export async function fetchNotificationsPreview(
    dateRange: DateRange,
    readStatusFilter?: string[],
    typeFilter?: string[]
): Promise<PreviewData> {
    const res = await fetchNotificationsPreviewServer(dateRange, readStatusFilter, typeFilter)
    if ('error' in res && res.error) {
        throw new Error(res.error)
    }

    const records = res.records || []
    return {
        total: records.length,
        sample: records.slice(0, 10),
        columns: records.length > 0 ? Object.keys(records[0]) : []
    }
}

export async function hardDeleteNotifications(
    ids: string[]
): Promise<NotificationDeleteResult> {
    return safeHardDeleteNotificationsServer(ids)
}
