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

        // Gmail SMTP configuration from environment variables
        const GMAIL_USER = process.env.GMAIL_USER
        const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const recipients = Array.isArray(to) ? to : [to]
        
        for (const email of recipients) {
            if (!emailRegex.test(email)) {
                return NextResponse.json(
                    { error: `Invalid recipient email address: ${email}` },
                    { status: 400 }
                )
            }
        }

        if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
            // Fallback: Log to console (simulated sending)
            console.log('---------------------------------------------------')
            console.log('⚠️  Gmail Credentials not found. Simulating email send.')
            console.log('Debug Info:')
            console.log(`- GMAIL_USER: ${GMAIL_USER ? 'Present' : 'MISSING'}`)
            console.log(`- GMAIL_APP_PASSWORD: ${GMAIL_APP_PASSWORD ? 'Present' : 'MISSING'}`)
            console.log(`To: ${recipients.join(', ')}`)
            console.log(`Subject: ${subject}`)
            console.log('--- Content ---')
            console.log(html)
            console.log('---------------------------------------------------')

            return NextResponse.json({
                message: 'Email simulated (check server console)',
                simulated: true
            })
        }

        // Validate sender email format
        if (!emailRegex.test(GMAIL_USER)) {
            return NextResponse.json(
                { error: 'Invalid Gmail user email address format' },
                { status: 400 }
            )
        }

        // Create nodemailer transporter with Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
            },
        })

        // Verify transporter configuration
        try {
            await transporter.verify()
            console.log('Gmail SMTP connection verified successfully')
        } catch (verifyError: any) {
            console.error('Gmail SMTP verification failed:', verifyError)
            return NextResponse.json(
                { 
                    error: 'Failed to verify Gmail SMTP connection', 
                    details: verifyError.message,
                    troubleshooting: {
                        step1: 'Verify GMAIL_USER is your full Gmail address',
                        step2: 'Ensure GMAIL_APP_PASSWORD is a Gmail App Password (not your regular password)',
                        step3: 'Check that 2-Step Verification is enabled on your Google account',
                        step4: 'Generate a new App Password from: https://myaccount.google.com/apppasswords'
                    }
                },
                { status: 500 }
            )
        }

        // Prepare email options
        const mailOptions = {
            from: `"Malar CRM" <${GMAIL_USER}>`,
            to: recipients.join(', '),
            subject: subject,
            html: html,
        }

        console.log('Sending email via Gmail SMTP:', {
            from: GMAIL_USER,
            to: recipients.join(', '),
            subject: subject.substring(0, 50) + '...',
            recipientCount: recipients.length
        })

        // Send email
        const info = await transporter.sendMail(mailOptions)

        console.log('Email sent successfully via Gmail:', {
            messageId: info.messageId,
            response: info.response
        })

        return NextResponse.json({ 
            message: 'Email sent successfully', 
            id: info.messageId,
            success: true 
        }, { status: 200 })
    } catch (error: any) {
        console.error('Error sending email via Gmail:', error)
        console.error('Error type:', typeof error)
        console.error('Error constructor:', error?.constructor?.name)
        
        // Extract error message
        let errorMessage = error.message || 'Unknown error'
        let errorDetails: any = {}
        
        // Nodemailer error structure
        if (error.response) {
            errorDetails = error.response
            errorMessage = error.response.message || errorMessage
        } else if (error.code) {
            errorDetails = { code: error.code, command: error.command, response: error.response }
            
            // Provide helpful messages for common Gmail errors
            if (error.code === 'EAUTH') {
                errorMessage = 'Gmail authentication failed. Please check your Gmail App Password.'
            } else if (error.code === 'ECONNECTION') {
                errorMessage = 'Failed to connect to Gmail SMTP server.'
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Connection to Gmail SMTP server timed out.'
            }
        }
        
        // Log full error for debugging
        try {
            console.error('Error details (stringified):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        } catch (e) {
            console.error('Could not stringify error:', e)
        }

        return NextResponse.json(
            { 
                error: 'Failed to send email', 
                details: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { 
                    fullError: errorDetails,
                    errorType: error?.constructor?.name,
                    errorCode: error.code,
                    troubleshooting: error.code === 'EAUTH' ? {
                        step1: 'Go to https://myaccount.google.com/apppasswords',
                        step2: 'Generate a new App Password for "Mail"',
                        step3: 'Copy the 16-character password (no spaces)',
                        step4: 'Update GMAIL_APP_PASSWORD in your .env file',
                        step5: 'Restart your Next.js server'
                    } : undefined
                })
            },
            { status: 500 }
        )
    }
}
