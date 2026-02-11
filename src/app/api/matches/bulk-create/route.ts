import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface MatchInput {
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  court_number: string;
  shuttlecock_amount: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { matches, matchDate } = await request.json();

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { error: 'Data pertandingan diperlukan' },
        { status: 400 }
      );
    }

    if (!matchDate) {
      return NextResponse.json(
        { error: 'Tanggal pertandingan diperlukan' },
        { status: 400 }
      );
    }

    const selectedDate = new Date(matchDate);
    if (selectedDate.getDay() !== 6) {
      return NextResponse.json(
        { error: 'Tanggal harus hari Sabtu' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match: MatchInput = matches[i];
      
      try {
        // Get player names and trim whitespace
        const playerNames = [
          match.team1_player1,
          match.team1_player2,
          match.team2_player1,
          match.team2_player2
        ]
          .filter(name => name && name.trim() !== '')
          .map(name => name.trim());

        if (playerNames.length !== 4) {
          errors.push(`Pertandingan #${i + 1}: tidak lengkap 4 pemain`);
          errorCount++;
          continue;
        }

        console.log(`Processing match #${i + 1}, players:`, playerNames);

        // Validate that all player names exist in profiles table
        const profilePromises = playerNames.map(name => 
          supabase
            .from('profiles')
            .select('id, full_name')
            .ilike('full_name', name)
            .single()
        );

        const profileResults = await Promise.all(profilePromises);
        
        // Check for errors
        const profileErrors = profileResults.filter(r => r.error);
        if (profileErrors.length > 0) {
          console.error('Error fetching profiles:', profileErrors.map((r, idx) => ({
            name: playerNames[idx],
            error: r.error
          })));
          const missingNames = profileErrors.map((r, idx) => playerNames[idx]);
          errors.push(`Pertandingan #${i + 1}: Pemain tidak ditemukan di database: ${missingNames.join(', ')}`);
          errorCount++;
          continue;
        }

        const profiles = profileResults
          .filter(r => r.data)
          .map(r => r.data!);

        if (!profiles || profiles.length !== 4) {
          const foundNames = profiles.map(m => m.full_name).join(', ');
          const missingNames = playerNames.filter(name => !profiles.find(m => m.full_name === name));
          errors.push(`Pertandingan #${i + 1}: hanya ditemukan ${profiles?.length || 0}/4 pemain. Pemain tidak ditemukan: ${missingNames.join(', ')}`);
          errorCount++;
          continue;
        }

        // Calculate costs
        const costPerShuttlecock = 12000;
        const totalCost = parseInt(match.shuttlecock_amount) * costPerShuttlecock;
        const costPerMember = totalCost / 4;

        // Get match month and year to check memberships
        const matchDateObj = new Date(matchDate);
        const matchMonth = matchDateObj.getMonth() + 1;
        const matchYear = matchDateObj.getFullYear();

        // Check active memberships for this month
        const { data: activeMemberships } = await supabase
          .from('memberships')
          .select('member_name')
          .eq('month', matchMonth)
          .eq('year', matchYear)
          .eq('payment_status', 'paid');

        const membershipSet = new Set(
          (activeMemberships || []).map(m => m.member_name.toLowerCase().trim())
        );

        // Create match
        const { data: createdMatch, error: matchError } = await supabase
          .from('matches')
          .insert({
            shuttlecock_count: parseInt(match.shuttlecock_amount) || 4,
            match_date: matchDateObj.toISOString(),
          })
          .select()
          .single();

        if (matchError || !createdMatch) {
          console.error('Error creating match:', matchError);
          errors.push(`Pertandingan #${i + 1}: gagal buat match - ${matchError?.message}`);
          errorCount++;
          continue;
        }

        // Create match_members entries with proper cost calculations
        // Use validated profile full_names (not extracted names) to ensure exact match with user accounts
        const matchMembers = profiles.map(profile => {
          const hasMembership = membershipSet.has(profile.full_name.toLowerCase().trim());
          const attendanceFee = hasMembership ? 0 : 18000;
          
          return {
            match_id: createdMatch.id,
            member_name: profile.full_name,
            amount_due: costPerMember,
            attendance_fee: attendanceFee,
            has_membership: hasMembership,
            payment_status: 'pending',
          };
        });

        const { error: memberLinkError } = await supabase
          .from('match_members')
          .insert(matchMembers);

        if (memberLinkError) {
          console.error('Error linking members:', memberLinkError);
          errors.push(`Pertandingan #${i + 1}: gagal link member - ${memberLinkError.message}`);
          errorCount++;
          continue;
        }

        successCount++;
      } catch (err) {
        console.error(`Error processing match #${i + 1}:`, err);
        errors.push(`Pertandingan #${i + 1}: ${err instanceof Error ? err.message : 'unknown error'}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors,
      message: `Berhasil menyimpan ${successCount} pertandingan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal menyimpan pertandingan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
