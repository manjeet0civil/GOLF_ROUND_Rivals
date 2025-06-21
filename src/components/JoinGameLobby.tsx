
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface JoinGameLobbyProps {
  onJoinGame: (gameId: string) => void;
  onBack: () => void;
}

interface Player {
  id: string;
  player_name: string;
  handicap: number;
  is_host: boolean;
  user_id: string;
}

interface GameDetails {
  id: string;
  course_name: string;
  max_players: number;
  status: string;
}

const JoinGameLobby: React.FC<JoinGameLobbyProps> = ({ onJoinGame, onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gameCode, setGameCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinedGame, setJoinedGame] = useState<GameDetails | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (joinedGame) {
      const subscription = supabase
        .channel(`game-${joinedGame.id}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${joinedGame.id}` },
          () => {
            fetchPlayers();
          }
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${joinedGame.id}` },
          (payload) => {
            if (payload.new.status === 'in_progress') {
              // Game started, redirect to live scoreboard
              onJoinGame(joinedGame.id);
            }
          }
        )
        .subscribe();

      fetchPlayers();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [joinedGame, onJoinGame]);

  const fetchPlayers = async () => {
    if (!joinedGame) return;

    const { data, error } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', joinedGame.id)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    setPlayers(data || []);
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !gameCode.trim()) return;

    setIsJoining(true);
    try {
      // Find the game by code
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('game_code', gameCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (gameError || !gameData) {
        throw new Error('Game not found or already started');
      }

      // Check if user is already in this game
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameData.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        // User is already in the game, just show the lobby
        setJoinedGame(gameData);
        toast({
          title: "Welcome back!",
          description: `You're already in ${gameData.course_name}`,
        });
        return;
      }

      // Check if game is full
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameData.id);

      if (count && count >= gameData.max_players) {
        throw new Error('Game is full');
      }

      // Add user to the game
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: gameData.id,
          user_id: user.id,
          player_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Player',
          handicap: user.user_metadata?.handicap || 18,
          is_host: false
        });

      if (joinError) throw joinError;

      setJoinedGame(gameData);
      toast({
        title: "Successfully joined game!",
        description: `Welcome to ${gameData.course_name}`,
      });

    } catch (error: any) {
      toast({
        title: "Failed to join game",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (joinedGame) {
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
            <div>
              <h1 className="text-3xl font-bold text-green-800">{joinedGame.course_name}</h1>
              <p className="text-green-600">Waiting for host to start the game...</p>
            </div>
          </div>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Users className="w-5 h-5" />
                Players ({players.length}/{joinedGame.max_players})
              </CardTitle>
              <CardDescription>Game will start when the host is ready</CardDescription>
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
                        {player.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <span className="text-sm text-green-600">Handicap: {player.handicap}</span>
                    </div>
                  </div>
                ))}

                {players.length < joinedGame.max_players && (
                  <div className="p-3 border-2 border-dashed border-green-300 rounded-lg text-center">
                    <UserPlus className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-green-600 text-sm">Waiting for more players...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-md mx-auto">
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
          <h1 className="text-3xl font-bold text-green-800">Join Game</h1>
        </div>

        <Card className="border-green-200">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-2xl text-green-800">Enter Game Code</CardTitle>
            <CardDescription className="text-green-600">
              Ask the host for the game code to join their round
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinGame} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="game-code">Game Code</Label>
                <Input
                  id="game-code"
                  type="text"
                  placeholder="Enter game code (e.g., GOLF12345)"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono"
                  required
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                disabled={isJoining || !gameCode.trim()}
              >
                {isJoining ? 'Joining Game...' : 'Join Game'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-green-600">
            Don't have a game code? Ask the host to share their game link with you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinGameLobby;
