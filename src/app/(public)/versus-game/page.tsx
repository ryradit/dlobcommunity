'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Swords, Trophy, Users, Sparkles, Zap, TrendingUp, Target, Brain } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Member {
  name: string;
  image: string;
  stats: {
    power: number;
    agility: number;
    technique: number;
    stamina: number;
  };
  realStats?: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    avgScore: number;
  };
}

interface Team {
  players: Member[];
  name: string;
  totalPower: number;
}

// All available members from the folder
const ALL_MEMBERS = [
  'abdul', 'adi', 'adit', 'alex', 'anthony', 'ardo', 'aren', 'arifin', 
  'bagas', 'bibit', 'danif', 'dedi', 'dimas', 'dinda', 'edi', 'eka', 
  'fanis', 'ganex', 'gavin', 'hendi', 'herdan', 'herry', 'iyan', 
  'jonathan', 'kiki', 'lorenzo', 'mario', 'murdi', 'northon', 'rara', 
  'reyza', 'tian2', 'uti', 'wahyu', 'wien', 'wiwin', 'yaya', 'yogie', 'zaka'
];

// Fetch real stats from Supabase for a member
async function fetchRealMemberStats(memberName: string) {
  try {
    // Fetch all matches for this member
    const { data: matchMembers } = await supabase
      .from('match_members')
      .select('match_id, member_name, score')
      .eq('member_name', memberName)
      .limit(100);

    if (!matchMembers || matchMembers.length === 0) return null;

    // Fetch match details
    const matchIds = [...new Set(matchMembers.map(m => m.match_id))];
    const { data: matches } = await supabase
      .from('matches')
      .select('id, winner_team')
      .in('id', matchIds);

    if (!matches) return null;

    // Build winner map
    const winnerMap = new Map(matches.map(m => [m.id, m.winner_team]));

    // Calculate stats
    let totalMatches = 0;
    let wins = 0;
    let totalScore = 0;

    for (const mm of matchMembers) {
      totalMatches++;
      totalScore += mm.score || 0;
      
      const winnerTeam = winnerMap.get(mm.match_id);
      // Check if member was in winning team (approximate by checking if majority of team members won)
      if (winnerTeam) wins++;
    }

    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const avgScore = totalMatches > 0 ? Math.round((totalScore / totalMatches) * 10) / 10 : 0;

    return {
      totalMatches,
      wins,
      losses,
      winRate: Math.round(winRate),
      avgScore,
    };
  } catch (error) {
    console.error('Error fetching real stats:', error);
    return null;
  }
}

// Convert real stats to game stats (power, agility, technique, stamina)
function convertRealStatsToGameStats(realStats: { totalMatches: number; wins: number; losses: number; winRate: number; avgScore: number }): { power: number; agility: number; technique: number; stamina: number } {
  // Power = based on win rate (higher win rate = more power)
  const power = Math.round(60 + (realStats.winRate / 100) * 35); // 60-95
  
  // Agility = based on match frequency (more matches = better agility/conditioning)
  const agility = Math.round(60 + Math.min((realStats.totalMatches / 30) * 35, 35)); // 60-95
  
  // Technique = based on average score (higher avg score = better technique)
  const technique = Math.round(60 + (realStats.avgScore / 21) * 35); // 60-95, assuming max 21-point game
  
  // Stamina = based on recent activity (assuming recent matches = good stamina)
  const stamina = Math.round(60 + (realStats.wins / Math.max(realStats.totalMatches, 1)) * 35); // 60-95

  return { power, agility, technique, stamina };
}

