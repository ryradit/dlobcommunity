'use client';

import { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, Users, Plus, Target } from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/hooks/useLanguage';

interface Match {
  id: string;
  date: string;
  time: string;
  court_number?: number;
  type: 'singles' | 'doubles';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: Array<{
    id: string;
    team: 'team1' | 'team2';
    member: {
      id: string;
      name: string;
    };
  }>;
  result?: {
    team1_score: number;
    team2_score: number;
    winner_team: 'team1' | 'team2';
  };
}

export default function MatchesPage() {
  const { language } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      // Mock data for demonstration
      const mockMatches: Match[] = [
        {
          id: '1',
          date: '2025-10-22',
          time: '10:00',
          court_number: 1,
          type: 'doubles',
          status: 'scheduled',
          participants: [
            { id: '1', team: 'team1', member: { id: '1', name: 'John Doe' } },
            { id: '2', team: 'team1', member: { id: '2', name: 'Jane Smith' } },
            { id: '3', team: 'team2', member: { id: '3', name: 'Bob Wilson' } },
            { id: '4', team: 'team2', member: { id: '4', name: 'Alice Brown' } },
          ]
        },
        {
          id: '2',
          date: '2025-10-22',
          time: '11:00',
          court_number: 2,
          type: 'singles',
          status: 'completed',
          participants: [
            { id: '5', team: 'team1', member: { id: '5', name: 'Mike Johnson' } },
            { id: '6', team: 'team2', member: { id: '6', name: 'Sarah Davis' } },
          ],
          result: {
            team1_score: 21,
            team2_score: 19,
            winner_team: 'team1'
          }
        }
      ];
      
      setMatches(mockMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamMembers = (match: Match, team: 'team1' | 'team2') => {
    return match.participants
      .filter(p => p.team === team)
      .map(p => p.member.name)
      .join(', ');
  };

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'in_progress');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {language === 'en' ? 'Matches' : 'Pertandingan'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {language === 'en' ? 'Schedule and track your badminton matches' : 'Jadwalkan dan lacak pertandingan bulu tangkis Anda'}
                </p>
              </div>
              <div className="ml-6">
                <LanguageSwitcher />
              </div>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Schedule Match' : 'Jadwalkan Pertandingan'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Matches ({upcomingMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed Matches ({completedMatches.length})
              </button>
            </nav>
          </div>

          {/* Matches List */}
          <div className="p-6">
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Target className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {match.type === 'singles' ? 'Singles Match' : 'Doubles Match'}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span className="mr-4">{new Date(match.date).toLocaleDateString()}</span>
                              <Clock className="w-4 h-4 mr-1" />
                              <span className="mr-4">{match.time}</span>
                              {match.court_number && (
                                <>
                                  <span className="mr-1">Court</span>
                                  <span>{match.court_number}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          match.status === 'scheduled' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {match.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-500 mb-2">Team 1</div>
                          <div className="text-gray-900">{getTeamMembers(match, 'team1')}</div>
                        </div>
                        
                        <div className="text-center flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-400">VS</span>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-500 mb-2">Team 2</div>
                          <div className="text-gray-900">{getTeamMembers(match, 'team2')}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">
                          Start Match
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No upcoming matches</h3>
                    <p className="text-gray-600">Schedule your first match to get started!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-4">
                {completedMatches.length > 0 ? (
                  completedMatches.map((match) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {match.type === 'singles' ? 'Singles Match' : 'Doubles Match'}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span className="mr-4">{new Date(match.date).toLocaleDateString()}</span>
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{match.time}</span>
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>

                      {match.result && (
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className={`text-center p-4 rounded-lg ${
                            match.result.winner_team === 'team1' ? 'bg-green-100 border-2 border-green-300' : 'bg-white'
                          }`}>
                            <div className="text-sm font-medium text-gray-500 mb-2">Team 1</div>
                            <div className="text-gray-900 mb-2">{getTeamMembers(match, 'team1')}</div>
                            <div className="text-2xl font-bold text-gray-900">{match.result.team1_score}</div>
                            {match.result.winner_team === 'team1' && (
                              <div className="text-green-600 font-semibold text-sm mt-1">Winner!</div>
                            )}
                          </div>
                          
                          <div className="text-center flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-400">VS</span>
                          </div>
                          
                          <div className={`text-center p-4 rounded-lg ${
                            match.result.winner_team === 'team2' ? 'bg-green-100 border-2 border-green-300' : 'bg-white'
                          }`}>
                            <div className="text-sm font-medium text-gray-500 mb-2">Team 2</div>
                            <div className="text-gray-900 mb-2">{getTeamMembers(match, 'team2')}</div>
                            <div className="text-2xl font-bold text-gray-900">{match.result.team2_score}</div>
                            {match.result.winner_team === 'team2' && (
                              <div className="text-green-600 font-semibold text-sm mt-1">Winner!</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No completed matches</h3>
                    <p className="text-gray-600">Complete your first match to see results here!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}