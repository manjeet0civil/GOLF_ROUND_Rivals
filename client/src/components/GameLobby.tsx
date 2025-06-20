import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Users, Play, ArrowLeft, UserPlus, Plus, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface GameLobbyProps {
  onStartGame: (gameInfo: any) => void;
  onBack: () => void;
  currentUser: any;
  onGameJoined?: (gameId: number) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame, onBack, currentUser, onGameJoined }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('create');
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  
  const [gameSettings, setGameSettings] = useState({
    courseName: '',
    coursePar: 72,
    maxPlayers: 4
  });

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: (gameData: any) =>
      apiRequest('/api/games', {
        method: 'POST',
        body: JSON.stringify({
          hostId: currentUser.id,
          ...gameData
        }),
      }),
    onSuccess: (game) => {
      setCurrentGame(game);
      setActiveTab('lobby');
      onGameJoined?.(game.id);
      toast({
        title: "Game created!",
        description: `Game code: ${game.gameCode}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join game mutation
  const joinGameMutation = useMutation({
    mutationFn: (gameCode: string) =>
      apiRequest(`/api/games/${gameCode}/join`, {
        method: 'POST',
        body: JSON.stringify({ playerId: currentUser.id }),
      }),
    onSuccess: (response) => {
      setCurrentGame(response.game);
      setActiveTab('lobby');
      onGameJoined?.(response.game.id);
      toast({
        title: "Joined game!",
        description: `Welcome to ${response.game.courseName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get game info for joining
  const { data: joinGameInfo, isLoading: loadingJoinInfo } = useQuery({
    queryKey: [`/api/games/${joinCode}/join`],
    enabled: joinCode.length === 6,
  });

  // Get current game players
  const { data: gameData, refetch: refetchGame } = useQuery({
    queryKey: [`/api/games/${currentGame?.id}`],
    enabled: !!currentGame?.id,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: (gameId: number) =>
      apiRequest(`/api/games/${gameId}/start`, {
        method: 'POST',
        body: JSON.stringify({ hostId: currentUser.id }),
      }),
    onSuccess: () => {
      toast({
        title: "Game started!",
        description: "Good luck on the course!",
      });
      onStartGame({
        ...currentGame,
        players: gameData?.players || []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameSettings.courseName) {
      toast({
        title: "Missing information",
        description: "Please enter a course name",
        variant: "destructive",
      });
      return;
    }
    createGameMutation.mutate(gameSettings);
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || joinCode.length !== 6) {
      toast({
        title: "Invalid game code",
        description: "Please enter a 6-character game code",
        variant: "destructive",
      });
      return;
    }
    joinGameMutation.mutate(joinCode.toUpperCase());
  };

  const handleStartGame = () => {
    if (currentGame && gameData?.players?.length >= 2) {
      startGameMutation.mutate(currentGame.id);
    }
  };

  const copyGameCode = () => {
    if (currentGame?.gameCode) {
      navigator.clipboard.writeText(currentGame.gameCode);
      toast({
        title: "Game code copied!",
        description: "Share with friends to invite them",
      });
    }
  };

  const copyShareLink = () => {
    if (currentGame?.gameCode) {
      const shareUrl = `${window.location.origin}?join=${currentGame.gameCode}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied!",
        description: "Send to friends so they can join quickly",
      });
    }
  };

  // Check for join code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinParam = urlParams.get('join');
    if (joinParam && joinParam.length === 6) {
      setJoinCode(joinParam.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  if (currentGame && activeTab === 'lobby') {
    const players = gameData?.players || [];
    const isHost = currentGame.hostId === currentUser.id;
    const canStart = isHost && players.length >= 2;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Button>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {currentGame.status === 'waiting' ? 'Waiting for Players' : 'In Progress'}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Play className="w-6 h-6" />
                  {currentGame.courseName}
                </CardTitle>
                <CardDescription>
                  Course Par: {currentGame.coursePar} | Max Players: {currentGame.maxPlayers}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Game Code</p>
                    <p className="text-2xl font-bold text-green-800">{currentGame.gameCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyGameCode}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyShareLink}
                >
                  Copy Share Link
                </Button>

                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    disabled={!canStart || startGameMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {startGameMutation.isPending 
                      ? 'Starting Game...' 
                      : canStart 
                        ? 'Start Game' 
                        : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}`
                    }
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Players ({players.length}/{currentGame.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player: any) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{player.player.name}</p>
                        <p className="text-sm text-gray-600">
                          Handicap: {player.player.handicap || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.playerId === currentGame.hostId && (
                          <Badge variant="outline">Host</Badge>
                        )}
                        {player.playerId === currentUser.id && (
                          <Badge>You</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {players.length < currentGame.maxPlayers && (
                    <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Waiting for players...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-800">Game Setup</CardTitle>
            <CardDescription className="text-center">
              Create a new game or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Game
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Join Game
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-6">
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Pebble Beach Golf Links"
                      value={gameSettings.courseName}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        courseName: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coursePar">Course Par</Label>
                      <Input
                        id="coursePar"
                        type="number"
                        min="60"
                        max="80"
                        value={gameSettings.coursePar}
                        onChange={(e) => setGameSettings(prev => ({ 
                          ...prev, 
                          coursePar: parseInt(e.target.value) 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxPlayers">Max Players</Label>
                      <Input
                        id="maxPlayers"
                        type="number"
                        min="2"
                        max="8"
                        value={gameSettings.maxPlayers}
                        onChange={(e) => setGameSettings(prev => ({ 
                          ...prev, 
                          maxPlayers: parseInt(e.target.value) 
                        }))}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={createGameMutation.isPending}
                  >
                    {createGameMutation.isPending ? 'Creating Game...' : 'Create Game'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="join" className="mt-6">
                <form onSubmit={handleJoinGame} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gameCode">6-Character Game Code</Label>
                    <Input
                      id="gameCode"
                      placeholder="Enter game code (e.g., ABC123)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="text-center text-lg tracking-wider"
                    />
                  </div>

                  {joinGameInfo && (
                    <Card className="bg-green-50">
                      <CardContent className="pt-4">
                        <h4 className="font-medium text-green-800">{joinGameInfo.game.courseName}</h4>
                        <p className="text-sm text-green-600">
                          Players: {joinGameInfo.playerCount}/{joinGameInfo.game.maxPlayers} | 
                          Par: {joinGameInfo.game.coursePar}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={joinGameMutation.isPending || loadingJoinInfo}
                  >
                    {joinGameMutation.isPending ? 'Joining Game...' : 'Join Game'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameLobby;