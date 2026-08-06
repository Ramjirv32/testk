import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:7000';

export async function GET(request: NextRequest) {
  const upstream = new URL('/api/all-universities', GO_API_URL);
  request.nextUrl.searchParams.forEach((value: string, key: string) => upstream.searchParams.set(key, value));
  try {
    const response = await fetch(upstream, { cache: 'no-store' });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error('Unable to load university directory from Go Engine:', error);
    return NextResponse.json({ error: 'University directory service is unavailable' }, { status: 503 });
  }
}
