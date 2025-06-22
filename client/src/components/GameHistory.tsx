import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Target, Medal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface GameHistoryProps {
  currentUser: any;
  onBack: () => void;
}

interface GameHistoryData {
  history: Array<{
    id: number;
    gameId: number;
    playerId: string;
    totalStrokes: number;
    totalPar: number;
    netScore: number;
    handicap: number;
    position: number;
    isWinner: boolean;
    createdAt: string;
    game: {
      id: number;
      courseName: string;
      coursePar: number;
      maxPlayers: number;
      gameCode: string;
      status: string;
      hostId: string;
      createdAt: string;
      completedAt: string | null;
    };
  }>;
  stats: {
    wins: number;
    totalGames: number;
    avgScore: number;
    bestScore: number;
  };
}

const GameHistory: React.FC<GameHistoryProps> = ({ currentUser, onBack }) => {
  // Get user's game history with authentication
  const { data: gameHistoryData, isLoading, error } = useQuery<GameHistoryData>({
    queryKey: ['/api/users/games'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/users/games', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch game history');
      }

      return response.json();
    },
    enabled: !!currentUser,
  });

  const getGameResult = (gameRecord: any) => {
    if (gameRecord.game?.status === 'completed') {
      return gameRecord.isWinner ? 'Winner' : `${gameRecord.position}${getOrdinalSuffix(gameRecord.position)} Place`;
    } else if (gameRecord.game?.status === 'playing') {
      return 'In Progress';
    } else {
      return 'Waiting';
    }
  };

  const getOrdinalSuffix = (num: number) => {
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getScoreSummary = (gameRecord: any) => {
    if (!gameRecord.game || gameRecord.game.status !== 'completed') {
      return { score: null, toPar: null };
    }
    
    return { 
      score: gameRecord.totalStrokes, 
      toPar: gameRecord.totalStrokes - gameRecord.totalPar 
    };
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  // Use real stats from API
  const stats = gameHistoryData?.stats || {
    wins: 0,
    avgScore: 0,
    totalGames: 0,
    bestScore: 0
  };

  // Format stats for display
  const formatStat = (value: number, isScore: boolean = false) => {
    if (value === 0 && stats.totalGames === 0) {
      return isScore ? 'N/A' : '0';
    }
    return isScore ? value.toFixed(1) : value.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading game history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-semibold">Error loading game history</p>
              <p className="text-sm">{error.message}</p>
            </div>
            <Button onClick={onBack} className="bg-green-600 hover:bg-green-700">
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-green-800">Game History</h1>
              <p className="text-green-600">Your golf scorecard records</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {stats.totalGames} Games Played
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.wins}</p>
                  <p className="text-sm text-gray-600">Wins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatStat(stats.avgScore, true)}</p>
                  <p className="text-sm text-gray-600">Avg Net Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalGames}</p>
                  <p className="text-sm text-gray-600">Games</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{formatStat(stats.bestScore, true)}</p>
                  <p className="text-sm text-gray-600">Best Net Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game History List */}
        <div className="space-y-4">
          {gameHistoryData && gameHistoryData.history.length > 0 ? (
            gameHistoryData.history.map((gameRecord) => {
              const game = gameRecord.game;
              const isHost = game.hostId === currentUser.id;
              const scoreSummary = getScoreSummary(gameRecord);
              const medalIcon = getMedalIcon(gameRecord.position);
              
              return (
                <Card key={gameRecord.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{game.courseName}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(game.createdAt), 'MMM dd, yyyy')}
                            </span>
                            <span>Par {game.coursePar}</span>
                            <Badge variant={isHost ? "default" : "secondary"} className="text-xs">
                              {isHost ? "Host" : "Player"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div>
                            {scoreSummary.score !== null ? (
                              <>
                                <p className="text-2xl font-bold text-green-800">
                                  {scoreSummary.score}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {scoreSummary.toPar !== null && scoreSummary.toPar > 0 ? `+${scoreSummary.toPar}` : scoreSummary.toPar}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-gray-400">--</p>
                                <p className="text-sm text-gray-400">No score</p>
                              </>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              {medalIcon && <span className="text-2xl">{medalIcon}</span>}
                              <Badge 
                                variant={game.status === 'completed' ? "default" : "outline"}
                              >
                                {getGameResult(gameRecord)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Net: {gameRecord.netScore} (Hcp: {gameRecord.handicap})
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Games Yet</h3>
                <p className="text-gray-500 mb-6">
                  Start playing to see your game history and track your progress!
                </p>
                <Button onClick={onBack} className="bg-green-600 hover:bg-green-700">
                  Create Your First Game
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {gameHistoryData && gameHistoryData.history.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Keep playing to improve your handicap and climb the leaderboards!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHistory;