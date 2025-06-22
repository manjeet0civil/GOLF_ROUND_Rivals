import { 
  users, games, gamePlayers, scorecards, gameResults,
  type User, type InsertUser,
  type Game, type InsertGame,
  type GamePlayer, type InsertGamePlayer,
  type Scorecard, type InsertScorecard,
  type GameResult, type InsertGameResult
} from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zukouymdwikwgldqhvoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a291eW1kd2lrd2dsZHFodm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTIwMDcsImV4cCI6MjA2NjA4ODAwN30.qMk4CrRJiN1IZUoEyk83LskilWXCdi3nrjVBQQaROLo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getGameByCode(gameCode: string): Promise<Game | undefined>;
  updateGameStatus(id: number, status: string): Promise<void>;
  getGamesByHost(hostId: string): Promise<Game[]>;
  
  // Game player operations
  addPlayerToGame(gamePlayer: InsertGamePlayer): Promise<GamePlayer>;
  getGamePlayers(gameId: number): Promise<(GamePlayer & { player: User })[]>;
  getPlayerGames(playerId: string): Promise<(GamePlayer & { game: Game })[]>;
  
  // Scorecard operations
  updateScore(scorecard: InsertScorecard): Promise<Scorecard>;
  getGameScores(gameId: number): Promise<Scorecard[]>;
  getPlayerScores(gameId: number, playerId: string): Promise<Scorecard[]>;
  
  // Game results and winning history
  saveGameResults(gameId: number): Promise<GameResult[]>;
  getGameResults(gameId: number): Promise<(GameResult & { player: User })[]>;
  getUserGameHistory(playerId: string): Promise<(GameResult & { game: Game })[]>;
  getUserStats(playerId: string): Promise<{ wins: number; totalGames: number; avgScore: number; bestScore: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gamePlayers: Map<number, GamePlayer>;
  private scorecards: Map<number, Scorecard>;
  private gameResults: Map<number, GameResult[]>;
  private currentUserId: number;
  private currentGameId: number;
  private currentGamePlayerId: number;
  private currentScorecardId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gamePlayers = new Map();
    this.scorecards = new Map();
    this.gameResults = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentGamePlayerId = 1;
    this.currentScorecardId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.supabaseId === supabaseId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      handicap: insertUser.handicap ?? 0,
      createdAt: new Date()
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
      coursePar: insertGame.coursePar ?? 72,
      maxPlayers: insertGame.maxPlayers ?? 4,
      status: "waiting",
      createdAt: new Date(),
      completedAt: null
    };
    this.games.set(id, game);
    
    // Don't automatically add host as player - they need to join like everyone else
    // This allows the host to see the game but not be counted as a player until they join
    
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByCode(gameCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(g => g.gameCode === gameCode);
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

  async getGamesByHost(hostId: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(g => g.hostId === hostId);
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
    const gamePlayers = Array.from(this.gamePlayers.values()).filter(gp => gp.gameId === gameId);
    return gamePlayers.map(gp => {
      const user = Array.from(this.users.values()).find(u => u.supabaseId === gp.playerId);
      if (!user) {
        throw new Error(`User not found for playerId: ${gp.playerId}`);
      }
      return {
        ...gp,
        player: user
      };
    });
  }

  async getPlayerGames(playerId: string): Promise<(GamePlayer & { game: Game })[]> {
    const gamePlayers = Array.from(this.gamePlayers.values()).filter(gp => gp.playerId === playerId);
    return gamePlayers.map(gp => {
      const game = this.games.get(gp.gameId);
      if (!game) {
        throw new Error(`Game not found for gameId: ${gp.gameId}`);
      }
      return {
        ...gp,
        game: game
      };
    });
  }

  // Scorecard operations
  async updateScore(insertScorecard: InsertScorecard): Promise<Scorecard> {
    const existing = Array.from(this.scorecards.values()).find(
      s => s.gameId === insertScorecard.gameId && 
           s.playerId === insertScorecard.playerId && 
           s.hole === insertScorecard.hole
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
    return Array.from(this.scorecards.values()).filter(s => s.gameId === gameId);
  }

  async getPlayerScores(gameId: number, playerId: string): Promise<Scorecard[]> {
    return Array.from(this.scorecards.values())
      .filter(s => s.gameId === gameId && s.playerId === playerId)
      .sort((a, b) => a.hole - b.hole);
  }

  // Game results and winning history
  async saveGameResults(gameId: number): Promise<GameResult[]> {
    // Get all players and their scores for this game
    const players = await this.getGamePlayers(gameId);
    const results: GameResult[] = [];
    
    for (const player of players) {
      const scores = await this.getPlayerScores(gameId, player.playerId);
      
      // Calculate totals - only count holes that have been played (strokes !== null)
      const playedScores = scores.filter(score => score.strokes !== null);
      const totalStrokes = playedScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
      const totalPar = playedScores.reduce((sum, score) => sum + score.par, 0);
      const handicap = player.player.handicap || 0;
      
      // Calculate net score: total strokes - handicap
      const netScore = totalStrokes - handicap;
      
      const result: GameResult = {
        id: this.currentScorecardId++,
        gameId,
        playerId: player.playerId,
        totalStrokes,
        totalPar,
        netScore,
        handicap,
        position: 0, // Will be set after sorting
        isWinner: false, // Will be set after sorting
        createdAt: new Date()
      };
      
      results.push(result);
    }
    
    // Sort by net score (lowest first) and assign positions
    results.sort((a, b) => a.netScore - b.netScore);
    results.forEach((result, index) => {
      result.position = index + 1;
      result.isWinner = index === 0; // First place is winner
    });
    
    // Store results
    this.gameResults.set(gameId, results);
    
    return results;
  }

  async getGameResults(gameId: number): Promise<(GameResult & { player: User })[]> {
    const results = this.gameResults.get(gameId) || [];
    const players = await this.getGamePlayers(gameId);
    
    return results.map(result => {
      const player = players.find(p => p.playerId === result.playerId);
      return {
        ...result,
        player: player?.player || { id: 0, supabaseId: result.playerId, username: 'Unknown', password: '', email: '', name: 'Unknown Player', handicap: 0, createdAt: new Date() }
      };
    });
  }

  async getUserGameHistory(playerId: string): Promise<(GameResult & { game: Game })[]> {
    const allResults: (GameResult & { game: Game })[] = [];
    
    for (const [gameId, results] of Array.from(this.gameResults.entries())) {
      const playerResult = results.find((r: GameResult) => r.playerId === playerId);
      if (playerResult) {
        const game = this.games.get(gameId);
        if (game) {
          allResults.push({
            ...playerResult,
            game
          });
        }
      }
    }
    
    return allResults.sort((a, b) => {
      const dateA = a.game.createdAt ? new Date(a.game.createdAt).getTime() : 0;
      const dateB = b.game.createdAt ? new Date(b.game.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getUserStats(playerId: string): Promise<{ wins: number; totalGames: number; avgScore: number; bestScore: number }> {
    const history = await this.getUserGameHistory(playerId);
    
    const wins = history.filter((r: GameResult & { game: Game }) => r.isWinner).length;
    const totalGames = history.length;
    
    // For new players with no games, return zeros
    if (totalGames === 0) {
      return { 
        wins: 0, 
        totalGames: 0, 
        avgScore: 0, 
        bestScore: 0 
      };
    }
    
    const avgScore = history.reduce((sum, r) => sum + r.netScore, 0) / totalGames;
    const bestScore = Math.min(...history.map(r => r.netScore));
    
    return { wins, totalGames, avgScore, bestScore };
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

export class SupabaseStorage implements IStorage {
  private db: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(client);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.supabaseId, supabaseId));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Game operations
  async createGame(insertGame: InsertGame): Promise<Game> {
    const gameCode = this.generateGameCode();
    const result = await this.db.insert(games).values({
      ...insertGame,
      gameCode,
      coursePar: insertGame.coursePar ?? 72,
      maxPlayers: insertGame.maxPlayers ?? 4,
      status: "waiting"
    }).returning();
    
    const game = result[0];
    
    // Don't automatically add host as player - they need to join like everyone else
    // This allows the host to see the game but not be counted as a player until they join
    
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const result = await this.db.select().from(games).where(eq(games.id, id));
    return result[0];
  }

  async getGameByCode(gameCode: string): Promise<Game | undefined> {
    const result = await this.db.select().from(games).where(eq(games.gameCode, gameCode));
    return result[0];
  }

  async updateGameStatus(id: number, status: string): Promise<void> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    
    await this.db.update(games)
      .set(updateData)
      .where(eq(games.id, id));
  }

  async getGamesByHost(hostId: string): Promise<Game[]> {
    return await this.db.select().from(games).where(eq(games.hostId, hostId));
  }

  // Game player operations
  async addPlayerToGame(insertGamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const result = await this.db.insert(gamePlayers).values(insertGamePlayer).returning();
    return result[0];
  }

  async getGamePlayers(gameId: number): Promise<(GamePlayer & { player: User })[]> {
    const result = await this.db
      .select({
        id: gamePlayers.id,
        gameId: gamePlayers.gameId,
        playerId: gamePlayers.playerId,
        joinedAt: gamePlayers.joinedAt,
        player: users
      })
      .from(gamePlayers)
      .leftJoin(users, eq(gamePlayers.playerId, users.supabaseId))
      .where(eq(gamePlayers.gameId, gameId));

    const players = await Promise.all(result.map(async (row: any) => {
      let playerData = row.player;
      
      // If user profile doesn't exist in our database, create placeholder data
      if (!playerData) {
        playerData = await this.getUserFromSupabase(row.playerId);
      }
      
      return {
        id: row.id,
        gameId: row.gameId,
        playerId: row.playerId,
        joinedAt: row.joinedAt,
        player: playerData
      };
    }));

    return players;
  }

  async getPlayerGames(playerId: string): Promise<(GamePlayer & { game: Game })[]> {
    const result = await this.db
      .select({
        id: gamePlayers.id,
        gameId: gamePlayers.gameId,
        playerId: gamePlayers.playerId,
        joinedAt: gamePlayers.joinedAt,
        game: games
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(eq(gamePlayers.playerId, playerId));
    
    return result.map((row: any) => ({
      id: row.id,
      gameId: row.gameId,
      playerId: row.playerId,
      joinedAt: row.joinedAt,
      game: row.game
    }));
  }

  // Scorecard operations
  async updateScore(insertScorecard: InsertScorecard): Promise<Scorecard> {
    // Check if scorecard already exists
    const existing = await this.db
      .select()
      .from(scorecards)
      .where(and(
        eq(scorecards.gameId, insertScorecard.gameId),
        eq(scorecards.playerId, insertScorecard.playerId),
        eq(scorecards.hole, insertScorecard.hole)
      ));

    if (existing.length > 0) {
      // Update existing scorecard
      const result = await this.db
        .update(scorecards)
        .set({
          strokes: insertScorecard.strokes ?? null,
          updatedAt: new Date()
        })
        .where(eq(scorecards.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new scorecard
      const result = await this.db
        .insert(scorecards)
        .values({
          ...insertScorecard,
          strokes: insertScorecard.strokes ?? null
        })
        .returning();
      return result[0];
    }
  }

  async getGameScores(gameId: number): Promise<Scorecard[]> {
    return await this.db.select().from(scorecards).where(eq(scorecards.gameId, gameId));
  }

  async getPlayerScores(gameId: number, playerId: string): Promise<Scorecard[]> {
    return await this.db
      .select()
      .from(scorecards)
      .where(and(
        eq(scorecards.gameId, gameId),
        eq(scorecards.playerId, playerId)
      ))
      .orderBy(scorecards.hole);
  }

  // Game results and winning history
  async saveGameResults(gameId: number): Promise<GameResult[]> {
    // Get all players and their scores for this game
    const players = await this.getGamePlayers(gameId);
    const results: InsertGameResult[] = [];
    
    for (const player of players) {
      const scores = await this.getPlayerScores(gameId, player.playerId);
      
      // Calculate totals - only count holes that have been played (strokes !== null)
      const playedScores = scores.filter(score => score.strokes !== null);
      const totalStrokes = playedScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
      const totalPar = playedScores.reduce((sum, score) => sum + score.par, 0);
      const handicap = player.player.handicap || 0;
      
      // Calculate net score: total strokes - handicap
      const netScore = totalStrokes - handicap;
      
      const result: InsertGameResult = {
        gameId,
        playerId: player.playerId,
        totalStrokes,
        totalPar,
        netScore,
        handicap,
        position: 0, // Will be set after sorting
        isWinner: false // Will be set after sorting
      };
      
      results.push(result);
    }
    
    // Sort by net score (lowest first) and assign positions
    results.sort((a, b) => a.netScore - b.netScore);
    results.forEach((result, index) => {
      result.position = index + 1;
      result.isWinner = index === 0; // First place is winner
    });
    
    // Save results to database
    const savedResults = await this.db.insert(gameResults).values(results).returning();
    
    return savedResults;
  }

  async getGameResults(gameId: number): Promise<(GameResult & { player: User })[]> {
    const result = await this.db
      .select({
        id: gameResults.id,
        gameId: gameResults.gameId,
        playerId: gameResults.playerId,
        totalStrokes: gameResults.totalStrokes,
        totalPar: gameResults.totalPar,
        netScore: gameResults.netScore,
        handicap: gameResults.handicap,
        position: gameResults.position,
        isWinner: gameResults.isWinner,
        createdAt: gameResults.createdAt,
        player: users
      })
      .from(gameResults)
      .leftJoin(users, eq(gameResults.playerId, users.supabaseId))
      .where(eq(gameResults.gameId, gameId))
      .orderBy(asc(gameResults.position));
    
    return result.map((row: any) => {
      let playerData = row.player;
      
      // If user profile doesn't exist in our database, get placeholder data
      if (!playerData) {
        playerData = {
          id: 0,
          supabaseId: row.playerId,
          username: 'Unknown',
          password: '',
          email: '',
          name: 'Unknown Player',
          handicap: 0,
          createdAt: new Date()
        };
      }
      
      return {
        id: row.id,
        gameId: row.gameId,
        playerId: row.playerId,
        totalStrokes: row.totalStrokes,
        totalPar: row.totalPar,
        netScore: row.netScore,
        handicap: row.handicap,
        position: row.position,
        isWinner: row.isWinner,
        createdAt: row.createdAt,
        player: playerData
      };
    });
  }

  async getUserGameHistory(playerId: string): Promise<(GameResult & { game: Game })[]> {
    const result = await this.db
      .select({
        id: gameResults.id,
        gameId: gameResults.gameId,
        playerId: gameResults.playerId,
        totalStrokes: gameResults.totalStrokes,
        totalPar: gameResults.totalPar,
        netScore: gameResults.netScore,
        handicap: gameResults.handicap,
        position: gameResults.position,
        isWinner: gameResults.isWinner,
        createdAt: gameResults.createdAt,
        game: games
      })
      .from(gameResults)
      .leftJoin(games, eq(gameResults.gameId, games.id))
      .where(eq(gameResults.playerId, playerId))
      .orderBy(desc(games.createdAt));
    
    return result.map((row: any) => ({
      id: row.id,
      gameId: row.gameId,
      playerId: row.playerId,
      totalStrokes: row.totalStrokes,
      totalPar: row.totalPar,
      netScore: row.netScore,
      handicap: row.handicap,
      position: row.position,
      isWinner: row.isWinner,
      createdAt: row.createdAt,
      game: row.game
    }));
  }

  async getUserStats(playerId: string): Promise<{ wins: number; totalGames: number; avgScore: number; bestScore: number }> {
    const history = await this.getUserGameHistory(playerId);
    
    const wins = history.filter((r: GameResult & { game: Game }) => r.isWinner).length;
    const totalGames = history.length;
    
    // For new players with no games, return zeros
    if (totalGames === 0) {
      return { 
        wins: 0, 
        totalGames: 0, 
        avgScore: 0, 
        bestScore: 0 
      };
    }
    
    const avgScore = history.reduce((sum, r) => sum + r.netScore, 0) / totalGames;
    const bestScore = Math.min(...history.map(r => r.netScore));
    
    return { wins, totalGames, avgScore, bestScore };
  }

  private generateGameCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Helper method to get user info from Supabase
  private async getUserFromSupabase(supabaseId: string): Promise<any> {
    try {
      // Try to get user info from Supabase auth using the existing client
      const { data: { user }, error } = await supabase.auth.admin.getUserById(supabaseId);
      
      if (!error && user) {
        // Use user metadata or email for name
        const userName = user.user_metadata?.name || 
                        user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        `Player ${parseInt(supabaseId.slice(-4), 16) || 1}`;
        
        return {
          id: 0,
          supabaseId: supabaseId,
          username: user.user_metadata?.username || userName.toLowerCase().replace(/\s+/g, ''),
          password: 'supabase_auth',
          email: user.email || `player${parseInt(supabaseId.slice(-4), 16) || 1}@example.com`,
          name: userName,
          handicap: user.user_metadata?.handicap || 0,
          createdAt: new Date()
        };
      }
    } catch (error) {
      console.log('Could not fetch user from Supabase, using fallback name');
    }
    
    // Fallback to generated name
    const playerNumber = parseInt(supabaseId.slice(-4), 16) || 1;
    const playerName = `Player ${playerNumber}`;
    
    return {
      id: 0,
      supabaseId: supabaseId,
      username: `player${playerNumber}`,
      password: 'supabase_auth',
      email: `player${playerNumber}@example.com`,
      name: playerName,
      handicap: 0,
      createdAt: new Date()
    };
  }
}

export const storage = process.env.DATABASE_URL 
  ? new SupabaseStorage() 
  : new MemStorage();