export default function VersusGamePage() {
  const router = useRouter();
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [winner, setWinner] = useState<Team | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scores, setScores] = useState({ teamA: 0, teamB: 0 });
  const [aiPrediction, setAiPrediction] = useState<{ winner: string; confidence: number; reason: string } | null>(null);
  const [commentary, setCommentary] = useState<string[]>([]);
  const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);

  // Auto-hide prediction after 5 seconds
  useEffect(() => {
    if (aiPrediction && showPrediction) {
      const timer = setTimeout(() => {
        setShowPrediction(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [aiPrediction, showPrediction]);

  // Generate random stats for a member (with Supabase fallback)
  const generateMemberStats = async (name: string): Promise<Member> => {
    // Try to fetch real stats from Supabase
    const realStats = await fetchRealMemberStats(name);
    
    if (realStats && realStats.totalMatches > 0) {
      // Use real stats converted to game stats
      const gameStats = convertRealStatsToGameStats(realStats);
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        image: `/images/members/${name}.jpg`,
        stats: gameStats,
        realStats,
      };
    }
    
    // Fallback: Use seeded random stats for members with no match data
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min: number, max: number, index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return Math.floor(min + (x - Math.floor(x)) * (max - min));
    };

    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      image: `/images/members/${name}.jpg`,
      stats: {
        power: random(60, 95, 1),
        agility: random(60, 95, 2),
        technique: random(60, 95, 3),
        stamina: random(60, 95, 4),
      },
    };
  };

  // Generate random teams
  const generateRandomTeams = async () => {
    setIsGeneratingTeams(true);
    setCommentary([]);
    setAiPrediction(null);
    
    // Shuffle and pick 4 random members
    const shuffled = [...ALL_MEMBERS].sort(() => Math.random() - 0.5);
    const selectedMembers = shuffled.slice(0, 4);
    
    // Fetch stats for all selected members (async)
    const members = await Promise.all(selectedMembers.map(m => generateMemberStats(m)));
    
    const newTeamA: Team = {
      players: [members[0], members[1]],
      name: 'Tim Alpha',
      totalPower: 0,
    };
    
    const newTeamB: Team = {
      players: [members[2], members[3]],
      name: 'Tim Beta',
      totalPower: 0,
    };
    
    // Calculate total power
    newTeamA.totalPower = newTeamA.players.reduce((sum, p) => 
      sum + p.stats.power + p.stats.agility + p.stats.technique + p.stats.stamina, 0);
    newTeamB.totalPower = newTeamB.players.reduce((sum, p) => 
      sum + p.stats.power + p.stats.agility + p.stats.technique + p.stats.stamina, 0);
    
    setTeamA(newTeamA);
    setTeamB(newTeamB);
    
    // Generate AI prediction
    await generateAIPrediction(newTeamA, newTeamB);
    
    setIsGeneratingTeams(false);
    
    // Show prediction with animation
    setTimeout(() => {
      setShowPrediction(true);
    }, 500);
  };

  // Generate AI prediction using OpenAI-style API with real data
  const generateAIPrediction = async (teamA: Team, teamB: Team) => {
    try {
      // Build player stats details including real data
      const buildPlayerInfo = (player: Member): string => {
        let info = `${player.name}: Power ${player.stats.power}, Agility ${player.stats.agility}, Technique ${player.stats.technique}, Stamina ${player.stats.stamina}`;
        if (player.realStats) {
          info += ` (Real Data: ${player.realStats.totalMatches} matches, ${player.realStats.wins}W-${player.realStats.losses}L, ${player.realStats.winRate}% win rate, ${player.realStats.avgScore} avg score)`;
        }
        return info;
      };

      const prompt = `You are a professional badminton match analyst. Analyze this 2v2 doubles match and provide a prediction based on player statistics and match history data.

Team Alpha:
- ${buildPlayerInfo(teamA.players[0])}
- ${buildPlayerInfo(teamA.players[1])}
Total Team Power: ${teamA.totalPower}

Team Beta:
- ${buildPlayerInfo(teamB.players[0])}
- ${buildPlayerInfo(teamB.players[1])}
Total Team Power: ${teamB.totalPower}

Provide your prediction in this exact JSON format:
{
  "winner": "Team Alpha" or "Team Beta",
  "confidence": 55-95 (percentage),
  "reason": "Brief 1-2 sentence analysis focusing on key strengths. If using real match data, mention specific stats like win rates and match experience."
}`;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: prompt,
          systemPrompt: "You are a badminton analyst. Analyze team compositions based on provided statistics. Always respond with valid JSON only, no additional text."
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const parsed = JSON.parse(data.reply);
          setAiPrediction(parsed);
          return;
        } catch (e) {
          console.error('Failed to parse AI response:', data.reply);
        }
      }
    } catch (error) {
      console.error('AI prediction error:', error);
    }
    
    // Enhanced fallback prediction with better confidence calculation
    const stronger = teamA.totalPower > teamB.totalPower ? teamA : teamB;
    const weaker = teamA.totalPower > teamB.totalPower ? teamB : teamA;
    const diff = Math.abs(teamA.totalPower - teamB.totalPower);
    const percentDiff = (diff / weaker.totalPower) * 100;
    
    // Better confidence scaling: larger stat difference = higher confidence
    let confidence = 55;
    if (percentDiff < 5) confidence = 55 + percentDiff * 1;
    else if (percentDiff < 10) confidence = 60 + (percentDiff - 5) * 2;
    else if (percentDiff < 20) confidence = 70 + (percentDiff - 10) * 1.5;
    else confidence = Math.min(95, 85 + (percentDiff - 20) * 0.5);
    
    confidence = Math.round(confidence);
    
    // Check if teams have real data
    const hasRealData = stronger.players.some(p => p.realStats && p.realStats.totalMatches > 0);
    
    setAiPrediction({
      winner: stronger.name,
      confidence,
      reason: hasRealData 
        ? `${stronger.name} memiliki statistik keseluruhan ${Math.round(percentDiff)}% lebih tinggi berdasarkan data pertandingan aktual. Tim ini menunjukkan pengalaman dan performa superior.`
        : `${stronger.name} memiliki statistik keseluruhan ${Math.round(percentDiff)}% lebih tinggi dengan komposisi tim yang lebih unggul.`,
    });
  };

  const startMatch = async () => {
    if (!teamA || !teamB) return;
    
    setIsPlaying(true);
    setWinner(null);
    setScores({ teamA: 0, teamB: 0 });
    setCommentary(['Pertandingan dimulai! Kedua tim terlihat siap!']);
    
    // Simulate match with enhanced stats-based probability
    let scoreA = 0;
    let scoreB = 0;
    const newCommentary: string[] = ['Pertandingan dimulai! Kedua tim terlihat siap!'];
    
    const commentaryTemplates = [
      (team: string) => `Rally yang hebat! ${team} mencetak poin!`,
      (team: string) => `Smash yang kuat dari ${team}!`,
      (team: string) => `Pertahanan luar biasa dari ${team}!`,
      (team: string) => `${team} dengan pukulan dropshot sempurna!`,
      (team: string) => `${team} mendominasi di depan net!`,
    ];
    
    const interval = setInterval(async () => {
      // Enhanced probability calculation with exponential scaling
      // This makes stat advantages matter more
      const totalPower = teamA.totalPower + teamB.totalPower;
      const baseProb = teamA.totalPower / totalPower;
      
      // Apply exponential scaling to amplify differences
      // This makes the stronger team more likely to win while still allowing upsets
      const scalingFactor = 2.5;
      const scaledProbA = Math.pow(baseProb, 1 / scalingFactor);
      const scaledProbB = Math.pow(1 - baseProb, 1 / scalingFactor);
      const normalizedProbA = scaledProbA / (scaledProbA + scaledProbB);
      
      const point = Math.random() < normalizedProbA ? 'teamA' : 'teamB';
      
      if (point === 'teamA') {
        scoreA++;
        const comment = commentaryTemplates[Math.floor(Math.random() * commentaryTemplates.length)](teamA.name);
        newCommentary.push(comment);
      } else {
        scoreB++;
        const comment = commentaryTemplates[Math.floor(Math.random() * commentaryTemplates.length)](teamB.name);
        newCommentary.push(comment);
      }
      
      setScores({ teamA: scoreA, teamB: scoreB });
      setCommentary([...newCommentary]);
      
      // Match ends at 21
      if (scoreA >= 21 || scoreB >= 21) {
        clearInterval(interval);
        const winningTeam = scoreA > scoreB ? teamA : teamB;
        setWinner(winningTeam);
        setIsPlaying(false);
        
        newCommentary.push(`🎉 ${winningTeam.name} memenangkan pertandingan! Penampilan yang luar biasa!`);
        setCommentary([...newCommentary]);
      }
    }, 400);
  };

  const resetGame = () => {
    setTeamA(null);
    setTeamB(null);
    setWinner(null);
    setScores({ teamA: 0, teamB: 0 });
    setIsPlaying(false);
    setCommentary([]);
    setAiPrediction(null);
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
      `}</style>
      
    <div className="min-h-screen bg-gradient-to-b from-green-700 via-green-600 to-green-700 relative overflow-hidden">
      {/* Badminton Court Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Outer court area - green/olive background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-green-800"></div>
        
        {/* Main court surface - blue */}
        <div className="absolute inset-x-[10%] inset-y-[8%] bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-2xl">
          {/* Court border - white thick line */}
          <div className="absolute inset-0 border-4 border-white/90"></div>
          
          {/* Center net line - vertical */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white/90 z-10"></div>
          
          {/* Left service box lines */}
          <div className="absolute top-[15%] bottom-[15%] left-[20%] w-1 bg-white/80"></div>
          <div className="absolute top-[15%] left-0 right-1/2 h-1 bg-white/80"></div>
          <div className="absolute bottom-[15%] left-0 right-1/2 h-1 bg-white/80"></div>
          
          {/* Right service box lines */}
          <div className="absolute top-[15%] bottom-[15%] right-[20%] w-1 bg-white/80"></div>
          <div className="absolute top-[15%] left-1/2 right-0 h-1 bg-white/80"></div>
          <div className="absolute bottom-[15%] left-1/2 right-0 h-1 bg-white/80"></div>
          
          {/* Left side court line */}
          <div className="absolute top-0 bottom-0 left-[20%] w-1 bg-white/70"></div>
          
          {/* Right side court line */}
          <div className="absolute top-0 bottom-0 right-[20%] w-1 bg-white/70"></div>
          
          {/* Top singles sideline */}
          <div className="absolute top-[15%] left-0 right-0 h-1 bg-white/70"></div>
          
          {/* Bottom singles sideline */}
          <div className="absolute bottom-[15%] left-0 right-0 h-1 bg-white/70"></div>
          
          {/* Shuttlecock (optional decorative element) */}
          <div className="absolute bottom-[25%] right-[30%] w-3 h-3 bg-yellow-300 rounded-full shadow-md animate-bounce" style={{ animationDuration: '2s' }}></div>
        </div>
        
        {/* Court shadow/depth */}
        <div className="absolute inset-x-[10%] inset-y-[8%] bg-black/10 blur-sm translate-y-1"></div>
        
        {/* Ambient lighting effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => router.push('/beranda#gallery')}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 group"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-screen">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 bg-white/5 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <Swords className="w-8 sm:w-12 h-8 sm:h-12 text-yellow-300/50 animate-bounce drop-shadow-lg" />
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-yellow-300/60 via-yellow-400/60 to-amber-500/60 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                PERTANDINGAN 2v2
              </span>
            </h1>
            <Swords className="hidden sm:block w-12 h-12 text-yellow-300/50 animate-bounce drop-shadow-lg" style={{ animationDelay: '0.2s' }} />
          </div>
          <p className="text-sm sm:text-xl text-white/40 font-light drop-shadow-2xl bg-black/10 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/10">Arena Pertandingan Anggota DLOB</p>
          <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
            <Brain className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400/60" />
            <span className="text-white/50 text-xs sm:text-sm font-semibold">Analisis Pertandingan Berbasis AI</span>
          </div>
        </div>

        {!teamA || !teamB ? (
          // Team Generation Screen
          <div className="max-w-2xl mx-auto">
            <div className="bg-black/20 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-12">
              <div className="text-center space-y-4 sm:space-y-6">
                <Users className="w-16 sm:w-24 h-16 sm:h-24 text-yellow-300/50 mx-auto animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white/70 drop-shadow-lg">Siap Bertanding?</h2>
                <p className="text-green-100/60 text-base sm:text-lg">
                  AI akan memilih secara acak 4 anggota DLOB dan membuat dua tim seimbang untuk pertandingan ganda 2v2 yang seru!
                </p>
                <button
                  onClick={generateRandomTeams}
                  disabled={isGeneratingTeams}
                  className="w-full py-5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 text-white font-bold text-xl rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  {isGeneratingTeams ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-spin" />
                      Membuat Tim...
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      Buat Pertandingan Acak
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : !isPlaying && !winner ? (
          // Pre-Match Screen with Teams & AI Prediction
          <div className="space-y-6">
            {/* Teams Display - Pokemon Card Style */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 max-w-7xl mx-auto items-start">
              {/* Team A - Left Side */}
              <div className="space-y-4 relative">
                {teamA.players.map((player, idx) => (
                  <div key={idx} className={idx === 0 ? "md:-ml-12 md:-mt-8" : idx === 1 ? "md:ml-8 md:mt-8" : ""}>
                    <PokemonCard player={player} color="emerald" />
                  </div>
                ))}
                
                {/* AI Prediction Pop-up for Team A */}
                {aiPrediction && aiPrediction.winner === teamA.name && showPrediction && (
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full max-w-md animate-slide-down z-50">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 shadow-2xl border-4 border-yellow-300">
                      <div className="flex items-start gap-3">
                        <Brain className="w-6 h-6 text-gray-800 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-gray-900 font-bold text-sm mb-1">
                            🤖 AI memprediksi {aiPrediction.winner} menang!
                          </p>
                          <p className="text-gray-800 text-xs">
                            Keyakinan: <span className="font-bold">{aiPrediction.confidence}%</span>
                          </p>
                          <p className="text-gray-700 text-xs italic mt-1">{aiPrediction.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VS in Center - Small Text Only */}
              <div className="flex flex-col items-center justify-center pt-4 md:pt-32">
                <Swords className="w-10 sm:w-12 h-10 sm:h-12 text-yellow-300/40 mb-2 animate-pulse" />
                <p className="text-white/50 font-bold text-2xl sm:text-3xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">VS</p>
                <button
                  onClick={startMatch}
                  className="mt-4 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 hover:from-yellow-500/40 hover:to-orange-600/40 text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg backdrop-blur-sm border border-yellow-300/20"
                >
                  MULAI! ⚡
                </button>
                <button
                  onClick={resetGame}
                  className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white/60 text-xs sm:text-sm rounded-lg transition-all border border-white/10"
                >
                  Tim Baru
                </button>
              </div>

              {/* Team B - Right Side */}
              <div className="space-y-4 relative">
                {teamB.players.map((player, idx) => (
                  <div key={idx} className={idx === 0 ? "md:-mr-12 md:-mt-8" : idx === 1 ? "md:mr-8 md:mt-8" : ""}>
                    <PokemonCard player={player} color="teal" />
                  </div>
                ))}
                
                {/* AI Prediction Pop-up for Team B */}
                {aiPrediction && aiPrediction.winner === teamB.name && showPrediction && (
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full max-w-md animate-slide-down z-50">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 shadow-2xl border-4 border-yellow-300">
                      <div className="flex items-start gap-3">
                        <Brain className="w-6 h-6 text-gray-800 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-gray-900 font-bold text-sm mb-1">
                            🤖 AI memprediksi {aiPrediction.winner} menang!
                          </p>
                          <p className="text-gray-800 text-xs">
                            Keyakinan: <span className="font-bold">{aiPrediction.confidence}%</span>
                          </p>
                          <p className="text-gray-700 text-xs italic mt-1">{aiPrediction.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isPlaying ? (
          // Match In Progress
          <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
            {/* Live Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 items-center">
              <ScoreCard team={teamA} score={scores.teamA} color="purple" />
              
              <div className="text-center order-first md:order-none">
                <div className="bg-white/5 rounded-2xl p-3 sm:p-6 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Swords className="w-12 sm:w-16 h-12 sm:h-16 text-yellow-300/40 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
                  <p className="text-white/50 font-bold text-base sm:text-xl mt-2">PERTANDINGAN LANGSUNG</p>
                </div>
              </div>

              <ScoreCard team={teamB} score={scores.teamB} color="blue" />
            </div>

            {/* Live Commentary */}
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 p-3 sm:p-6 max-h-48 sm:max-h-64 overflow-y-auto shadow-xl">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400" />
                Komentar Langsung
              </h3>
              <div className="space-y-2">
                {commentary.slice(-5).reverse().map((comment, idx) => (
                  <div key={idx} className="text-green-100 text-xs sm:text-sm animate-fade-in">
                    • {comment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Winner Screen
          <div className="space-y-4 sm:space-y-8 max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-12 text-center">
              <div className="animate-bounce mb-4 sm:mb-6">
                <Trophy className="w-20 sm:w-32 h-20 sm:h-32 text-yellow-400 mx-auto" />
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">
                🎉 {winner?.name} MENANG! 🎉
              </h2>
              
              <p className="text-2xl sm:text-3xl text-green-100 mb-6 sm:mb-8">
                Skor Akhir: {scores.teamA} - {scores.teamB}
              </p>

              {/* Winner Team Display */}
              <div className="mb-6 sm:mb-8">
                <TeamCard team={winner!} color={winner === teamA ? 'purple' : 'blue'} compact />
              </div>

              {/* AI Accuracy */}
              {aiPrediction && (
                <div className={`mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl ${
                  aiPrediction.winner === winner?.name 
                    ? 'bg-green-500/20 border border-green-400/50' 
                    : 'bg-red-500/20 border border-red-400/50'
                }`}>
                  <p className="text-white font-semibold text-sm sm:text-base">
                    {aiPrediction.winner === winner?.name 
                      ? '✅ Prediksi AI BENAR!' 
                      : '❌ Prediksi AI SALAH!'}
                  </p>
                  <p className="text-xs sm:text-sm text-green-100 mt-1">
                    AI memprediksi {aiPrediction.winner} dengan keyakinan {aiPrediction.confidence}%
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={resetGame}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-base sm:text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Pertandingan Baru
                </button>
                <button
                  onClick={() => router.push('/beranda#gallery')}
                  className="w-full py-3 sm:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-base sm:text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 border border-white/30"
                >
                  Kembali ke Galeri
                </button>
              </div>
            </div>

            {/* Match Summary */}
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">📊 Ringkasan Pertandingan</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commentary.map((comment, idx) => (
                  <div key={idx} className="text-green-100 text-sm">
                    • {comment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Easter Egg Message */}
        <p className="mt-8 text-green-200/30 text-sm text-center italic drop-shadow-lg">
          🎮 Kamu menemukan game rahasia! Bagikan ini dengan teman DLOB-mu! 🎮
        </p>
      </div>
    </div>
    </>
  );
}

// Pokemon Card Component
function PokemonCard({ player, color }: { player: Member; color: 'emerald' | 'teal' }) {
  const colorClasses = {
    emerald: {
      gradient: 'from-emerald-400 via-green-400 to-emerald-500',
      border: 'border-emerald-300',
      statBg: 'bg-emerald-600',
      energyBg: 'bg-yellow-400',
    },
    teal: {
      gradient: 'from-teal-400 via-cyan-400 to-teal-500',
      border: 'border-teal-300',
      statBg: 'bg-teal-600',
      energyBg: 'bg-yellow-400',
    },
  };

  const colors = colorClasses[color];
  const totalStats = Object.values(player.stats).reduce((a, b) => a + b, 0);

  return (
    <div className="group relative w-40 sm:w-48 mx-auto">
      {/* Pokemon Card - Portrait Mode */}
      <div className={`relative bg-gradient-to-br ${colors.gradient} rounded-xl p-0.5 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:rotate-1`}>
        <div className="bg-white rounded-lg p-1.5 sm:p-2 h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 truncate">{player.name}</h3>
            <div className="flex gap-0.5">
              <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${colors.energyBg} border border-yellow-600`}></div>
              <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${colors.energyBg} border border-yellow-600`}></div>
            </div>
          </div>

          {/* Image Container - Larger and focused on face */}
          <div className={`relative h-44 sm:h-52 bg-gradient-to-br ${colors.gradient} rounded-lg mb-1.5 sm:mb-2 overflow-hidden border-2 ${colors.border}`}>
            <Image
              src={player.image}
              alt={player.name}
              fill
              className="object-cover object-top scale-125"
              unoptimized
            />
            {/* Holographic effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Type/Category */}
          <div className={`inline-block px-1.5 sm:px-2 py-0.5 ${colors.statBg} text-white text-[9px] sm:text-[10px] font-bold rounded-full mb-1.5 sm:mb-2`}>
            BADMINTON PLAYER
          </div>

          {/* Stats - Compact Grid */}
          <div className="grid grid-cols-2 gap-1 text-[9px] sm:text-[10px]">
            <div className="flex items-center justify-between bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded">
              <span className="font-semibold text-gray-600">POW</span>
              <span className="font-bold text-gray-800">{player.stats.power}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded">
              <span className="font-semibold text-gray-600">AGI</span>
              <span className="font-bold text-gray-800">{player.stats.agility}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded">
              <span className="font-semibold text-gray-600">TEC</span>
              <span className="font-bold text-gray-800">{player.stats.technique}</span>
            </div>
            <div className="flex items-center justify-between bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded">
              <span className="font-semibold text-gray-600">STA</span>
              <span className="font-bold text-gray-800">{player.stats.stamina}</span>
            </div>
          </div>

          {/* Total Stats Footer */}
          <div className="mt-2 pt-1.5 border-t border-gray-300 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-600">TOTAL</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-gray-800">{totalStats}</span>
              <span className="text-[10px] text-gray-500">⭐ {Math.floor(totalStats / 80)}/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
    </div>
  );
}

// Team Card Component (kept for other screens)
function TeamCard({ team, color, compact = false }: { team: Team; color: 'purple' | 'blue'; compact?: boolean }) {
  const colorClasses = {
    purple: {
      bg: 'from-emerald-600/40 to-green-600/40',
      border: 'border-emerald-400/60',
      text: 'text-green-100',
      stat: 'bg-emerald-700/50',
      playerBg: 'bg-emerald-900/30',
    },
    blue: {
      bg: 'from-teal-600/40 to-cyan-600/40',
      border: 'border-teal-400/60',
      text: 'text-cyan-100',
      stat: 'bg-teal-700/50',
      playerBg: 'bg-teal-900/30',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-lg rounded-2xl border-2 ${colors.border} p-3 sm:p-6 transform hover:scale-105 transition-all duration-300 shadow-xl`}>
      <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6">{team.name}</h3>
      
      <div className={`space-y-2 sm:space-y-3 ${compact ? 'max-w-sm mx-auto' : ''}`}>
        {team.players.map((player, idx) => (
          <div key={idx} className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl ${colors.playerBg} border border-white/10`}>
            <div className="relative w-12 sm:w-16 h-12 sm:h-16 rounded-full overflow-hidden border-2 border-white/40 flex-shrink-0 bg-zinc-800">
              <Image
                src={player.image}
                alt={player.name}
                fill
                className="object-cover object-top scale-110"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-bold text-white mb-1">{player.name}</h4>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(player.stats).map(([stat, value]) => (
                  <span key={stat} className="text-[10px] sm:text-xs text-white/80">
                    <span className="text-white/60">{stat}:</span> <span className="font-bold">{value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 text-center">
        <div className="inline-flex items-center gap-2">
          <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-300" />
          <span className="text-white font-bold text-base sm:text-lg">Total: {team.totalPower}</span>
        </div>
      </div>
    </div>
  );
}

// Score Card Component (for live match)
function ScoreCard({ team, score, color }: { team: Team; score: number; color: 'purple' | 'blue' }) {
  const colorClasses = {
    purple: 'from-emerald-600/50 to-green-600/50 border-emerald-400/70',
    blue: 'from-teal-600/50 to-cyan-600/50 border-teal-400/70',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-lg rounded-2xl border-2 p-3 sm:p-6 transform hover:scale-105 transition-transform shadow-xl`}>
      <h3 className="text-base sm:text-xl font-bold text-white text-center mb-2 sm:mb-3">{team.name}</h3>
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        {team.players.map((player, idx) => (
          <div key={idx} className="text-center">
            <div className="relative w-10 sm:w-14 h-10 sm:h-14 rounded-full overflow-hidden border-2 border-white/60 bg-zinc-800 mb-1">
              <Image
                src={player.image}
                alt={player.name}
                fill
                className="object-cover object-top scale-110"
                unoptimized
              />
            </div>
            <p className="text-[10px] sm:text-xs text-white/80">{player.name}</p>
          </div>
        ))}
      </div>
      <p className="text-4xl sm:text-6xl font-bold text-white text-center">{score}</p>
    </div>
  );
}
