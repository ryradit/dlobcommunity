import { NextRequest, NextResponse } from 'next/server';
import { PaymentDuplicateDetector } from '@/lib/services/paymentDuplicateDetector';

// POST - Run duplicate detection and cleanup
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Manual duplicate cleanup requested');
    const body = await request.json();
    
    const {
      memberId,
      dryRun = false,
      systemWide = false
    } = body;

    if (systemWide) {
      // Run system-wide cleanup
      console.log(`🔄 Running ${dryRun ? 'dry run' : 'cleanup'} system-wide...`);
      const result = await PaymentDuplicateDetector.systemWideCleanup(dryRun);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: result.message
      });
    } else if (memberId) {
      // Run cleanup for specific member
      console.log(`🔄 Running cleanup for member: ${memberId}`);
      const result = await PaymentDuplicateDetector.detectAndResolveDuplicates(memberId);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing memberId or systemWide parameter'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Duplicate cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Check for duplicates without removing them
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const systemWide = searchParams.get('systemWide') === 'true';

    if (systemWide) {
      // Check system-wide duplicates (dry run)
      const result = await PaymentDuplicateDetector.systemWideCleanup(true);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Found ${result.totalDuplicatesFound} members with duplicates`
      });
    } else if (memberId) {
      // Check specific member duplicates
      const result = await PaymentDuplicateDetector.detectAndResolveDuplicates(memberId);
      
      return NextResponse.json({
        success: true,
        data: {
          duplicatesFound: result.duplicatesFound,
          duplicateCount: result.duplicatesRemoved, // This would be the count if we removed them
          message: result.message
        },
        message: result.duplicatesFound 
          ? `Member has ${result.duplicatesRemoved} potential duplicates`
          : 'No duplicates found'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Missing memberId or systemWide parameter'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Duplicate check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}