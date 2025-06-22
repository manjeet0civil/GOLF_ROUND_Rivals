import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, History, Trophy, Target, Zap, Shield, Globe, Play, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseAuthModal } from '@/components/SupabaseAuthModal';
import GameLobby from '@/components/GameLobby';
import LiveScorecard from '@/components/LiveScorecard';
import GameHistory from '@/components/GameHistory';
import { useQuery } from '@tanstack/react-query';

type GameState = 'menu' | 'lobby' | 'playing' | 'history' | 'finished';

interface GameData {
  id: number;
  courseName: string;
  coursePar: number;
  maxPlayers: number;
  gameCode: string;
  status: string;
  hostId: string;
  players?: any[];
}

interface ActiveGameResponse {
  game: GameData;
  players: any[];
}

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);

  // Monitor game status for automatic redirection when host starts game
  const { data: activeGameData } = useQuery<ActiveGameResponse>({
    queryKey: [`/api/games/${currentGameId}`],
    enabled: !!currentGameId && gameState === 'lobby',
    refetchInterval: 2000, // Check every 2 seconds
  });

  // Auto-redirect to scorecard when game starts
  useEffect(() => {
    if (activeGameData?.game?.status === 'playing' && gameState === 'lobby') {
      setGameData(activeGameData.game);
      setGameState('playing');
    }
  }, [activeGameData, gameState]);

  const handleCreateGame = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Reset any existing game state
    setGameData(null);
    setCurrentGameId(null);
    setGameState('lobby');
  };

  const handleJoinGame = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Reset any existing game state
    setGameData(null);
    setCurrentGameId(null);
    setGameState('lobby');
  };

  const handleViewHistory = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setGameState('history');
  };

  const handleStartGame = (gameInfo: any) => {
    setGameData(gameInfo);
    setCurrentGameId(gameInfo.id);
    setGameState('playing');
  };

  const handleGameJoined = (gameId: number) => {
    setCurrentGameId(gameId);
  };

  const handleEndGame = () => {
    // Reset game state when game ends
    setGameData(null);
    setCurrentGameId(null);
    setGameState('finished');
  };

  const handleReturnToMenu = () => {
    // Complete reset of game state
    setGameData(null);
    setCurrentGameId(null);
    setGameState('menu');
  };

  const handleSignOut = async () => {
    await signOut();
    setGameState('menu');
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderGameState = () => {
    switch (gameState) {
      case 'lobby':
        return <GameLobby onStartGame={handleStartGame} onBack={handleReturnToMenu} currentUser={user} onGameJoined={handleGameJoined} />;
      case 'playing':
        return <LiveScorecard gameData={gameData} onEndGame={handleEndGame} currentUser={user} />;
      case 'history':
        return <GameHistory currentUser={user} onBack={handleReturnToMenu} />;
      case 'finished':
        return (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-green-800 mb-4">Game Complete!</h2>
            <p className="text-gray-600 mb-6">Results have been saved to your game history.</p>
            <Button onClick={handleReturnToMenu} className="bg-green-600 hover:bg-green-700">
              Return to Menu
            </Button>
          </div>
        );
      default:
        // Main menu
        return (
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Target className="w-12 h-12 text-green-600 mr-3" />
                  <h1 className="text-4xl font-bold text-green-800">Golf Round Rivals</h1>
                </div>
                <p className="text-gray-600">Multiplayer golf scorecard for friendly competition</p>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <Button 
                    onClick={() => setShowAuthModal(true)} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Sign In to Play
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{profile?.name || user.email}</p>
                        <p className="text-sm text-gray-500">Handicap: {profile?.handicap || 0}</p>
                      </div>
                      <Button 
                        onClick={handleSignOut} 
                        variant="outline" 
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateGame} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Game
                  </Button>

                  <Button 
                    onClick={handleJoinGame} 
                    variant="outline" 
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 py-3"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Join Game
                  </Button>

                  <Button 
                    onClick={handleViewHistory} 
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 py-3"
                  >
                    <History className="w-5 h-5 mr-2" />
                    Game History
                  </Button>
                </div>
              )}

              <div className="mt-8 text-center">
                <div className="flex justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    Real-time
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Fast
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    Secure
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderGameState()}
      <SupabaseAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Index;
