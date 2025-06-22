
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LiveScorecardProps {
  gameId: string;
  onEndGame: () => void;
}

interface Game {
  id: string;
  course_name: string;
  game_code: string;
  number_of_holes: number;
  status: string;
}

interface Player {
  id: string;
  user_id: string;
  player_name: string;
  handicap: number;
  is_host: boolean;
}

interface Score {
  hole_number: number;
  strokes: number;
  par: number;
}

const LiveScorecard: React.FC<LiveScorecardProps> = ({ gameId, onEndGame }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<{ [playerId: string]: Score[] }>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameData();
    fetchPlayers();
    fetchScores();

    // Set up real-time subscriptions
    const gameSubscription = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'scores', filter: `game_id=eq.${gameId}` },
        () => {
          fetchScores();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameSubscription);
    };
  }, [gameId]);

  const fetchGameData = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Error fetching game:', error);
      toast({
        title: "Error loading game",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setGame(data);
  };

  const fetchPlayers = async () => {
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

  const fetchScores = async () => {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .order('hole_number', { ascending: true });

    if (error) {
      console.error('Error fetching scores:', error);
      return;
    }

    // Organize scores by player
    const scoresByPlayer: { [playerId: string]: Score[] } = {};
    
    data?.forEach(score => {
      if (!scoresByPlayer[score.user_id]) {
        scoresByPlayer[score.user_id] = Array(game?.number_of_holes || 18).fill(null).map((_, i) => ({
          hole_number: i + 1,
          strokes: 0,
          par: 4
        }));
      }
      
      const holeIndex = score.hole_number - 1;
      if (holeIndex >= 0 && holeIndex < scoresByPlayer[score.user_id].length) {
        scoresByPlayer[score.user_id][holeIndex] = {
          hole_number: score.hole_number,
          strokes: score.strokes,
          par: score.par
        };
      }
    });

    // Initialize scores for players who haven't scored yet
    players.forEach(player => {
      if (!scoresByPlayer[player.user_id]) {
        scoresByPlayer[player.user_id] = Array(game?.number_of_holes || 18).fill(null).map((_, i) => ({
          hole_number: i + 1,
          strokes: 0,
          par: 4
        }));
      }
    });

    setScores(scoresByPlayer);
    setLoading(false);
  };

  const updateScore = async (playerId: string, holeNumber: number, strokes: number) => {
    if (!user || playerId !== user.id) return;

    try {
      const { error } = await supabase
        .from('scores')
        .upsert({
          game_id: gameId,
          user_id: playerId,
          hole_number: holeNumber,
          strokes: strokes,
          par: 4
        });

      if (error) throw error;

      // Update local state
      setScores(prev => ({
        ...prev,
        [playerId]: prev[playerId].map(score => 
          score.hole_number === holeNumber 
            ? { ...score, strokes }
            : score
        )
      }));

    } catch (error: any) {
      toast({
        title: "Error updating score",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateTotals = (playerScores: Score[]) => {
    const out = playerScores.slice(0, 9).reduce((sum, score) => sum + (score?.strokes || 0), 0);
    const in_ = playerScores.slice(9, 18).reduce((sum, score) => sum + (score?.strokes || 0), 0);
    const total = out + in_;
    return { out, in: in_, total };
  };

  const getLeaderboard = () => {
    return players
      .map((player) => {
        const playerScores = scores[player.user_id] || [];
        const totals = calculateTotals(playerScores);
        const netScore = totals.total > 0 ? totals.total - player.handicap : 0;
        return {
          ...player,
          scores: playerScores,
          ...totals,
          netScore
        };
      })
      .filter(player => player.total > 0)
      .sort((a, b) => a.netScore - b.netScore);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-green-600 font-bold">{rank}</span>;
    }
  };

  const handleEndGame = async () => {
    if (!game || !players.find(p => p.user_id === user?.id && p.is_host)) {
      toast({
        title: "Only the host can end the game",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game ended successfully!",
        description: "Thanks for playing!"
      });

      onEndGame();
    } catch (error: any) {
      toast({
        title: "Error ending game",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">{game.course_name}</h1>
            <p className="text-green-600">Game Code: {game.game_code}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="border-green-600 text-green-600"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
            </Button>
            <Button onClick={handleEndGame} className="bg-red-600 hover:bg-red-700">
              End Game
            </Button>
          </div>
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Trophy className="w-5 h-5" />
                Live Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getLeaderboard().map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRankIcon(index + 1)}
                      <span className="font-medium text-green-800">{player.player_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">Total: {player.total}</span>
                      <span className="text-green-600">Handicap: {player.handicap}</span>
                      <Badge variant="secondary" className="bg-green-600 text-white">
                        Net: {player.netScore}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scorecard */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Flag className="w-5 h-5" />
              Live Scorecard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-green-200">
                    <th className="text-left p-2 text-green-800">Player</th>
                    {Array.from({ length: Math.min(9, game.number_of_holes) }, (_, i) => (
                      <th key={i + 1} className="text-center p-2 min-w-[40px] text-green-800">
                        {i + 1}
                      </th>
                    ))}
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">OUT</th>
                    {game.number_of_holes > 9 && Array.from({ length: Math.min(9, game.number_of_holes - 9) }, (_, i) => (
                      <th key={i + 10} className="text-center p-2 min-w-[40px] text-green-800">
                        {i + 10}
                      </th>
                    ))}
                    {game.number_of_holes > 9 && (
                      <th className="text-center p-2 bg-green-100 text-green-800 font-bold">IN</th>
                    )}
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">TOTAL</th>
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">HCP</th>
                    <th className="text-center p-2 bg-yellow-100 text-green-800 font-bold">NET</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => {
                    const playerScores = scores[player.user_id] || [];
                    const totals = calculateTotals(playerScores);
                    const netScore = totals.total > 0 ? totals.total - player.handicap : 0;
                    
                    return (
                      <tr key={player.id} className="border-b border-green-100 hover:bg-green-25">
                        <td className="p-2 font-medium text-green-800">
                          {player.player_name}
                          {player.is_host && <Badge variant="secondary" className="ml-2 text-xs">Host</Badge>}
                        </td>
                        {/* Front 9 */}
                        {playerScores.slice(0, Math.min(9, game.number_of_holes)).map((score, index) => (
                          <td key={`${player.id}-${index}`} className="text-center p-1">
                            {player.user_id === user?.id ? (
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={score?.strokes || ''}
                                onChange={(e) => updateScore(player.user_id, index + 1, parseInt(e.target.value) || 0)}
                                className="w-12 h-8 text-center border-green-300 focus:border-green-500"
                              />
                            ) : (
                              <span className={`${(score?.strokes || 0) === 0 ? 'text-gray-400' : 'text-green-800'} font-medium`}>
                                {score?.strokes || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="text-center p-2 bg-green-50 font-bold text-green-800">
                          {totals.out || '-'}
                        </td>
                        {/* Back 9 */}
                        {game.number_of_holes > 9 && playerScores.slice(9, game.number_of_holes).map((score, index) => (
                          <td key={`${player.id}-${index + 9}`} className="text-center p-1">
                            {player.user_id === user?.id ? (
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={score?.strokes || ''}
                                onChange={(e) => updateScore(player.user_id, index + 10, parseInt(e.target.value) || 0)}
                                className="w-12 h-8 text-center border-green-300 focus:border-green-500"
                              />
                            ) : (
                              <span className={`${(score?.strokes || 0) === 0 ? 'text-gray-400' : 'text-green-800'} font-medium`}>
                                {score?.strokes || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        {game.number_of_holes > 9 && (
                          <td className="text-center p-2 bg-green-50 font-bold text-green-800">
                            {totals.in || '-'}
                          </td>
                        )}
                        <td className="text-center p-2 bg-green-100 font-bold text-green-800">
                          {totals.total || '-'}
                        </td>
                        <td className="text-center p-2 bg-green-100 font-medium text-green-700">
                          {player.handicap}
                        </td>
                        <td className="text-center p-2 bg-yellow-100 font-bold text-green-800">
                          {netScore || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 text-center">
          <p className="text-green-600">
            Enter your scores for each hole. Other players' scores will update automatically in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveScorecard;
