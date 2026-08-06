import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:7000';

export async function GET(request: NextRequest) {
  const upstream = new URL('/api/qs-rankings', GO_API_URL);
  request.nextUrl.searchParams.forEach((value: string, key: string) => upstream.searchParams.set(key, value));

  try {
    const response = await fetch(upstream, { cache: 'no-store' });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error('Unable to load QS rankings from Go Engine:', error);
    return NextResponse.json(
      { error: 'QS rankings service is unavailable' },
      { status: 503 },
    );
  }
}
