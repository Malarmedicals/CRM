import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
    try {
        const { to, subject, html } = await request.json()

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            )
        }

        // Create a transporter
        // Look for environment variables first
        const smtpHost = process.env.SMTP_HOST
        const smtpPort = parseInt(process.env.SMTP_PORT || '587')
        const smtpUser = process.env.SMTP_USER
        const smtpPass = process.env.SMTP_PASS

        let transporter

        if (smtpHost && smtpUser && smtpPass) {
            // Use provided SMTP credentials
            transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            })
        } else {
            // Fallback: Log to console (simulated sending)
            console.log('---------------------------------------------------')
            console.log('⚠️  SMTP Credentials not found. Simulating email send.')
            console.log(`To: ${to}`)
            console.log(`Subject: ${subject}`)
            console.log('--- Content ---')
            console.log(html) // Log HTML content (might be long)
            console.log('---------------------------------------------------')

            // For a more realistic test without credentials, we could use Ethereal
            // but console log is safer/faster for immediate feedback.

            return NextResponse.json({
                message: 'Email simulated (check server console)',
                simulated: true
            })
        }

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Malar CRM" <noreply@malarcrm.com>', // sender address
            to: Array.isArray(to) ? to.join(', ') : to, // list of receivers
            subject: subject, // Subject line
            html: html, // html body
        })

        console.log('Message sent: %s', info.messageId)

        return NextResponse.json({ message: 'Email sent successfully', messageId: info.messageId })
    } catch (error: any) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        )
    }
}
