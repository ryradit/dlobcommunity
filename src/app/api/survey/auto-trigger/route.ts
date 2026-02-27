import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Auto-trigger survey after training sessions
 * Called automatically by the system after Saturday night training sessions
 */
export async function POST(request: NextRequest) {
  try {
    const { event_type = 'training_session', event_id = null } = await request.json();

    // Get the appropriate survey template based on event type
    const { data: template, error: templateError } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('type', 'event_feedback')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('No active survey template found:', templateError);
      return NextResponse.json(
        { success: false, error: 'No active survey template configured' },
        { status: 404 }
      );
    }

    // Create survey instance
    const { data: instance, error: instanceError } = await supabase
      .from('survey_instances')
      .insert({
        template_id: template.id,
        title: template.title,
        description: template.description,
        event_id: event_id,
        trigger_type: 'post_event',
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select()
      .single();

    if (instanceError) {
      console.error('Error creating survey instance:', instanceError);
      return NextResponse.json(
        { success: false, error: 'Failed to create survey instance' },
        { status: 500 }
      );
    }

    console.log('✅ Survey auto-triggered:', {
      instanceId: instance.id,
      title: instance.title,
      eventType: event_type,
      expiresAt: instance.expires_at
    });

    return NextResponse.json({
      success: true,
      data: {
        instance_id: instance.id,
        title: instance.title,
        description: instance.description,
        expires_at: instance.expires_at,
        message: 'Survey successfully auto-triggered for members'
      }
    });

  } catch (error) {
    console.error('Error in auto-trigger survey:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for testing/admin use
 * GET /api/survey/auto-trigger?test=true
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isTest = searchParams.get('test') === 'true';

  if (!isTest) {
    return NextResponse.json(
      { error: 'Use POST to trigger surveys or add ?test=true for test trigger' },
      { status: 400 }
    );
  }

  // Trigger test survey
  const response = await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'training_session',
        event_id: null
      })
    })
  );

  return response;
}
