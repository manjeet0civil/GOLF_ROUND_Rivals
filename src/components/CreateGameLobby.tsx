
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Play, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CreateGameLobbyProps {
  onStartGame: (gameId: string) => void;
  onBack: () => void;
}

interface Player {
  id: string;
  player_name: string;
  handicap: number;
  is_host: boolean;
  user_id: string;
}

const CreateGameLobby: React.FC<CreateGameLobbyProps> = ({ onStartGame, onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gameSettings, setGameSettings] = useState({
    courseName: '',
    maxPlayers: 4,
    numberOfHoles: 18
  });
  const [gameCode, setGameCode] = useState('');
  const [gameId, setGameId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      createGame();
    }
  }, [user]);

  useEffect(() => {
    if (gameId) {
      const subscription = supabase
        .channel(`game-${gameId}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` },
          () => {
            fetchPlayers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [gameId]);

  const createGame = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      // Generate game code using the database function
      const { data: codeData } = await supabase.rpc('generate_game_code');
      const newGameCode = codeData;

      // Create the game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          host_user_id: user.id,
          course_name: 'New Golf Course',
          game_code: newGameCode,
          max_players: 4,
          number_of_holes: 18,
          status: 'waiting'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add host as first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          player_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Host',
          handicap: user.user_metadata?.handicap || 18,
          is_host: true
        });

      if (playerError) throw playerError;

      setGameId(gameData.id);
      setGameCode(newGameCode);
      setGameSettings(prev => ({ ...prev, courseName: gameData.course_name }));
      fetchPlayers();

    } catch (error: any) {
      toast({
        title: "Error creating game",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const fetchPlayers = async () => {
    if (!gameId) return;

    const { data, error } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    setPlayers(data || []);
  };

  const updateGameSettings = async (field: string, value: any) => {
    if (!gameId) return;

    const { error } = await supabase
      .from('games')
      .update({ [field]: value })
      .eq('id', gameId);

    if (error) {
      toast({
        title: "Error updating game",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setGameSettings(prev => ({ ...prev, [field]: value }));
  };

  const copyGameCode = () => {
    const gameUrl = `${window.location.origin}/join/${gameCode}`;
    navigator.clipboard.writeText(gameUrl);
    toast({
      title: "Game link copied!",
      description: "Share this link with other players to invite them.",
    });
  };

  const handleStartGame = async () => {
    if (!gameId) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      onStartGame(gameId);
    } catch (error: any) {
      toast({
        title: "Error starting game",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Creating your game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
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
                  onChange={(e) => {
                    setGameSettings(prev => ({ ...prev, courseName: e.target.value }));
                    updateGameSettings('course_name', e.target.value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Game Code</Label>
                <div className="flex gap-2">
                  <Input value={gameCode} readOnly className="bg-gray-50" />
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
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setGameSettings(prev => ({ ...prev, maxPlayers: value }));
                    updateGameSettings('max_players', value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number-of-holes">Number of Holes</Label>
                <Input
                  id="number-of-holes"
                  type="number"
                  min="9"
                  max="18"
                  step="9"
                  value={gameSettings.numberOfHoles}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setGameSettings(prev => ({ ...prev, numberOfHoles: value }));
                    updateGameSettings('number_of_holes', value);
                  }}
                />
              </div>
            </CardContent>
          </Card>

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
                        <span className="font-medium text-green-800">{player.player_name}</span>
                        {player.is_host && (
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

export default CreateGameLobby;
