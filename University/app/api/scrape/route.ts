import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeName = searchParams.get('college');
    const country = searchParams.get('country');

    if (!collegeName) {
      return NextResponse.json(
        { error: 'College name is required' },
        { status: 400 }
      );
    }

    // Forward request to Go backend
    const backendUrl = process.env.NEXT_PUBLIC_GO_API_URL || 'https://api.cloudlab.works';
    const response = await fetch(`${backendUrl}/api/college-statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        college_name: collegeName,
        country: country || 'Unknown'
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape college data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { college_name, country } = body;

    if (!college_name) {
      return NextResponse.json(
        { error: 'College name is required' },
        { status: 400 }
      );
    }

    // Forward request to Go backend
    const backendUrl = process.env.NEXT_PUBLIC_GO_API_URL || 'https://api.cloudlab.works';
    const response = await fetch(`${backendUrl}/api/college-statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        college_name,
        country: country || 'Unknown'
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape college data' },
      { status: 500 }
    );
  }
}