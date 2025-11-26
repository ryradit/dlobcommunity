import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('OCR API called - Processing match note...');

    // Get the form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // For now, we'll return mock extracted data
    // In production, this would use Gemini Vision API to process the image
    const mockExtractedData = {
      date: new Date().toISOString().split('T')[0], // Today's date
      time: "10:00",
      fieldNumber: 1,
      team1: {
        player1: "Player A",
        player2: "Player B",
        score: 21
      },
      team2: {
        player1: "Player C", 
        player2: "Player D",
        score: 19
      },
      shuttlecockCount: 3
    };

    console.log('Mock OCR data extracted:', mockExtractedData);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      extractedData: mockExtractedData,
      message: 'Match note processed successfully (mock data)'
    });

  } catch (error) {
    console.error('Error processing match note:', error);
    return NextResponse.json(
      { error: 'Failed to process match note' },
      { status: 500 }
    );
  }
}