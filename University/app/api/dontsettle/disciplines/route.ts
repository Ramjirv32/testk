import { NextRequest, NextResponse } from 'next/server';

const GO_API_URL = process.env.NEXT_PUBLIC_GO_API_URL || 'https://api.cloudlab.works';

export async function GET() {
    try {
        const response = await fetch(`${GO_API_URL}/api/dontsettle/disciplines`, {
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
        console.error('Error fetching disciplines:', error);
        return NextResponse.json(
            { error: 'Failed to fetch disciplines' },
            { status: 500 }
        );
    }
}
