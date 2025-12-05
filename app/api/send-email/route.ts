import { NextResponse } from 'next/server'
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

export async function POST(request: Request) {
    try {
        const { to, subject, html } = await request.json()

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            )
        }

        const API_KEY = process.env.MAILERSEND_API_KEY
        const SENDER_EMAIL = process.env.MAILERSEND_FROM

        if (!API_KEY || !SENDER_EMAIL) {
            // Fallback: Log to console (simulated sending)
            console.log('---------------------------------------------------')
            console.log('⚠️  Mailersend Credentials not found. Simulating email send.')
            console.log('Debug Info:')
            console.log(`- MAILERSEND_API_KEY: ${API_KEY ? 'Present' : 'MISSING'}`)
            console.log(`- MAILERSEND_FROM: ${SENDER_EMAIL ? 'Present' : 'MISSING'}`)
            console.log(`To: ${to}`)
            console.log(`Subject: ${subject}`)
            console.log('--- Content ---')
            console.log(html)
            console.log('---------------------------------------------------')

            return NextResponse.json({
                message: 'Email simulated (check server console)',
                simulated: true
            })
        }

        const mailersend = new MailerSend({
            apiKey: API_KEY,
        })

        const recipients = Array.isArray(to)
            ? to.map(email => new Recipient(email))
            : [new Recipient(to)]

        const sentFrom = new Sender(SENDER_EMAIL, "Malar CRM")

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject(subject)
            .setHtml(html)

        const result = await mailersend.email.send(emailParams)

        console.log('Message sent via Mailersend:', result)

        return NextResponse.json({ message: 'Email sent successfully', id: result })
    } catch (error: any) {
        console.error('Error sending email via Mailersend:', error)
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        )
    }
}
