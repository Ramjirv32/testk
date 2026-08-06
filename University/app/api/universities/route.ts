import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const filters = await request.json();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/all-colleges`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Go API');
    }

    const data = await response.json();

    const itemsPerPage = 10;
    const startIndex = (parseInt(page) - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return NextResponse.json({
      universities: {
        data: paginatedData,
        current_page: parseInt(page),
        last_page: Math.ceil(data.length / itemsPerPage),
        total: data.length,
      }
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const search = searchParams.get('search') || '';

    const apiUrl = search
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(search)}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/all-colleges`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Go API');
    }

    const data = await response.json();

    const itemsPerPage = 10;
    const startIndex = (parseInt(page) - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return NextResponse.json({
      universities: {
        data: paginatedData,
        current_page: parseInt(page),
        last_page: Math.ceil(data.length / itemsPerPage),
        total: data.length,
      }
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}