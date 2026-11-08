// Direct-to-YouTube upload endpoint (Studio → YouTube Shorts uploader).
// Streams the video to the YouTube Data API via resumable upload.
import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import { uploadYouTubeVideo } from '@/lib/integrations/youtube';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const clientId = await getSetting('youtube_client_id');
  const clientSecret = await getSetting('youtube_client_secret');
  const refreshToken = await getSetting('youtube_refresh_token');
  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ error: 'YouTube not connected. Go to Connectors → YouTube first.' }, { status: 400 });
  }
  const form = await req.formData();
  const file = form.get('video') as File | null;
  const title = String(form.get('title') || 'Untitled');
  const description = String(form.get('description') || '');
  const tags = String(form.get('tags') || '').split(',').map((t) => t.trim()).filter(Boolean);
  const privacy = (String(form.get('privacy') || 'unlisted') as 'public' | 'unlisted' | 'private');
  if (!file) return NextResponse.json({ error: 'No video file selected.' }, { status: 400 });
  if (file.size > 65 * 1024 * 1024) {
    return NextResponse.json({ error: 'Video too large for direct upload (max 65MB). Use YouTube Studio for bigger files.' }, { status: 400 });
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const id = await uploadYouTubeVideo(clientId, clientSecret, refreshToken, { title, description, tags, privacy }, bytes, file.type || 'video/mp4');
    return NextResponse.json({ ok: true, id, url: `https://youtu.be/${id}` });
  } catch (e: any) {
    return NextResponse.json({ error: (e?.message ?? String(e)).slice(0, 400) }, { status: 500 });
  }
}
