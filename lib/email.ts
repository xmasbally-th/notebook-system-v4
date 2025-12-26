export async function sendApprovalEmail(email: string, fullName: string) {
    // In a real application, you would use Resend, SendGrid, or AWS SES here.
    // For now, we just log to the console.
    console.log(`[EMAIL MOCK] Sending approval email to ${email} (${fullName})`)

    // Example content if we were sending real email:
    // Subject: Your Notebook System account has been approved
    // Body: Dear ${fullName}, your account is now active. You can login at ...

    return true
}
