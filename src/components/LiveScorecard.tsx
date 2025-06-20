
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveScorecardProps {
  gameData: any;
  onEndGame: () => void;
  currentUser: any;
}

const LiveScorecard: React.FC<LiveScorecardProps> = ({ gameData, onEndGame, currentUser }) => {
  const { toast } = useToast();
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState<{ [playerId: string]: number[] }>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Initialize scores
  useEffect(() => {
    const initialScores = {};
    gameData.players.forEach((player: any) => {
      initialScores[player.id] = Array(18).fill(0);
    });
    setScores(initialScores);
  }, [gameData.players]);

  // Simulate other players entering scores
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentHole <= 18) {
        setScores(prev => {
          const newScores = { ...prev };
          gameData.players.forEach((player: any) => {
            if (player.id !== currentUser?.id && Math.random() > 0.7) {
              const holeIndex = Math.floor(Math.random() * Math.min(currentHole, 18));
              if (newScores[player.id][holeIndex] === 0) {
                const par = gameData.course.holes[holeIndex].par;
                newScores[player.id][holeIndex] = par + Math.floor(Math.random() * 3) - 1;
              }
            }
          });
          return newScores;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentHole, currentUser?.id, gameData.players, gameData.course.holes]);

  const updateScore = (playerId: string, holeIndex: number, strokes: number) => {
    setScores(prev => ({
      ...prev,
      [playerId]: prev[playerId].map((score, index) => 
        index === holeIndex ? strokes : score
      )
    }));
  };

  const calculateTotals = (playerScores: number[]) => {
    const out = playerScores.slice(0, 9).reduce((sum, score) => sum + score, 0);
    const in_ = playerScores.slice(9, 18).reduce((sum, score) => sum + score, 0);
    const total = out + in_;
    return { out, in: in_, total };
  };

  const getLeaderboard = () => {
    return gameData.players
      .map((player: any) => {
        const playerScores = scores[player.id] || Array(18).fill(0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">{gameData.course.name}</h1>
            <p className="text-green-600">Game Code: {gameData.gameCode}</p>
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
            <Button onClick={onEndGame} className="bg-red-600 hover:bg-red-700">
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
                      <span className="font-medium text-green-800">{player.name}</span>
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
                    {gameData.course.holes.slice(0, 9).map((hole: any) => (
                      <th key={hole.number} className="text-center p-2 min-w-[40px] text-green-800">
                        {hole.number}
                      </th>
                    ))}
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">OUT</th>
                    {gameData.course.holes.slice(9, 18).map((hole: any) => (
                      <th key={hole.number} className="text-center p-2 min-w-[40px] text-green-800">
                        {hole.number}
                      </th>
                    ))}
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">IN</th>
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">TOTAL</th>
                    <th className="text-center p-2 bg-green-100 text-green-800 font-bold">HCP</th>
                    <th className="text-center p-2 bg-yellow-100 text-green-800 font-bold">NET</th>
                  </tr>
                  <tr className="border-b border-green-200 bg-green-50">
                    <td className="p-2 font-medium text-green-800">PAR</td>
                    {gameData.course.holes.map((hole: any) => (
                      <td key={`par-${hole.number}`} className="text-center p-2 font-medium text-green-700">
                        {hole.par}
                      </td>
                    ))}
                    <td className="text-center p-2 bg-green-100 font-bold text-green-800">36</td>
                    <td className="text-center p-2 bg-green-100 font-bold text-green-800">36</td>
                    <td className="text-center p-2 bg-green-100 font-bold text-green-800">72</td>
                    <td className="text-center p-2 bg-green-100"></td>
                    <td className="text-center p-2 bg-yellow-100"></td>
                  </tr>
                </thead>
                <tbody>
                  {gameData.players.map((player: any) => {
                    const playerScores = scores[player.id] || Array(18).fill(0);
                    const totals = calculateTotals(playerScores);
                    const netScore = totals.total > 0 ? totals.total - player.handicap : 0;
                    
                    return (
                      <tr key={player.id} className="border-b border-green-100 hover:bg-green-25">
                        <td className="p-2 font-medium text-green-800">
                          {player.name}
                          {player.isHost && <Badge variant="secondary" className="ml-2 text-xs">Host</Badge>}
                        </td>
                        {/* Front 9 */}
                        {playerScores.slice(0, 9).map((score, index) => (
                          <td key={`${player.id}-${index}`} className="text-center p-1">
                            {player.id === currentUser?.id ? (
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={score || ''}
                                onChange={(e) => updateScore(player.id, index, parseInt(e.target.value) || 0)}
                                className="w-12 h-8 text-center border-green-300 focus:border-green-500"
                              />
                            ) : (
                              <span className={`${score === 0 ? 'text-gray-400' : 'text-green-800'} font-medium`}>
                                {score || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="text-center p-2 bg-green-50 font-bold text-green-800">
                          {totals.out || '-'}
                        </td>
                        {/* Back 9 */}
                        {playerScores.slice(9, 18).map((score, index) => (
                          <td key={`${player.id}-${index + 9}`} className="text-center p-1">
                            {player.id === currentUser?.id ? (
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={score || ''}
                                onChange={(e) => updateScore(player.id, index + 9, parseInt(e.target.value) || 0)}
                                className="w-12 h-8 text-center border-green-300 focus:border-green-500"
                              />
                            ) : (
                              <span className={`${score === 0 ? 'text-gray-400' : 'text-green-800'} font-medium`}>
                                {score || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="text-center p-2 bg-green-50 font-bold text-green-800">
                          {totals.in || '-'}
                        </td>
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
            Enter your scores for each hole. Other players' scores will update automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveScorecard;
