import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    const response = NextResponse.json({ success: true });

    if (action === 'login') {
      // Set a generic http-only cookie to indicate the user is logged into the CRM
      response.cookies.set({
        name: 'crm-auth-session',
        value: 'true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    } else if (action === 'logout') {
      response.cookies.delete('crm-auth-session');
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage session' }, { status: 500 });
  }
}
