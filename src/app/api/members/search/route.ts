import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Simple fuzzy matching function
function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  
  // Levenshtein distance based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  
  if (longerLength === 0) return 100;
  
  const editDistance = getEditDistance(longer, shorter);
  return Math.round(((longerLength - editDistance) / longerLength) * 100);
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nama diperlukan' },
        { status: 400 }
      );
    }

    // Fetch all members
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data member', details: error.message },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        exactMatch: null,
        suggestions: [],
        isExactMatch: false,
      });
    }

    // Find exact match
    const exactMatch = members.find(
      (m) => m.full_name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (exactMatch) {
      return NextResponse.json({
        exactMatch: {
          id: exactMatch.id,
          name: exactMatch.full_name,
          email: exactMatch.email,
        },
        suggestions: [],
        isExactMatch: true,
      });
    }

    // Find fuzzy matches
    const scoredMembers = members
      .map((member) => ({
        id: member.id,
        name: member.full_name,
        email: member.email,
        similarity: fuzzyMatch(member.full_name, name),
      }))
      .filter((m) => m.similarity >= 50) // Minimum 50% similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 suggestions

    return NextResponse.json({
      exactMatch: null,
      suggestions: scoredMembers,
      isExactMatch: false,
    });
  } catch (error) {
    console.error('Member search error:', error);
    return NextResponse.json(
      { 
        error: 'Gagal mencari member', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
