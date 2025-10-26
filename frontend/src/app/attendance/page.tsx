'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/hooks/useLanguage';

interface AttendanceRecord {
  id: string;
  member_id: string;
  date: string;
  check_in_time: string;
  check_in_method: 'qr' | 'gps' | 'manual';
  location?: {
    latitude: number;
    longitude: number;
  };
  member: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AttendancePage() {
  const { language } = useLanguage();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayAttended, setTodayAttended] = useState(false);

  useEffect(() => {
    fetchAttendance();
    checkTodayAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      // Since we don't have auth yet, we'll simulate data
      const mockData: AttendanceRecord[] = [
        {
          id: '1',
          member_id: '1',
          date: '2025-10-22',
          check_in_time: '2025-10-22T09:00:00Z',
          check_in_method: 'manual',
          member: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        {
          id: '2',
          member_id: '2',
          date: '2025-10-22',
          check_in_time: '2025-10-22T09:15:00Z',
          check_in_method: 'qr',
          member: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        }
      ];
      
      setAttendanceRecords(mockData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    // Mock: assume user hasn't checked in yet
    setTodayAttended(false);
  };

  const handleCheckIn = async (method: 'manual' | 'qr' | 'gps') => {
    setCheckingIn(true);
    
    try {
      let location;
      
      if (method === 'gps') {
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      }

      // Here we would make the actual API call
      // const response = await fetch('/api/attendance/checkin', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ method, location })
      // });

      // Mock success
      setTodayAttended(true);
      await fetchAttendance();
      
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

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
                  {language === 'en' ? 'Attendance' : 'Kehadiran'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {language === 'en' ? 'Track your badminton session attendance' : 'Lacak kehadiran sesi bulu tangkis Anda'}
                </p>
              </div>
              <div className="ml-6">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Today</div>
              <div className="text-xl font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Check-in Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Check In</h2>
              
              {todayAttended ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">Already Checked In!</h3>
                  <p className="text-gray-600">You've checked in for today's session.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Choose your check-in method:</p>
                  
                  <button
                    onClick={() => handleCheckIn('manual')}
                    disabled={checkingIn}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {checkingIn ? 'Checking In...' : 'Manual Check-in'}
                  </button>
                  
                  <button
                    onClick={() => handleCheckIn('gps')}
                    disabled={checkingIn}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {checkingIn ? 'Checking In...' : 'GPS Check-in'}
                  </button>
                  
                  <button
                    onClick={() => handleCheckIn('qr')}
                    disabled={checkingIn}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {checkingIn ? 'Checking In...' : 'QR Code Check-in'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Present</span>
                  <span className="font-semibold text-blue-600">{attendanceRecords.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Check-in Time</span>
                  <span className="font-semibold text-gray-900">9:00 AM - 12:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Today's Attendance</h2>
                <p className="text-gray-600 mt-1">Members who have checked in today</p>
              </div>

              <div className="divide-y divide-gray-200">
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <div key={record.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{record.member.name}</h3>
                            <p className="text-gray-600">{record.member.email}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm">
                              {new Date(record.check_in_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.check_in_method === 'qr' 
                                ? 'bg-purple-100 text-purple-800'
                                : record.check_in_method === 'gps'
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.check_in_method.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No one has checked in yet</h3>
                    <p className="text-gray-600">Be the first to check in for today's session!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}