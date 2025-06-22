import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Calendar, Users, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GameHistoryProps {
  onBack: () => void;
}

interface HistoryGame {
  id: string;
  course_name: string;
  game_code: string;
  status: string;
  created_at: string;
  completed_at: string;
  player_count: number;
  is_host: boolean;
  number_of_holes: number;
}

interface GameDetails {
  game: HistoryGame;
  players: any[];
  scores: any[];
  leaderboard: any[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [games, setGames] = useState<HistoryGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameHistory();
  }, [user]);

  const fetchGameHistory = async () => {
    if (!user) return;

    try {
      const { data: playerGames, error } = await supabase
        .from('game_players')
        .select(`
          game_id,
          is_host,
          games!inner (
            id,
            course_name,
            game_code,
            status,
            created_at,
            completed_at,
            number_of_holes
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get player counts for each game
      const gameIds = playerGames?.map(pg => pg.game_id) || [];
      const { data: playerCounts } = await supabase
        .from('game_players')
        .select('game_id')
        .in('game_id', gameIds);

      const gameHistory = playerGames?.map(pg => ({
        id: pg.games.id,
        course_name: pg.games.course_name,
        game_code: pg.games.game_code,
        status: pg.games.status,
        created_at: pg.games.created_at,
        completed_at: pg.games.completed_at,
        is_host: pg.is_host,
        player_count: playerCounts?.filter(pc => pc.game_id === pg.game_id).length || 0,
        number_of_holes: pg.games.number_of_holes
      })) || [];

      setGames(gameHistory);
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameDetails = async (gameId: string) => {
    try {
      // Fetch game details
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      // Fetch players
      const { data: players } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true });

      // Fetch scores
      const { data: scores } = await supabase
        .from('scores')
        .select('*')
        .eq('game_id', gameId)
        .order('hole_number', { ascending: true });

      // Calculate leaderboard
      const leaderboard = players?.map(player => {
        const playerScores = scores?.filter(s => s.user_id === player.user_id) || [];
        const total = playerScores.reduce((sum, score) => sum + score.strokes, 0);
        const netScore = total > 0 ? total - player.handicap : 0;
        
        return {
          ...player,
          total_strokes: total,
          net_score: netScore,
          holes_played: playerScores.length
        };
      }).sort((a, b) => {
        if (a.net_score === 0 && b.net_score === 0) return 0;
        if (a.net_score === 0) return 1;
        if (b.net_score === 0) return -1;
        return a.net_score - b.net_score;
      }) || [];

      const historyGame = games.find(g => g.id === game?.id);
      if (historyGame && game) {
        historyGame.number_of_holes = game.number_of_holes || 18;
      }

      setSelectedGame({
        game: historyGame!,
        players: players || [],
        scores: scores || [],
        leaderboard
      });
    } catch (error) {
      console.error('Error fetching game details:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>;
      case 3: return <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>;
      default: return <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{rank}</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800">Loading game history...</p>
        </div>
      </div>
    );
  }

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedGame(null)}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-green-800">{selectedGame.game.course_name}</h1>
              <p className="text-green-600">Final Leaderboard</p>
            </div>
          </div>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Trophy className="w-5 h-5" />
                Final Results
              </CardTitle>
              <CardDescription>
                Game completed on {formatDate(selectedGame.game.completed_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedGame.leaderboard.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRankIcon(index + 1)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-800">{player.player_name}</span>
                          {player.is_host && (
                            <Badge variant="secondary" className="bg-green-600 text-white text-xs">Host</Badge>
                          )}
                          {player.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <span className="text-sm text-green-600">Handicap: {player.handicap}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          Holes: {player.holes_played}/{selectedGame.game.number_of_holes || 18}
                        </span>
                        <span className="text-green-600">Total: {player.total_strokes || 0}</span>
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          Net: {player.net_score || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold text-green-800">Game History</h1>
        </div>

        {games.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="text-center py-12">
              <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-green-800 mb-2">No Games Yet</h3>
              <p className="text-green-600 mb-6">Start playing to see your game history here!</p>
              <Button onClick={onBack} className="bg-green-600 hover:bg-green-700">
                Create Your First Game
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <Card key={game.id} className="border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-green-800">{game.course_name}</h3>
                        <Badge 
                          variant={game.status === 'completed' ? 'default' : 'secondary'}
                          className={game.status === 'completed' ? 'bg-green-600 text-white' : ''}
                        >
                          {game.status === 'completed' ? 'Completed' : 
                           game.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                        </Badge>
                        {game.is_host && (
                          <Badge variant="outline" className="text-xs">Host</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-green-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(game.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {game.player_count} players
                        </div>
                        <span>Code: {game.game_code}</span>
                      </div>
                    </div>
                    {game.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchGameDetails(game.id)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHistory;
