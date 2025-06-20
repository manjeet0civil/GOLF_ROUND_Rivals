
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Play, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GameLobbyProps {
  onStartGame: (gameInfo: any) => void;
  onBack: () => void;
  currentUser: any;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame, onBack, currentUser }) => {
  const { toast } = useToast();
  const [gameSettings, setGameSettings] = useState({
    courseName: 'Pebble Beach Golf Links',
    gameCode: 'GOLF' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    maxPlayers: 4
  });

  const [players, setPlayers] = useState([
    {
      id: currentUser?.id || '1',
      name: currentUser?.name || 'You',
      handicap: currentUser?.handicap || 18,
      isHost: true
    }
  ]);

  // Simulate players joining
  useEffect(() => {
    const timer = setTimeout(() => {
      setPlayers(prev => [
        ...prev,
        {
          id: '2',
          name: 'Mike Johnson',
          handicap: 12,
          isHost: false
        },
        {
          id: '3',
          name: 'Sarah Wilson',
          handicap: 8,
          isHost: false
        }
      ]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const copyGameCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${gameSettings.gameCode}`);
    toast({
      title: "Game link copied!",
      description: "Share this link with other players to invite them.",
    });
  };

  const handleStartGame = () => {
    const courseData = {
      name: gameSettings.courseName,
      holes: Array.from({ length: 18 }, (_, i) => ({
        number: i + 1,
        par: i % 3 === 0 ? 4 : i % 5 === 0 ? 5 : i % 7 === 0 ? 3 : 4
      }))
    };

    onStartGame({
      course: courseData,
      players: players,
      gameCode: gameSettings.gameCode
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBack}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-green-800">Game Lobby</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Game Settings */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Game Settings</CardTitle>
              <CardDescription>Configure your round details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  value={gameSettings.courseName}
                  onChange={(e) => setGameSettings(prev => ({ ...prev, courseName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Game Code</Label>
                <div className="flex gap-2">
                  <Input value={gameSettings.gameCode} readOnly className="bg-gray-50" />
                  <Button onClick={copyGameCode} size="sm" variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-600">Share this code for others to join</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-players">Max Players</Label>
                <Input
                  id="max-players"
                  type="number"
                  min="2"
                  max="8"
                  value={gameSettings.maxPlayers}
                  onChange={(e) => setGameSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Users className="w-5 h-5" />
                Players ({players.length}/{gameSettings.maxPlayers})
              </CardTitle>
              <CardDescription>Waiting for players to join...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-800">{player.name}</span>
                        {player.isHost && (
                          <Badge variant="secondary" className="bg-green-600 text-white">Host</Badge>
                        )}
                      </div>
                      <span className="text-sm text-green-600">Handicap: {player.handicap}</span>
                    </div>
                  </div>
                ))}

                {players.length < gameSettings.maxPlayers && (
                  <div className="p-3 border-2 border-dashed border-green-300 rounded-lg text-center">
                    <UserPlus className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-green-600 text-sm">Waiting for more players...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Game */}
        <Card className="mt-6 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Button 
                onClick={handleStartGame}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                disabled={players.length < 2}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
              {players.length < 2 && (
                <p className="text-sm text-green-600 mt-2">Need at least 2 players to start</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameLobby;
