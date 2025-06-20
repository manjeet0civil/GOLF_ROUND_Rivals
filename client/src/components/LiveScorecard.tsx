import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, ArrowLeft, Flag, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface LiveScorecardProps {
  gameData: any;
  onEndGame: () => void;
  currentUser: any;
}

const LiveScorecard: React.FC<LiveScorecardProps> = ({ gameData, onEndGame, currentUser }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHole, setSelectedHole] = useState(1);
  const [scoreInput, setScoreInput] = useState<{ [key: string]: string }>({});

  // Get live scores
  const { data: scoresData, refetch: refetchScores } = useQuery({
    queryKey: [`/api/games/${gameData.id}/scores`],
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
  });

  // Get leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: [`/api/games/${gameData.id}/leaderboard`],
    refetchInterval: 3000,
  });

  // Update score mutation
  const updateScoreMutation = useMutation({
    mutationFn: (scoreData: any) =>
      apiRequest(`/api/games/${gameData.id}/scores`, {
        method: 'POST',
        body: JSON.stringify(scoreData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameData.id}/scores`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameData.id}/leaderboard`] });
      toast({
        title: "Score updated!",
        description: `Hole ${selectedHole} score saved`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update score",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete game mutation
  const completeGameMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/games/${gameData.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ playerId: currentUser.id }),
      }),
    onSuccess: () => {
      toast({
        title: "Game completed!",
        description: "Results have been saved to your history",
      });
      onEndGame();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScoreUpdate = (hole: number, strokes: number, par: number) => {
    updateScoreMutation.mutate({
      playerId: currentUser.id,
      hole,
      strokes,
      par,
    });
  };

  const getPlayerScores = (playerId: number) => {
    if (!scoresData?.scores) return [];
    return scoresData.scores
      .filter((score: any) => score.playerId === playerId)
      .sort((a: any, b: any) => a.hole - b.hole);
  };

  const calculateTotals = (scores: any[]) => {
    const front9 = scores.slice(0, 9);
    const back9 = scores.slice(9, 18);
    
    const frontTotal = front9.reduce((sum, score) => sum + (score.strokes || 0), 0);
    const backTotal = back9.reduce((sum, score) => sum + (score.strokes || 0), 0);
    const total = frontTotal + backTotal;
    
    const frontPar = front9.reduce((sum, score) => sum + score.par, 0);
    const backPar = back9.reduce((sum, score) => sum + score.par, 0);
    const totalPar = frontPar + backPar;
    
    return {
      front: frontTotal,
      back: backTotal,
      total,
      toPar: total - totalPar,
      holesPlayed: scores.filter(s => s.strokes !== null).length
    };
  };

  const getScoreClass = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return 'text-blue-600 font-bold'; // Eagle or better
    if (diff === -1) return 'text-green-600 font-bold'; // Birdie
    if (diff === 0) return 'text-gray-800'; // Par
    if (diff === 1) return 'text-orange-600'; // Bogey
    return 'text-red-600'; // Double bogey or worse
  };

  const quickScoreUpdate = (change: number) => {
    const currentScores = getPlayerScores(currentUser.id);
    const holeScore = currentScores.find(s => s.hole === selectedHole);
    if (holeScore) {
      const newStrokes = Math.max(1, (holeScore.strokes || holeScore.par) + change);
      handleScoreUpdate(selectedHole, newStrokes, holeScore.par);
    }
  };

  // Standard golf hole pars
  const standardPars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onEndGame}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              End Game
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-green-800">{gameData.courseName}</h1>
              <p className="text-green-600">Live Scorecard</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Hole {selectedHole} of 18
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score Entry */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Score Entry - Hole {selectedHole}
                </CardTitle>
                <CardDescription>
                  Par {standardPars[selectedHole - 1]} | Enter your score for this hole
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Hole Navigation */}
                <div className="grid grid-cols-9 gap-2 mb-6">
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
                    <Button
                      key={hole}
                      variant={hole === selectedHole ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedHole(hole)}
                      className={`${hole === selectedHole ? 'bg-green-600' : ''} ${hole <= 9 ? 'border-t-4 border-t-blue-500' : 'border-t-4 border-t-orange-500'}`}
                    >
                      {hole}
                    </Button>
                  ))}
                </div>

                {/* Quick Score Entry */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => quickScoreUpdate(-1)}
                      disabled={updateScoreMutation.isPending}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-800">
                        {(() => {
                          const scores = getPlayerScores(currentUser.id);
                          const holeScore = scores.find(s => s.hole === selectedHole);
                          return holeScore?.strokes || standardPars[selectedHole - 1];
                        })()}
                      </div>
                      <p className="text-sm text-gray-600">Strokes</p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => quickScoreUpdate(1)}
                      disabled={updateScoreMutation.isPending}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Common Scores */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Eagle', strokes: standardPars[selectedHole - 1] - 2, color: 'bg-blue-100 text-blue-800' },
                      { label: 'Birdie', strokes: standardPars[selectedHole - 1] - 1, color: 'bg-green-100 text-green-800' },
                      { label: 'Par', strokes: standardPars[selectedHole - 1], color: 'bg-gray-100 text-gray-800' },
                      { label: 'Bogey', strokes: standardPars[selectedHole - 1] + 1, color: 'bg-orange-100 text-orange-800' },
                    ].map((scoreType) => (
                      <Button
                        key={scoreType.label}
                        variant="outline"
                        className={`h-16 flex flex-col ${scoreType.color}`}
                        onClick={() => handleScoreUpdate(selectedHole, scoreType.strokes, standardPars[selectedHole - 1])}
                        disabled={updateScoreMutation.isPending}
                      >
                        <span className="font-bold">{scoreType.strokes}</span>
                        <span className="text-xs">{scoreType.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Scorecard */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Scorecard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Hole</th>
                        {Array.from({ length: 9 }, (_, i) => i + 1).map((hole) => (
                          <th key={hole} className="text-center p-2 font-mono">{hole}</th>
                        ))}
                        <th className="text-center p-2 font-bold">OUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Par</td>
                        {standardPars.slice(0, 9).map((par, i) => (
                          <td key={i} className="text-center p-2">{par}</td>
                        ))}
                        <td className="text-center p-2 font-bold">
                          {standardPars.slice(0, 9).reduce((sum, par) => sum + par, 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Score</td>
                        {(() => {
                          const scores = getPlayerScores(currentUser.id);
                          return standardPars.slice(0, 9).map((par, i) => {
                            const holeScore = scores.find(s => s.hole === i + 1);
                            const strokes = holeScore?.strokes;
                            return (
                              <td key={i} className={`text-center p-2 ${strokes ? getScoreClass(strokes, par) : ''}`}>
                                {strokes || '-'}
                              </td>
                            );
                          });
                        })()}
                        <td className="text-center p-2 font-bold">
                          {calculateTotals(getPlayerScores(currentUser.id)).front || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Hole</th>
                        {Array.from({ length: 9 }, (_, i) => i + 10).map((hole) => (
                          <th key={hole} className="text-center p-2 font-mono">{hole}</th>
                        ))}
                        <th className="text-center p-2 font-bold">IN</th>
                        <th className="text-center p-2 font-bold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Par</td>
                        {standardPars.slice(9, 18).map((par, i) => (
                          <td key={i} className="text-center p-2">{par}</td>
                        ))}
                        <td className="text-center p-2 font-bold">
                          {standardPars.slice(9, 18).reduce((sum, par) => sum + par, 0)}
                        </td>
                        <td className="text-center p-2 font-bold">
                          {standardPars.reduce((sum, par) => sum + par, 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Score</td>
                        {(() => {
                          const scores = getPlayerScores(currentUser.id);
                          return standardPars.slice(9, 18).map((par, i) => {
                            const holeScore = scores.find(s => s.hole === i + 10);
                            const strokes = holeScore?.strokes;
                            return (
                              <td key={i} className={`text-center p-2 ${strokes ? getScoreClass(strokes, par) : ''}`}>
                                {strokes || '-'}
                              </td>
                            );
                          });
                        })()}
                        <td className="text-center p-2 font-bold">
                          {calculateTotals(getPlayerScores(currentUser.id)).back || '-'}
                        </td>
                        <td className="text-center p-2 font-bold">
                          {calculateTotals(getPlayerScores(currentUser.id)).total || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Live Leaderboard
                </CardTitle>
                <CardDescription>
                  Updated in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard?.map((player: any, index: number) => (
                    <div
                      key={player.playerId}
                      className={`p-3 rounded-lg border ${
                        player.playerId === currentUser.id 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{player.playerName}</p>
                            <p className="text-sm text-gray-600">
                              HCP: {player.handicap}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {player.totalStrokes > 0 ? (
                              player.netScore > 0 ? `+${player.netScore}` : player.netScore
                            ) : 'E'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {player.holesPlayed}/18 holes
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Stats & Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Game Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Course Par</span>
                    <span className="font-medium">{gameData.coursePar}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Players</span>
                    <span className="font-medium">{leaderboard?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your Progress</span>
                    <span className="font-medium">
                      {calculateTotals(getPlayerScores(currentUser.id)).holesPlayed}/18
                    </span>
                  </div>
                  
                  {/* Complete Game Button (only for host) */}
                  {gameData.hostId === currentUser.id && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => completeGameMutation.mutate()}
                        disabled={completeGameMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {completeGameMutation.isPending ? 'Completing Game...' : 'Complete Game & Save Results'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        This will end the game for all players and save final results
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScorecard;