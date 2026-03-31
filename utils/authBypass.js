// Generic auth bypass helper for pages
export function usePageAuthBypass(setUser, setLoading, mockData = {}) {
  const { isBypassed, mockUserData } = require('@/hooks/useAuthBypass').useAuthBypass();
  
  if (isBypassed && mockUserData) {
    console.log('🔓 Auth bypass enabled - using test user');
    
    const defaultMockData = {
      name: 'Test Student',
      email: 'test@bridge.app',
      college: 'Test College',
      role: 'student',
      bridgeScore: 750,
      interviewsDone: 8,
      avgScore: 7.5,
      ...mockData
    };
    
    setUser({
      uid: 'test-user-123',
      displayName: defaultMockData.name,
      email: defaultMockData.email,
      photoURL: null,
      ...defaultMockData
    });
    
    if (setLoading) setLoading(false);
    return true; // Bypassed
  }
  
  return false; // Not bypassed
}
