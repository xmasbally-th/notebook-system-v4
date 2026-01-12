/**
 * Permission Service for Role-Based Access Control
 * Defines role hierarchy and permission checking utilities
 */

// Role types
export type Role = 'admin' | 'staff' | 'user'

// Role hierarchy - higher number = more permissions
export const ROLE_HIERARCHY: Record<Role, number> = {
    admin: 3,
    staff: 2,
    user: 1
}

// Staff-specific permissions
export const STAFF_PERMISSIONS = [
    'loan_request:view',
    'loan_request:approve',
    'loan_request:reject',
    'loan_return:process',
    'loan_return:verify',
    'equipment:view',
    'overdue:view',
    'overdue:notify'
] as const

// Admin-only permissions (beyond staff)
export const ADMIN_ONLY_PERMISSIONS = [
    'user:manage',
    'equipment:create',
    'equipment:update',
    'equipment:delete',
    'category:manage',
    'reservation:manage',
    'settings:manage',
    'intelligence:access',
    'audit:view'
] as const

export type StaffPermission = typeof STAFF_PERMISSIONS[number]
export type AdminPermission = typeof ADMIN_ONLY_PERMISSIONS[number]
export type Permission = StaffPermission | AdminPermission

/**
 * Check if a user's role meets or exceeds the required role level
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can access loan management features
 */
export function canAccessLoanManagement(role: Role): boolean {
    return hasRole(role, 'staff')
}

/**
 * Check if user can access user management (admin only)
 */
export function canAccessUserManagement(role: Role): boolean {
    return role === 'admin'
}

/**
 * Check if user can access equipment management (admin only)
 */
export function canAccessEquipmentManagement(role: Role): boolean {
    return role === 'admin'
}

/**
 * Check if user can access system settings (admin only)
 */
export function canAccessSettings(role: Role): boolean {
    return role === 'admin'
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    if (role === 'admin') {
        // Admin has all permissions
        return true
    }

    if (role === 'staff') {
        // Staff has staff permissions only
        return (STAFF_PERMISSIONS as readonly string[]).includes(permission)
    }

    // Regular users have no special permissions
    return false
}

/**
 * Get display name for role in Thai
 */
export function getRoleDisplayName(role: Role): string {
    switch (role) {
        case 'admin':
            return 'ผู้ดูแลระบบ'
        case 'staff':
            return 'เจ้าหน้าที่ให้บริการ'
        case 'user':
            return 'ผู้ใช้งาน'
        default:
            return 'ไม่ระบุ'
    }
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: Role): string {
    switch (role) {
        case 'admin':
            return 'bg-purple-100 text-purple-700'
        case 'staff':
            return 'bg-blue-100 text-blue-700'
        case 'user':
            return 'bg-gray-100 text-gray-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

/**
 * Check if role is at staff level or above (can manage loans)
 */
export function isStaffOrAbove(role: Role): boolean {
    return role === 'admin' || role === 'staff'
}

/**
 * Check if role is admin
 */
export function isAdmin(role: Role): boolean {
    return role === 'admin'
}
