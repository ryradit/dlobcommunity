import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Test endpoint to verify survey system configuration
 * Visit: /api/survey/test
 */
export async function GET() {
  const checks = {
    google_ai_configured: false,
    supabase_configured: false,
    survey_tables_exist: false,
    survey_instance_exists: false,
    details: {} as any
  };

  try {
    // Check Google AI API Key
    checks.google_ai_configured = !!process.env.GEMINI_API_KEY;
    checks.details.google_ai_key_length = process.env.GEMINI_API_KEY?.length || 0;

    // Check Supabase
    checks.supabase_configured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (checks.supabase_configured) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      // Check if survey_instances table exists
      const { data: instances, error: instancesError } = await supabase
        .from('survey_instances')
        .select('id, title, status')
        .limit(5);

      if (!instancesError && instances) {
        checks.survey_tables_exist = true;
        checks.details.survey_instances_count = instances.length;
        checks.details.active_surveys = instances.filter((i: any) => i.status === 'active').length;
        
        // Check if general feedback survey exists
        const feedbackSurvey = instances.find((i: any) => 
          i.title.toLowerCase().includes('feedback')
        );
        checks.survey_instance_exists = !!feedbackSurvey;
        checks.details.feedback_survey = feedbackSurvey || null;
      } else {
        checks.details.database_error = instancesError?.message || 'Unknown error';
      }
    }

    return NextResponse.json({
      status: 'ok',
      checks,
      recommendations: getRecommendations(checks)
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks
    });
  }
}

function getRecommendations(checks: any): string[] {
  const recs: string[] = [];

  if (!checks.google_ai_configured) {
    recs.push('❌ Add GEMINI_API_KEY to .env.local (get from https://aistudio.google.com/app/apikey)');
  } else {
    recs.push('✅ Gemini API Key is configured');
  }

  if (!checks.supabase_configured) {
    recs.push('❌ Configure Supabase environment variables');
  } else {
    recs.push('✅ Supabase is configured');
  }

  if (!checks.survey_tables_exist) {
    recs.push('❌ Run supabase-survey-system.sql in Supabase SQL Editor');
  } else {
    recs.push('✅ Survey tables exist');
  }

  if (!checks.survey_instance_exists) {
    recs.push('❌ No feedback survey found - check if seed data was created');
  } else {
    recs.push('✅ Feedback survey instance exists');
  }

  return recs;
}
