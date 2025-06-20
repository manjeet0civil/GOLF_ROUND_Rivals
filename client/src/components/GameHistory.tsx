
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Calendar, Users, Flag, ArrowLeft } from 'lucide-react';

interface GameHistoryProps {
  currentUser: any;
  onBack: () => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ currentUser, onBack }) => {
  const [gameHistory, setGameHistory] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  // Generate mock game history data
  useEffect(() => {
    const mockHistory = [
      {
        id: '1',
        courseName: 'Augusta National',
        gameCode: 'AUG123',
        date: '2024-06-15',
        status: 'completed',
        playerCount: 4,
        isHost: true,
        finalLeaderboard: [
          { id: currentUser?.id, name: currentUser?.name, total: 74, handicap: 12, netScore: 62, rank: 1 },
          { id: '2', name: 'Tiger Woods', total: 70, handicap: 5, netScore: 65, rank: 2 },
          { id: '3', name: 'Rory McIlroy', total: 72, handicap: 3, netScore: 69, rank: 3 },
          { id: '4', name: 'Jordan Spieth', total: 76, handicap: 6, netScore: 70, rank: 4 }
        ]
      },
      {
        id: '2',
        courseName: 'Pebble Beach',
        gameCode: 'PEB456',
        date: '2024-06-10',
        status: 'completed',
        playerCount: 3,
        isHost: false,
        finalLeaderboard: [
          { id: '5', name: 'Phil Mickelson', total: 68, handicap: 4, netScore: 64, rank: 1 },
          { id: currentUser?.id, name: currentUser?.name, total: 78, handicap: 12, netScore: 66, rank: 2 },
          { id: '6', name: 'Dustin Johnson', total: 75, handicap: 2, netScore: 73, rank: 3 }
        ]
      },
      {
        id: '3',
        courseName: 'St. Andrews',
        gameCode: 'STA789',
        date: '2024-06-05',
        status: 'completed',
        playerCount: 2,
        isHost: true,
        finalLeaderboard: [
          { id: '7', name: 'Jon Rahm', total: 71, handicap: 1, netScore: 70, rank: 1 },
          { id: currentUser?.id, name: currentUser?.name, total: 82, handicap: 12, netScore: 70, rank: 1 }
        ]
      }
    ];
    setGameHistory(mockHistory);
  }, [currentUser]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-green-600 font-bold">{rank}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedGame(null)}
              className="border-green-600 text-green-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-green-800">{selectedGame.courseName}</h1>
              <p className="text-green-600">Final Leaderboard - {formatDate(selectedGame.date)}</p>
            </div>
          </div>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Trophy className="w-5 h-5" />
                Final Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedGame.finalLeaderboard.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getRankIcon(player.rank)}
                      <div>
                        <span className="font-medium text-green-800">{player.name}</span>
                        {player.id === currentUser?.id && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">You</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-green-600">Total</div>
                        <div className="font-bold text-green-800">{player.total}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600">Handicap</div>
                        <div className="font-medium text-green-700">{player.handicap}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600">Net Score</div>
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          {player.netScore}
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-green-600 text-green-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-green-800">Game History</h1>
            <p className="text-green-600">View your past golf rounds and results</p>
          </div>
        </div>

        {gameHistory.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="text-center py-12">
              <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">No Games Yet</h3>
              <p className="text-green-600">Start playing to see your game history here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {gameHistory.map((game) => (
              <Card key={game.id} className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <Flag className="w-8 h-8 text-green-600 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-green-800">{game.courseName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-green-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(game.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {game.playerCount} players
                          </div>
                          <Badge variant={game.isHost ? "default" : "secondary"} className="text-xs">
                            {game.isHost ? "Host" : "Player"}
                          </Badge>
                        </div>
                        <p className="text-xs text-green-500 mt-1">Game Code: {game.gameCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {getRankIcon(game.finalLeaderboard.find(p => p.id === currentUser?.id)?.rank || 1)}
                        <span className="text-sm font-medium text-green-800">
                          Your Finish: #{game.finalLeaderboard.find(p => p.id === currentUser?.id)?.rank}
                        </span>
                      </div>
                      <Button
                        onClick={() => setSelectedGame(game)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        View Results
                      </Button>
                    </div>
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
