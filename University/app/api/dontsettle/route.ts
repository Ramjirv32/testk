import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.NEXT_PUBLIC_GO_API_URL || 'https://api.cloudlab.works';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';

    try {
        const response = await fetch(`${GO_API_URL}/api/dontsettle/data?page=${page}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching Don\'t Settle data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch universities' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';

    try {
        const filters = await request.json();

        const response = await fetch(`${GO_API_URL}/api/dontsettle/data?page=${page}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching filtered Don\'t Settle data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch universities' },
            { status: 500 }
        );
    }
}
