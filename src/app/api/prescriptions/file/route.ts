import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase admin configuration");
    }

    // Extract the filename from the end of the public URL
    // e.g. https://.../storage/v1/object/public/prescriptions/fileName.png
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate a short-lived signed URL (60 seconds)
    const { data, error } = await supabaseAdmin.storage
      .from('prescriptions')
      .createSignedUrl(fileName, 60);

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed URL:", error);
      return NextResponse.json({ error: "Failed to access file" }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);

  } catch (error: any) {
    console.error("Prescription file access error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
