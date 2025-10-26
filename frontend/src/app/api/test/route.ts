import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🔧 GET Test endpoint hit!');
  return NextResponse.json({
    success: true,
    message: 'GET Test endpoint working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🔧 POST Test endpoint hit!');
  const body = await request.json();
  console.log('🔧 POST Body:', body);
  return NextResponse.json({
    success: true,
    message: 'POST Test endpoint working',
    receivedBody: body,
    timestamp: new Date().toISOString()
  });
}