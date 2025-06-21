
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface JoinGameLobbyProps {
  onJoinGame: (gameId: string) => void;
  onBack: () => void;
}

const JoinGameLobby: React.FC<JoinGameLobbyProps> = ({ onJoinGame, onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gameCode, setGameCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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
        // User is already in the game, just join
        onJoinGame(gameData.id);
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

      toast({
        title: "Successfully joined game!",
        description: `Welcome to ${gameData.course_name}`,
      });

      onJoinGame(gameData.id);

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
