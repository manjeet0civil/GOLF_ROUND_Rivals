
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Play, Plus } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import GameLobby from '@/components/GameLobby';
import LiveScorecard from '@/components/LiveScorecard';

type GameState = 'menu' | 'lobby' | 'playing' | 'finished';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [gameData, setGameData] = useState(null);

  const handleAuth = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleCreateGame = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setGameState('lobby');
  };

  const handleJoinGame = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // Simulate joining a game
    setGameState('lobby');
  };

  const handleStartGame = (gameInfo: any) => {
    setGameData(gameInfo);
    setGameState('playing');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'lobby':
        return <GameLobby onStartGame={handleStartGame} onBack={() => setGameState('menu')} currentUser={currentUser} />;
      case 'playing':
        return <LiveScorecard gameData={gameData} onEndGame={() => setGameState('finished')} currentUser={currentUser} />;
      case 'finished':
        return (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-green-800 mb-4">Game Complete!</h2>
            <Button onClick={() => setGameState('menu')} className="bg-green-600 hover:bg-green-700">
              Return to Menu
            </Button>
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
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
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

              {/* Auth Status */}
              <div className="fixed top-4 right-4">
                {isAuthenticated ? (
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
                    Welcome back, {currentUser?.name || 'Player'}!
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowAuthModal(true)}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderGameState()}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuth={handleAuth} 
      />
    </>
  );
};

export default Index;
