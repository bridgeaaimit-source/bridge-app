import { useEffect, useState } from 'react';

// Mock user data for testing
const mockUser = {
  uid: 'test-user-123',
  name: 'Test Student',
  email: 'test@bridge.app',
  photo: null,
  college: 'Test College',
  role: 'student',
  bridgeScore: 750,
  interviewsDone: 8,
  currentStreak: 3,
  avgScore: 7.5
};

// Mock recent activity for testing
const mockRecentActivity = [
  {
    type: 'interview',
    title: 'Software Engineer Interview',
    time: '2 hours ago',
    score: 8.5,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    type: 'interview',
    title: 'Data Science Interview',
    time: '1 day ago',
    score: 7.2,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

// Mock leaderboard for testing
const mockLeaderboard = [
  { rank: 1, name: 'Alice Johnson', college: 'MIT', score: 920 },
  { rank: 2, name: 'Test Student', college: 'Test College', score: 750 },
  { rank: 3, name: 'Bob Smith', college: 'Stanford', score: 680 },
  { rank: 4, name: 'Carol Davis', college: 'Harvard', score: 620 }
];

export function useAuthBypass() {
  const [isBypassed, setIsBypassed] = useState(false);
  const [mockUserData, setMockUserData] = useState(null);

  useEffect(() => {
    const BYPASS = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
    setIsBypassed(BYPASS);
    
    if (BYPASS) {
      console.log('🔓 Auth bypass enabled - using test user');
      setMockUserData({
        user: mockUser,
        stats: {
          bridgeScore: mockUser.bridgeScore,
          interviewsDone: mockUser.interviewsDone,
          currentStreak: mockUser.currentStreak,
          avgScore: mockUser.avgScore
        },
        recentActivity: mockRecentActivity,
        leaderboard: mockLeaderboard
      });
    }
  }, []);

  return {
    isBypassed,
    mockUserData,
    mockUser,
    mockRecentActivity,
    mockLeaderboard
  };
}
