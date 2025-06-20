import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface GameHistoryProps {
  currentUser: any;
  onBack: () => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ currentUser, onBack }) => {
  // Get user's game history
  const { data: gameHistory, isLoading } = useQuery({
    queryKey: [`/api/users/${currentUser.id}/games`],
  });

  const getGameResult = (game: any) => {
    // This would be enhanced with actual game results
    const results = ['1st Place', '2nd Place', '3rd Place', '4th Place'];
    return results[Math.floor(Math.random() * results.length)];
  };

  const getScoreSummary = (game: any) => {
    // Mock score data - in real implementation this would come from the API
    const score = Math.floor(Math.random() * 20) + 70;
    const par = game.game?.coursePar || 72;
    const toPar = score - par;
    return { score, toPar };
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
            {gameHistory?.length || 0} Games Played
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">3</p>
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
                  <p className="text-2xl font-bold">74.2</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{gameHistory?.length || 0}</p>
                  <p className="text-sm text-gray-600">Games</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">18</p>
                  <p className="text-sm text-gray-600">Best Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game History List */}
        <div className="space-y-4">
          {gameHistory && gameHistory.length > 0 ? (
            gameHistory.map((gameRecord: any) => {
              const game = gameRecord.game;
              const isHost = game.hostId === currentUser.id;
              const scoreSummary = getScoreSummary(gameRecord);
              
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
                            <p className="text-2xl font-bold text-green-800">
                              {scoreSummary.score}
                            </p>
                            <p className="text-sm text-gray-600">
                              {scoreSummary.toPar > 0 ? `+${scoreSummary.toPar}` : scoreSummary.toPar}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={getGameResult(gameRecord).includes('1st') ? "default" : "outline"}
                              className="mb-2"
                            >
                              {getGameResult(gameRecord)}
                            </Badge>
                            <p className="text-sm text-gray-600">
                              {game.status === 'completed' ? 'Completed' : 'In Progress'}
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

        {gameHistory && gameHistory.length > 0 && (
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