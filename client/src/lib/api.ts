import { supabase } from './supabase';

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('🔍 API Request Debug:');
  console.log('URL:', url);
  console.log('Session exists:', !!session);
  console.log('Access token exists:', !!session?.access_token);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
    console.log('🔑 Token added to headers');
  } else {
    console.log('❌ No access token available');
  }

  console.log('📤 Making request with headers:', headers);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Error response:', errorText);
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  // Game endpoints
  createGame: (gameData: any) => authenticatedFetch('/api/games', {
    method: 'POST',
    body: JSON.stringify(gameData),
  }),

  getGame: (gameId: number) => authenticatedFetch(`/api/games/${gameId}`),

  getGameStatus: (gameId: number) => authenticatedFetch(`/api/games/${gameId}/status`),

  joinGame: (gameCode: string) => authenticatedFetch(`/api/games/${gameCode}/join`, {
    method: 'POST',
  }),

  startGame: (gameId: number) => authenticatedFetch(`/api/games/${gameId}/start`, {
    method: 'POST',
  }),

  completeGame: (gameId: number) => authenticatedFetch(`/api/games/${gameId}/complete`, {
    method: 'POST',
  }),

  // Score endpoints
  updateScore: (gameId: number, scoreData: any) => authenticatedFetch(`/api/games/${gameId}/scores`, {
    method: 'POST',
    body: JSON.stringify(scoreData),
  }),

  getScores: (gameId: number) => authenticatedFetch(`/api/games/${gameId}/scores`),

  getLeaderboard: (gameId: number) => authenticatedFetch(`/api/games/${gameId}/leaderboard`),

  // User endpoints
  getGameHistory: () => authenticatedFetch('/api/users/games'),
}; 