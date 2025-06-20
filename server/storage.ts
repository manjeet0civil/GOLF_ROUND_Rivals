import { 
  users, games, gamePlayers, scorecards,
  type User, type InsertUser,
  type Game, type InsertGame,
  type GamePlayer, type InsertGamePlayer,
  type Scorecard, type InsertScorecard
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getGameByCode(gameCode: string): Promise<Game | undefined>;
  updateGameStatus(id: number, status: string): Promise<void>;
  getGamesByHost(hostId: number): Promise<Game[]>;
  
  // Game player operations
  addPlayerToGame(gamePlayer: InsertGamePlayer): Promise<GamePlayer>;
  getGamePlayers(gameId: number): Promise<(GamePlayer & { player: User })[]>;
  getPlayerGames(playerId: number): Promise<(GamePlayer & { game: Game })[]>;
  
  // Scorecard operations
  updateScore(scorecard: InsertScorecard): Promise<Scorecard>;
  getGameScores(gameId: number): Promise<Scorecard[]>;
  getPlayerScores(gameId: number, playerId: number): Promise<Scorecard[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gamePlayers: Map<number, GamePlayer>;
  private scorecards: Map<number, Scorecard>;
  private currentUserId: number;
  private currentGameId: number;
  private currentGamePlayerId: number;
  private currentScorecardId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gamePlayers = new Map();
    this.scorecards = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentGamePlayerId = 1;
    this.currentScorecardId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      handicap: insertUser.handicap || 0 
    };
    this.users.set(id, user);
    return user;
  }

  // Game operations
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const gameCode = this.generateGameCode();
    const game: Game = {
      ...insertGame,
      id,
      gameCode,
      coursePar: insertGame.coursePar || 72,
      maxPlayers: insertGame.maxPlayers || 4,
      status: "waiting",
      createdAt: new Date(),
      completedAt: null
    };
    this.games.set(id, game);
    
    // Add host as first player
    await this.addPlayerToGame({ gameId: id, playerId: insertGame.hostId });
    
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByCode(gameCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.gameCode === gameCode,
    );
  }

  async updateGameStatus(id: number, status: string): Promise<void> {
    const game = this.games.get(id);
    if (game) {
      game.status = status;
      if (status === "completed") {
        game.completedAt = new Date();
      }
    }
  }

  async getGamesByHost(hostId: number): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.hostId === hostId,
    );
  }

  // Game player operations
  async addPlayerToGame(insertGamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const id = this.currentGamePlayerId++;
    const gamePlayer: GamePlayer = {
      ...insertGamePlayer,
      id,
      joinedAt: new Date()
    };
    this.gamePlayers.set(id, gamePlayer);
    return gamePlayer;
  }

  async getGamePlayers(gameId: number): Promise<(GamePlayer & { player: User })[]> {
    const players = Array.from(this.gamePlayers.values())
      .filter((gp) => gp.gameId === gameId);
    
    return players.map(gp => ({
      ...gp,
      player: this.users.get(gp.playerId)!
    }));
  }

  async getPlayerGames(playerId: number): Promise<(GamePlayer & { game: Game })[]> {
    const playerGames = Array.from(this.gamePlayers.values())
      .filter((gp) => gp.playerId === playerId);
    
    return playerGames.map(gp => ({
      ...gp,
      game: this.games.get(gp.gameId)!
    }));
  }

  // Scorecard operations
  async updateScore(insertScorecard: InsertScorecard): Promise<Scorecard> {
    // Find existing scorecard for this player/game/hole
    const existing = Array.from(this.scorecards.values()).find(
      (sc) => sc.gameId === insertScorecard.gameId && 
              sc.playerId === insertScorecard.playerId && 
              sc.hole === insertScorecard.hole
    );

    if (existing) {
      existing.strokes = insertScorecard.strokes ?? null;
      existing.updatedAt = new Date();
      return existing;
    } else {
      const id = this.currentScorecardId++;
      const scorecard: Scorecard = {
        ...insertScorecard,
        id,
        strokes: insertScorecard.strokes ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.scorecards.set(id, scorecard);
      return scorecard;
    }
  }

  async getGameScores(gameId: number): Promise<Scorecard[]> {
    return Array.from(this.scorecards.values())
      .filter((sc) => sc.gameId === gameId);
  }

  async getPlayerScores(gameId: number, playerId: number): Promise<Scorecard[]> {
    return Array.from(this.scorecards.values())
      .filter((sc) => sc.gameId === gameId && sc.playerId === playerId)
      .sort((a, b) => a.hole - b.hole);
  }

  private generateGameCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    const existing = Array.from(this.games.values()).find(g => g.gameCode === result);
    if (existing) {
      return this.generateGameCode(); // Retry if duplicate
    }
    
    return result;
  }
}

export const storage = new MemStorage();
