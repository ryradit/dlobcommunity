'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Calendar, 
  Trophy, 
  Clock, 
  MapPin, 
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Play,
  Target
} from 'lucide-react';

// Types
interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  membership_type: string;
}

interface Match {
  id: string;
  date: string;
  time: string;
  field_number: number;
  shuttlecock_count: number;
  status: string;
  participants: MatchParticipant[];
  result?: MatchResult;
}

interface MatchParticipant {
  id: string;
  member_id: string;
  team: 'team1' | 'team2';
  position: 'player1' | 'player2';
  member: Member;
}

interface MatchResult {
  team1_score: number;
  team2_score: number;
  winner_team: 'team1' | 'team2';
  total_games: number;
  game_scores: GameScore[];
}

interface GameScore {
  game_number: number;
  team1_score: number;
  team2_score: number;
}

interface AttendanceCheck {
  member_id: string;
  attended: boolean;
  member: Member;
}

export default function AdminMatchManagementPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'matches' | 'create'>('attendance');
  const [matches, setMatches] = useState<Match[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch real members and set up attendance
  useEffect(() => {
    const fetchMembersAndSetupAttendance = async () => {
      try {
        console.log('📋 Fetching members from API...');
        
        // Fetch all members (including admin for attendance, but we'll filter admin out for match creation)
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();
        
        if (!membersResult.success) {
          throw new Error(membersResult.error || 'Failed to fetch members');
        }

        const allMembers = membersResult.data || [];
        console.log('✅ Members fetched successfully:', allMembers);

        // Check if we got a warning about mock data
        if (membersResult.warning) {
          console.log('⚠️ API Warning:', membersResult.warning);
          // Show user-friendly notification about using mock data
          console.log('🎭 Using mock/demo member data for development');
        } else {
          console.log('✅ Using real member data from Supabase');
        }

        setMembers(allMembers);

        // Create attendance records for all members (default to present for demo/development)
        const attendanceRecords = allMembers.map((member: Member) => ({
          member_id: member.id,
          attended: true, // Default to present for easier testing
          member: member
        }));
        
        setAttendance(attendanceRecords);
        
      } catch (error: any) {
        console.error('❌ Error fetching members:', error);
        
        // Set empty arrays if API fails
        setMembers([]);
        setAttendance([]);
        
        alert(`❌ Error: Could not fetch members from database.\n\nError: ${error.message}\n\nPlease add members first to create matches.`);
      }
    };

    // Fetch real match data from API
    const fetchMatches = async () => {
      try {
        console.log('🏸 Fetching matches from API for date:', selectedDate);
        
        const matchesResponse = await fetch(`/api/matches?date=${selectedDate}`);
        const matchesResult = await matchesResponse.json();
        
        if (!matchesResult.success) {
          throw new Error(matchesResult.error || 'Failed to fetch matches');
        }

        const fetchedMatches = matchesResult.data?.matches || [];
        console.log('✅ Matches fetched successfully:', fetchedMatches);

        // Check if we got a warning about mock data
        if (matchesResult.warning) {
          console.log('⚠️ API Warning:', matchesResult.warning);
          console.log('🎭 Using mock/demo match data for development');
        } else {
          console.log('✅ Using real match data from Supabase');
        }

        // Transform the matches to match our interface if needed
        const transformedMatches = fetchedMatches.map((match: any) => ({
          ...match,
          participants: match.match_participants?.map((mp: any) => ({
            id: mp.id,
            member_id: mp.member_id,
            team: mp.team,
            position: mp.position,
            member: mp.members || mp.member || {
              id: mp.member_id,
              name: 'Unknown Member',
              email: '',
              role: 'member',
              membership_type: 'regular'
            }
          })) || [],
          result: match.match_results?.[0] ? {
            team1_score: match.match_results[0].team1_score,
            team2_score: match.match_results[0].team2_score,
            winner_team: match.match_results[0].winner_team,
            total_games: match.game_scores?.length || 0,
            game_scores: match.game_scores || []
          } : undefined
        }));

        setMatches(transformedMatches);
        
      } catch (error: any) {
        console.error('❌ Error fetching matches:', error);
        // Set empty array if API fails
        setMatches([]);
        console.log('🔍 No matches found or API error - showing empty state');
      }
    };

    fetchMembersAndSetupAttendance().then(() => {
      fetchMatches();
      setLoading(false);
    });
  }, [selectedDate]);

  // Fetch matches when date changes
  useEffect(() => {
    if (!loading) {
      const fetchMatches = async () => {
        try {
          console.log('🏸 Fetching matches from API for date:', selectedDate);
          
          const matchesResponse = await fetch(`/api/matches?date=${selectedDate}`);
          const matchesResult = await matchesResponse.json();
          
          if (!matchesResult.success) {
            throw new Error(matchesResult.error || 'Failed to fetch matches');
          }

          const fetchedMatches = matchesResult.data?.matches || [];
          console.log('✅ Matches fetched successfully:', fetchedMatches);

          // Transform the matches to match our interface
          const transformedMatches = fetchedMatches.map((match: any) => ({
            ...match,
            participants: match.match_participants?.map((mp: any) => ({
              id: mp.id,
              member_id: mp.member_id,
              team: mp.team,
              position: mp.position,
              member: mp.members || mp.member || {
                id: mp.member_id,
                name: 'Unknown Member',
                email: '',
                role: 'member',
                membership_type: 'regular'
              }
            })) || [],
            result: match.match_results?.[0] ? {
              team1_score: match.match_results[0].team1_score,
              team2_score: match.match_results[0].team2_score,
              winner_team: match.match_results[0].winner_team,
              total_games: match.game_scores?.length || 0,
              game_scores: match.game_scores || []
            } : undefined
          }));

          setMatches(transformedMatches);
          
        } catch (error: any) {
          console.error('❌ Error fetching matches:', error);
          setMatches([]);
        }
      };

      fetchMatches();
    }
  }, [selectedDate, loading]);

  const toggleAttendance = (memberId: string) => {
    setAttendance(prev => prev.map(att => 
      att.member_id === memberId 
        ? { ...att, attended: !att.attended }
        : att
    ));
  };

  const attendedMembers = attendance.filter(att => att.attended);
  const attendedNonAdminMembers = attendedMembers.filter(att => att.member.role !== 'admin');
  const totalShuttlecocksUsed = matches.reduce((total, match) => total + match.shuttlecock_count, 0);
  const shuttlecockCostPerMember = totalShuttlecocksUsed * 3000; // Each person pays 3000 per shuttlecock

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Loading match management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="flex items-center text-gray-800 hover:text-gray-900 mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Match Management</h1>
                <p className="text-sm text-gray-800">Manage attendance, matches, and payments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Attendance Check
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              Match Results
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Create Match
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Attendance Check Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Daily Attendance - {new Date(selectedDate).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              
              {/* Attendance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Present</p>
                      <p className="text-2xl font-bold text-green-600">{attendedMembers.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{attendance.length - attendedMembers.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Total Members</p>
                      <p className="text-2xl font-bold text-blue-600">{attendance.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        Membership
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((att) => (
                      <tr key={att.member_id} className={att.attended ? 'bg-green-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {att.member.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{att.member.name}</div>
                              <div className="text-sm text-gray-700">{att.member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            att.member.membership_type === 'premium'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {att.member.membership_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            att.attended
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {att.attended ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => toggleAttendance(att.member_id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              att.attended
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {att.attended ? 'Mark Absent' : 'Mark Present'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Match Results Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Match Results - {new Date(selectedDate).toLocaleDateString('id-ID')}
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-800">
                    Total Shuttlecocks: {totalShuttlecocksUsed}
                  </div>
                  <div className="text-sm text-gray-800">
                    Cost per Member: Rp {shuttlecockCostPerMember.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    (Rp 3,000 × {totalShuttlecocksUsed} shuttlecocks per person)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-800">
                          <Clock className="h-4 w-4 mr-1" />
                          {match.time}
                        </div>
                        <div className="flex items-center text-sm text-gray-800">
                          <MapPin className="h-4 w-4 mr-1" />
                          Field {match.field_number}
                        </div>
                        <div className="flex items-center text-sm text-gray-800">
                          <Target className="h-4 w-4 mr-1" />
                          {match.shuttlecock_count} Shuttlecocks
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {match.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Teams */}
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg border-2 ${
                          match.result?.winner_team === 'team1' 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Team 1</h4>
                            {match.result?.winner_team === 'team1' && (
                              <Trophy className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            {match.participants.filter(p => p.team === 'team1').map(p => (
                              <div key={p.id} className="text-sm text-gray-700">
                                {p.member.name} ({p.position === 'player1' ? 'P1' : 'P2'})
                              </div>
                            ))}
                          </div>
                          {match.result && (
                            <div className="mt-2 text-lg font-bold text-gray-900">
                              Score: {match.result.team1_score}
                            </div>
                          )}
                        </div>

                        <div className={`p-3 rounded-lg border-2 ${
                          match.result?.winner_team === 'team2' 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Team 2</h4>
                            {match.result?.winner_team === 'team2' && (
                              <Trophy className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            {match.participants.filter(p => p.team === 'team2').map(p => (
                              <div key={p.id} className="text-sm text-gray-700">
                                {p.member.name} ({p.position === 'player1' ? 'P1' : 'P2'})
                              </div>
                            ))}
                          </div>
                          {match.result && (
                            <div className="mt-2 text-lg font-bold text-gray-900">
                              Score: {match.result.team2_score}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Game Scores */}
                      {match.result && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Game-by-Game Scores</h4>
                          <div className="space-y-2">
                            {match.result.game_scores.map((game) => (
                              <div key={game.game_number} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-900">Game {game.game_number}</span>
                                <span className="text-sm font-mono text-gray-900">
                                  {game.team1_score} - {game.team2_score}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm text-blue-800">
                              <strong>Winner:</strong> Team {match.result.winner_team === 'team1' ? '1' : '2'}
                            </div>
                            <div className="text-sm text-blue-800">
                              <strong>Final Score:</strong> {match.result.team1_score} - {match.result.team2_score}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {matches.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-800">No matches played on this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Match Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <CreateMatchForm 
              attendedMembers={attendedNonAdminMembers} 
              onMatchCreated={async (match) => {
                // Refresh matches from API instead of just adding to local state
                try {
                  const matchesResponse = await fetch(`/api/matches?date=${selectedDate}`);
                  const matchesResult = await matchesResponse.json();
                  
                  if (matchesResult.success) {
                    const fetchedMatches = matchesResult.data?.matches || [];
                    const transformedMatches = fetchedMatches.map((match: any) => ({
                      ...match,
                      participants: match.match_participants?.map((mp: any) => ({
                        id: mp.id,
                        member_id: mp.member_id,
                        team: mp.team,
                        position: mp.position,
                        member: mp.members || mp.member || {
                          id: mp.member_id,
                          name: 'Unknown Member',
                          email: '',
                          role: 'member',
                          membership_type: 'regular'
                        }
                      })) || [],
                      result: match.match_results?.[0] ? {
                        team1_score: match.match_results[0].team1_score,
                        team2_score: match.match_results[0].team2_score,
                        winner_team: match.match_results[0].winner_team,
                        total_games: match.game_scores?.length || 0,
                        game_scores: match.game_scores || []
                      } : undefined
                    }));
                    setMatches(transformedMatches);
                  } else {
                    // Fallback: add to local state if API fails
                    setMatches(prev => [...prev, match]);
                  }
                } catch (error) {
                  console.error('Error refreshing matches:', error);
                  // Fallback: add to local state if API fails
                  setMatches(prev => [...prev, match]);
                }
                setActiveTab('matches');
              }}
              onMemberAdded={(newMember) => {
                // Add new member to members list
                setMembers(prev => [...prev, newMember]);
                // Add to attendance as present
                const newAttendanceCheck = {
                  member_id: newMember.id,
                  attended: true,
                  member: newMember
                };
                setAttendance(prev => [...prev, newAttendanceCheck]);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Create Match Form Component
function CreateMatchForm({ 
  attendedMembers, 
  onMatchCreated,
  onMemberAdded
}: { 
  attendedMembers: AttendanceCheck[], 
  onMatchCreated: (match: Match) => void,
  onMemberAdded?: (newMember: Member) => void
}) {
  const [formData, setFormData] = useState({
    time: '20:00', // Fixed to 8 PM
    field_number: 1,
    shuttlecock_count: 1,
    team1_player1: '',
    team1_player2: '',
    team2_player1: '',
    team2_player2: '',
    team1_score: 0,
    team2_score: 0,
    game_scores: [{ game_number: 1, team1_score: 0, team2_score: 0 }]
  });

  const [loading, setLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<AttendanceCheck[]>(attendedMembers);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Update available members when attendedMembers changes
  useEffect(() => {
    setAvailableMembers(attendedMembers);
  }, [attendedMembers]);

  // Function to add a new member
  const handleAddNewMember = async () => {
    if (!newMemberName.trim()) {
      alert('Please enter a member name');
      return;
    }

    setAddingMember(true);
    try {
      const memberEmail = newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@dlob.com`;
      
      // Create new member with auth credentials via API
      const memberResponse = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMemberName.trim(),
          email: memberEmail,
          role: 'member',
          membership_type: 'regular',
          createAuth: true, // Flag to create auth credentials
          defaultPassword: 'password123' // Default password for new members
        }),
      });

      const memberResult = await memberResponse.json();
      
      if (!memberResult.success) {
        throw new Error(memberResult.error || 'Failed to create member');
      }

      console.log('✅ New member created:', memberResult.data);
      
      // Add to available members list
      const newMember = memberResult.data;
      const newAttendanceCheck = {
        member_id: newMember.id,
        attended: true,
        member: newMember
      };
      
      setAvailableMembers(prev => [...prev, newAttendanceCheck]);
      
      // Notify parent component
      if (onMemberAdded) {
        onMemberAdded(newMember);
      }
      
      // Reset form
      setNewMemberName('');
      setNewMemberEmail('');
      setShowAddMember(false);
      
      // Show success message with database and auth info
      const dbMessage = memberResult.warning 
        ? `\n\n⚠️ Note: ${memberResult.warning}`
        : '\n\n✅ Saved to Supabase database';
      
      const authMessage = memberResult.data.authCreated
        ? `\n\n🔐 Login credentials created:\n- Email: ${memberEmail}\n- Password: password123\n\n⚠️ Please ask the member to change their password after first login.`
        : `\n\n⚠️ Auth creation failed: ${memberResult.data.authError || 'Unknown error'}\n\n💡 To fix this, add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.\nSee AUTH_SERVICE_KEY_SETUP.md for instructions.`;
        
      alert(`✅ Member "${newMember.name}" added successfully and is available for match creation!${dbMessage}${authMessage}`);
      
    } catch (error: any) {
      console.error('❌ Error creating member:', error);
      alert(`❌ Error creating member: ${error.message}`);
    } finally {
      setAddingMember(false);
    }
  };

  // Show member management interface - always show the form
  // Users can add members if needed

  const addGameScore = () => {
    setFormData(prev => ({
      ...prev,
      game_scores: [...prev.game_scores, {
        game_number: prev.game_scores.length + 1,
        team1_score: 0,
        team2_score: 0
      }]
    }));
  };

  const updateGameScore = (index: number, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      game_scores: prev.game_scores.map((score, i) => 
        i === index ? { ...score, [field]: value } : score
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.team1_player1 || !formData.team1_player2 || !formData.team2_player1 || !formData.team2_player2) {
        throw new Error('Please select all 4 players before creating the match');
      }

      // Check for duplicate players
      const players = [formData.team1_player1, formData.team1_player2, formData.team2_player1, formData.team2_player2];
      const uniquePlayers = new Set(players);
      if (uniquePlayers.size !== 4) {
        throw new Error('Each player can only be selected once. Please choose 4 different players.');
      }

      console.log('Form data being submitted:', formData);
      // Create match data
      const matchData = {
        date: new Date().toISOString().split('T')[0],
        time: formData.time,
        field_number: formData.field_number,
        shuttlecock_count: formData.shuttlecock_count,
        participants: [
          { member_id: formData.team1_player1, team: 'team1', position: 'player1' },
          { member_id: formData.team1_player2, team: 'team1', position: 'player2' },
          { member_id: formData.team2_player1, team: 'team2', position: 'player1' },
          { member_id: formData.team2_player2, team: 'team2', position: 'player2' }
        ],
        team1_score: formData.team1_score,
        team2_score: formData.team2_score,
        game_scores: formData.game_scores
      };

      // Create match via API
      const matchResponse = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData),
      });

      if (!matchResponse.ok) {
        const errorText = await matchResponse.text();
        console.error('Match API Error Response:', errorText);
        throw new Error(`Failed to create match (${matchResponse.status}): ${errorText}`);
      }

      const createdMatch = await matchResponse.json();
      console.log('Match API Success Response:', createdMatch);

      if (!createdMatch.success) {
        throw new Error(createdMatch.error || 'Failed to create match');
      }

      // Create mock match object for UI update
      const newMatch: Match = {
        id: createdMatch.data?.id || Date.now().toString(),
        date: matchData.date,
        time: matchData.time,
        field_number: matchData.field_number,
        shuttlecock_count: matchData.shuttlecock_count,
        status: 'completed',
        participants: [
          { 
            id: '1', 
            member_id: formData.team1_player1, 
            team: 'team1', 
            position: 'player1',
            member: availableMembers.find(m => m.member_id === formData.team1_player1)?.member!
          },
          { 
            id: '2', 
            member_id: formData.team1_player2, 
            team: 'team1', 
            position: 'player2',
            member: availableMembers.find(m => m.member_id === formData.team1_player2)?.member!
          },
          { 
            id: '3', 
            member_id: formData.team2_player1, 
            team: 'team2', 
            position: 'player1',
            member: availableMembers.find(m => m.member_id === formData.team2_player1)?.member!
          },
          { 
            id: '4', 
            member_id: formData.team2_player2, 
            team: 'team2', 
            position: 'player2',
            member: availableMembers.find(m => m.member_id === formData.team2_player2)?.member!
          }
        ],
        result: {
          team1_score: formData.team1_score,
          team2_score: formData.team2_score,
          winner_team: formData.team1_score > formData.team2_score ? 'team1' : 'team2',
          total_games: formData.game_scores.length,
          game_scores: formData.game_scores
        }
      };

      // Show success message
      const shuttlecockCostPerPlayer = formData.shuttlecock_count * 3000;
      const totalRevenue = createdMatch.data?.totalRevenue || 0;
      
      alert(`✅ Match created successfully!\n\n💰 Payment records created for all 4 players:\n- Shuttlecock cost: Rp ${shuttlecockCostPerPlayer.toLocaleString('id-ID')} per player\n- Total revenue: Rp ${totalRevenue.toLocaleString('id-ID')}\n\n📋 Check Payment Management to view details.`);

      onMatchCreated(newMatch);
      
      // Reset form
      setFormData({
        time: '09:00',
        field_number: 1,
        shuttlecock_count: 1,
        team1_player1: '',
        team1_player2: '',
        team2_player1: '',
        team2_player2: '',
        team1_score: 0,
        team2_score: 0,
        game_scores: [{ game_number: 1, team1_score: 0, team2_score: 0 }]
      });

    } catch (error: any) {
      console.error('Error creating match and payments:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`❌ Error creating match: ${errorMessage}\n\nPlease try again or check the console for more details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Match</h2>
      
      {availableMembers.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Members Available</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need to add members before creating a match. Click "Add New Member" below to get started.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Time (Fixed)
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
              20:00 (8:00 PM Saturday)
            </div>
            <p className="text-xs text-blue-600 mt-1">
              ℹ️ All DLOB sessions are every Saturday at 8:00 PM
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Number
            </label>
            <input
              type="number"
              min="1"
              value={formData.field_number}
              onChange={(e) => setFormData(prev => ({ ...prev, field_number: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shuttlecocks Used
            </label>
            <input
              type="number"
              min="1"
              value={formData.shuttlecock_count}
              onChange={(e) => setFormData(prev => ({ ...prev, shuttlecock_count: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
        </div>

        {/* Add Member Section */}
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Player Management</h3>
            <button
              type="button"
              onClick={() => setShowAddMember(!showAddMember)}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              {showAddMember ? 'Cancel' : '+ Add New Member'}
            </button>
          </div>

          <div className="text-xs text-gray-800 mb-2">
            Available members: <strong>{availableMembers.length}</strong> | Required: <strong>4 members</strong>
            {availableMembers.length < 4 && (
              <span className="text-red-600 ml-2">⚠️ Need {4 - availableMembers.length} more members</span>
            )}
          </div>

          {showAddMember && (
            <div className="mt-3 p-3 bg-white rounded border">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Add New Member</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Enter member name"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={addingMember}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={addingMember}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddNewMember}
                  disabled={addingMember || !newMemberName.trim()}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </div>
          )}

          {availableMembers.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-800 mb-1">Current members:</div>
              <div className="flex flex-wrap gap-1">
                {availableMembers.slice(0, 8).map(member => (
                  <span key={member.member_id} className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    {member.member.name}
                  </span>
                ))}
                {availableMembers.length > 8 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    +{availableMembers.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Team 1</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 1
              </label>
              <select
                value={formData.team1_player1}
                onChange={(e) => setFormData(prev => ({ ...prev, team1_player1: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-700">Select Player</option>
                {availableMembers.map(member => (
                  <option key={member.member_id} value={member.member_id} className="text-gray-900">
                    {member.member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 2
              </label>
              <select
                value={formData.team1_player2}
                onChange={(e) => setFormData(prev => ({ ...prev, team1_player2: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-700">Select Player</option>
                {availableMembers.map(member => (
                  <option key={member.member_id} value={member.member_id} className="text-gray-900">
                    {member.member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Team 2</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 1
              </label>
              <select
                value={formData.team2_player1}
                onChange={(e) => setFormData(prev => ({ ...prev, team2_player1: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-700">Select Player</option>
                {availableMembers.map(member => (
                  <option key={member.member_id} value={member.member_id} className="text-gray-900">
                    {member.member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player 2
              </label>
              <select
                value={formData.team2_player2}
                onChange={(e) => setFormData(prev => ({ ...prev, team2_player2: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-700">Select Player</option>
                {availableMembers.map(member => (
                  <option key={member.member_id} value={member.member_id} className="text-gray-900">
                    {member.member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Game Scores */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium text-gray-900">Game Scores</h3>
            <button
              type="button"
              onClick={addGameScore}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add Game
            </button>
          </div>
          
          {formData.game_scores.map((game, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game {game.game_number}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team 1 Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={game.team1_score}
                  onChange={(e) => updateGameScore(index, 'team1_score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team 2 Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={game.team2_score}
                  onChange={(e) => updateGameScore(index, 'team2_score', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Final Score */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team 1 Final Score
            </label>
            <input
              type="number"
              min="0"
              value={formData.team1_score}
              onChange={(e) => setFormData(prev => ({ ...prev, team1_score: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team 2 Final Score
            </label>
            <input
              type="number"
              min="0"
              value={formData.team2_score}
              onChange={(e) => setFormData(prev => ({ ...prev, team2_score: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
        </div>

        {/* Payment Summary */}
        {formData.team1_player1 && formData.team1_player2 && formData.team2_player1 && formData.team2_player2 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">💰 DLOB Payment Structure</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-medium text-blue-900 mb-2">📋 Pricing Model:</div>
                <div className="space-y-1 text-blue-800">
                  <div>• <strong>Monthly Membership:</strong> Rp 40,000 (4 weeks) or Rp 45,000 (5 weeks)</div>
                  <div>• <strong>With Membership:</strong> Only pay shuttlecock fees per session</div>
                  <div>• <strong>Without Membership:</strong> Rp 18,000 per session + shuttlecock fees</div>
                  <div>• <strong>Sessions:</strong> Every Saturday at 8:00 PM</div>
                </div>
              </div>
              
              <div className="border-t border-blue-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-blue-800">Shuttlecock cost per player:</span>
                  <span className="font-medium text-blue-900">Rp {(formData.shuttlecock_count * 3000).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Calculation:</span>
                  <span className="font-mono text-xs text-blue-800">{formData.shuttlecock_count} × Rp 3,000</span>
                </div>
              </div>
              
              <div className="border-t border-blue-200 pt-2">
                <div className="text-xs text-blue-600 space-y-1">
                  <div>💡 <strong>For members with membership:</strong> Only Rp {(formData.shuttlecock_count * 3000).toLocaleString('id-ID')} per player</div>
                  <div>💡 <strong>For members without membership:</strong> Rp {((formData.shuttlecock_count * 3000) + 18000).toLocaleString('id-ID')} per player</div>
                  <div>📊 System will automatically detect membership status and calculate accordingly</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || availableMembers.length < 4}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Match & Processing Payments...
              </div>
            ) : availableMembers.length < 4 ? (
              <>
                <Users className="h-4 w-4 mr-2" />
                Need {4 - availableMembers.length} More Members ({availableMembers.length}/4)
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Create Match & Calculate Payments
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}