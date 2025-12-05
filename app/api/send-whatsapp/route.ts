import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { to, message } = await request.json()

        if (!to || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: to, message' },
                { status: 400 }
            )
        }

        // Validate phone number format (supports India +91 and other international formats)
        // India format: +91XXXXXXXXXX (10 digits after +91)
        // Other formats: +1234567890 (minimum 10 digits total)
        const phoneRegex = /^\+?[1-9]\d{9,14}$/
        const cleanPhone = to.replace(/\s|-|\(|\)/g, '')
        
        if (!phoneRegex.test(cleanPhone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Use international format: +919876543210 (India) or +1234567890' },
                { status: 400 }
            )
        }

        // Get Meta WhatsApp Cloud API credentials from environment variables
        const META_ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN
        const META_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID
        const META_API_VERSION = process.env.META_WHATSAPP_API_VERSION || 'v18.0'

        if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
            // Fallback: Log to console (simulated sending)
            console.log('---------------------------------------------------')
            console.log('⚠️  Meta WhatsApp Credentials not found. Simulating WhatsApp send.')
            console.log('Debug Info:')
            console.log(`- META_WHATSAPP_ACCESS_TOKEN: ${META_ACCESS_TOKEN ? 'Present' : 'MISSING'}`)
            console.log(`- META_WHATSAPP_PHONE_NUMBER_ID: ${META_PHONE_NUMBER_ID ? 'Present' : 'MISSING'}`)
            console.log(`- META_WHATSAPP_API_VERSION: ${META_API_VERSION}`)
            console.log(`To: ${cleanPhone}`)
            console.log(`Message: ${message}`)
            console.log('---------------------------------------------------')

            return NextResponse.json({
                message: 'WhatsApp simulated (check server console)',
                simulated: true,
                to: cleanPhone
            })
        }

        // Format phone number for Meta API (must include country code with +)
        const formattedTo = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`

        console.log('Sending WhatsApp via Meta Cloud API:', {
            phoneNumberId: META_PHONE_NUMBER_ID,
            to: formattedTo,
            messageLength: message.length
        })

        // Meta WhatsApp Cloud API endpoint
        const metaApiUrl = `https://graph.facebook.com/${META_API_VERSION}/${META_PHONE_NUMBER_ID}/messages`

        // Meta API request payload
        const requestBody = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedTo,
            type: 'text',
            text: {
                preview_url: false, // Set to true if you want to enable link previews
                body: message
            }
        }

        const response = await fetch(metaApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Meta WhatsApp API error:', errorText)
            
            let errorMessage = 'Failed to send WhatsApp message'
            let errorCode = null
            let errorSubcode = null
            
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.error?.message || errorData.error?.error_user_msg || errorMessage
                errorCode = errorData.error?.code
                errorSubcode = errorData.error?.error_subcode
                
                // Provide helpful messages for common errors
                if (errorCode === 100) {
                    errorMessage = 'Invalid parameter. Check phone number format.'
                } else if (errorCode === 190) {
                    errorMessage = 'Invalid or expired access token. Please refresh your access token.'
                } else if (errorCode === 131047) {
                    errorMessage = 'Message failed to send. Recipient may have blocked your number or number is invalid.'
                } else if (errorCode === 131026) {
                    errorMessage = 'Recipient phone number not registered on WhatsApp.'
                } else if (errorCode === 131030) {
                    errorMessage = 'Recipient phone number not in allowed list. Add the number to your Meta Business Suite allowed list or use a verified production number.'
                } else if (errorCode === 131031) {
                    errorMessage = 'Rate limit exceeded. Please wait before sending more messages.'
                } else if (errorCode === 131032) {
                    errorMessage = 'Template message required. You must use an approved message template for this recipient.'
                }
            } catch {
                errorMessage = errorText.substring(0, 200)
            }

            return NextResponse.json(
                { 
                    error: 'Failed to send WhatsApp message', 
                    details: errorMessage,
                    errorCode,
                    errorSubcode,
                    ...(process.env.NODE_ENV === 'development' && {
                        troubleshooting: errorCode === 131030 ? {
                            step1: 'Add recipient to allowed list: Go to Meta Business Suite → WhatsApp → API Setup',
                            step2: 'Click "Manage phone number list" or "Add phone number"',
                            step3: 'Add the recipient phone number (format: 919876543210 without +)',
                            step4: 'For production: Complete business verification to send to any number',
                            step5: 'Note: For test numbers, you can only message numbers in the allowed list',
                            step6: 'Alternative: Use WhatsApp message templates (approved templates can be sent to any number)'
                        } : {
                            step1: 'Verify your Meta WhatsApp Access Token is valid and not expired',
                            step2: 'Check that META_WHATSAPP_PHONE_NUMBER_ID is correct',
                            step3: 'Ensure the recipient number is in correct format (+919876543210 for India)',
                            step4: 'Verify the phone number is registered on WhatsApp',
                            step5: 'Check Meta Business Suite for detailed error logs',
                            step6: 'For testing: Add recipient numbers to allowed list in Meta Business Suite'
                        }
                    })
                },
                { status: response.status }
            )
        }

        const result = await response.json()

        console.log('WhatsApp sent successfully via Meta Cloud API:', {
            messageId: result.messages?.[0]?.id,
            status: 'sent'
        })

        return NextResponse.json({ 
            message: 'WhatsApp sent successfully', 
            id: result.messages?.[0]?.id,
            status: 'sent',
            success: true 
        }, { status: 200 })
    } catch (error: any) {
        console.error('Error sending WhatsApp via Meta Cloud API:', error)
        console.error('Error type:', typeof error)
        console.error('Error constructor:', error?.constructor?.name)
        
        let errorMessage = error.message || 'Unknown error'
        let errorDetails: any = {}

        if (error.response) {
            errorDetails = error.response.data || error.response.body || error.response
            errorMessage = errorDetails.message || errorDetails.error || errorMessage
        }

        // Log full error for debugging
        try {
            console.error('Error details (stringified):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        } catch (e) {
            console.error('Could not stringify error:', e)
        }

        return NextResponse.json(
            { 
                error: 'Failed to send WhatsApp message', 
                details: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { 
                    fullError: errorDetails,
                    errorType: error?.constructor?.name 
                })
            },
            { status: 500 }
        )
    }
}

