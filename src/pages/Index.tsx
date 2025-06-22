
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Play, Plus, History, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CreateGameLobby from '@/components/CreateGameLobby';
import JoinGameLobby from '@/components/JoinGameLobby';
import LiveScorecard from '@/components/LiveScorecard';
import GameHistory from '@/components/GameHistory';

type GameState = 'menu' | 'create' | 'join' | 'playing' | 'finished' | 'history';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleCreateGame = () => {
    setGameState('create');
  };

  const handleJoinGame = () => {
    setGameState('join');
  };

  const handleViewHistory = () => {
    setGameState('history');
  };

  const handleStartGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setGameState('playing');
  };

  const handleJoinExistingGame = (gameId: string) => {
    setCurrentGameId(gameId);
    setGameState('playing');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'create':
        return <CreateGameLobby onStartGame={handleStartGame} onBack={() => setGameState('menu')} />;
      case 'join':
        return <JoinGameLobby onJoinGame={handleJoinExistingGame} onBack={() => setGameState('menu')} />;
      case 'playing':
        return <LiveScorecard gameId={currentGameId!} onEndGame={() => setGameState('finished')} />;
      case 'history':
        return <GameHistory onBack={() => setGameState('menu')} />;
      case 'finished':
        return (
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-800 mb-4">Game Complete!</h2>
              <Button onClick={() => setGameState('menu')} className="bg-green-600 hover:bg-green-700">
                Return to Menu
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <div className="container mx-auto px-4 py-12">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Trophy className="w-12 h-12 text-green-600" />
                  <h1 className="text-5xl font-bold text-green-800">GolfScore Live</h1>
                </div>
                <p className="text-xl text-green-600 max-w-2xl mx-auto">
                  Experience the thrill of live multiplayer golf scoring. Create games, invite friends, and track every shot in real-time.
                </p>
              </div>

              {/* Main Actions */}
              <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-12">
                <Card className="hover:shadow-lg transition-shadow duration-300 border-green-200">
                  <CardHeader className="text-center">
                    <Plus className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <CardTitle className="text-2xl text-green-800">Create New Game</CardTitle>
                    <CardDescription className="text-green-600">
                      Host a new round and invite players to join your game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleCreateGame}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                    >
                      Create Game
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 border-green-200">
                  <CardHeader className="text-center">
                    <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <CardTitle className="text-2xl text-green-800">Join Game</CardTitle>
                    <CardDescription className="text-green-600">
                      Enter a game code to join an existing round
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleJoinGame}
                      variant="outline" 
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 py-3 text-lg"
                    >
                      Join Game
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300 border-green-200">
                  <CardHeader className="text-center">
                    <History className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <CardTitle className="text-2xl text-green-800">Game History</CardTitle>
                    <CardDescription className="text-green-600">
                      View your past rounds and final leaderboards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleViewHistory}
                      variant="outline" 
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 py-3 text-lg"
                    >
                      View History
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Features */}
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-green-800 text-center mb-8">Features</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="text-center border-green-200">
                    <CardContent className="pt-6">
                      <Play className="w-8 h-8 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-green-800 mb-2">Real-Time Scoring</h3>
                      <p className="text-green-600 text-sm">Live updates as players enter scores hole by hole</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center border-green-200">
                    <CardContent className="pt-6">
                      <Trophy className="w-8 h-8 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-green-800 mb-2">Auto Calculations</h3>
                      <p className="text-green-600 text-sm">Automatic OUT, IN, Total, and Net score calculations</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center border-green-200">
                    <CardContent className="pt-6">
                      <Users className="w-8 h-8 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold text-green-800 mb-2">Live Leaderboard</h3>
                      <p className="text-green-600 text-sm">Track rankings and see who's leading in real-time</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* User Info */}
              <div className="fixed top-4 right-4">
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <span>Welcome, {user?.user_metadata?.name || user?.email?.split('@')[0]}!</span>
                  <Button 
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-green-700 p-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderGameState();
};

export default Index;
