import nodemailer from 'nodemailer';

type OtpPurpose = 'register' | 'reset-password';

function getEmailHost(): string | undefined {
    return process.env.SMTP_HOST || process.env.EMAIL_HOST;
}

function getEmailUser(): string | undefined {
    return process.env.SMTP_USER || process.env.EMAIL_HOST_USER;
}

function getEmailPassword(): string | undefined {
    return process.env.SMTP_PASS || process.env.EMAIL_HOST_PASSWORD;
}

function getEmailPort(): number {
    return Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
}

function getEmailSecure(port: number): boolean {
    const secure = process.env.SMTP_SECURE;
    if (secure) return secure.toLowerCase() === 'true';

    const useTls = process.env.EMAIL_USE_TLS;
    if (useTls) return false;

    return port === 465;
}

function isSmtpConfigured(): boolean {
    return Boolean(getEmailHost() && getEmailUser() && getEmailPassword());
}

function getTransporter() {
    const port = getEmailPort();
    const user = getEmailUser();
    const pass = getEmailPassword();

    return nodemailer.createTransport({
        host: getEmailHost(),
        port,
        secure: getEmailSecure(port),
        auth: {
            user,
            pass
        }
    });
}

function getSubject(purpose: OtpPurpose): string {
    if (purpose === 'reset-password') return 'S-Mart - Ma OTP dat lai mat khau';
    return 'S-Mart - Ma OTP xac minh dang ky';
}

function getText(otp: string, purpose: OtpPurpose): string {
    const action = purpose === 'reset-password' ? 'dat lai mat khau' : 'xac minh tai khoan';
    return `Ma OTP cua ban de ${action} la: ${otp}. Ma co hieu luc trong 10 phut.`;
}

function getHtml(otp: string, purpose: OtpPurpose): string {
    const action = purpose === 'reset-password' ? 'dat lai mat khau' : 'xac minh tai khoan';
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>S-Mart Sport Shop</h2>
            <p>Ma OTP cua ban de ${action}:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
            <p>Ma co hieu luc trong 10 phut. Vui long khong chia se ma nay voi nguoi khac.</p>
        </div>
    `;
}

export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose): Promise<void> {
    if (!isSmtpConfigured()) {
        console.warn(`[EmailService] SMTP chua duoc cau hinh. OTP cho ${to}: ${otp}`);
        return;
    }

    const from = process.env.SMTP_FROM || process.env.DEFAULT_FROM_EMAIL || getEmailUser();
    await getTransporter().sendMail({
        from,
        to,
        subject: getSubject(purpose),
        text: getText(otp, purpose),
        html: getHtml(otp, purpose)
    });
}
