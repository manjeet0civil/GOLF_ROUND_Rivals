import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertGameSchema, 
  insertGamePlayerSchema,
  insertScorecardSchema 
} from "@shared/schema";
import { z } from "zod";
import { authenticateUser, optionalAuth, AuthenticatedRequest } from "./middleware/auth";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (keeping for backward compatibility, but these will be replaced by Supabase)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // User profile creation endpoint for Supabase auth
  app.post("/api/users/profile", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { username, email, name, handicap = 0 } = req.body;
      
      // Check if user profile already exists
      const existingUser = await storage.getUserBySupabaseId(req.user.id);
      if (existingUser) {
        return res.status(400).json({ message: "User profile already exists" });
      }

      // Check if username is already taken
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email is already taken
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user profile
      const user = await storage.createUser({
        supabaseId: req.user.id,
        username,
        email,
        name,
        handicap,
        password: 'supabase_auth' // Placeholder since we're using Supabase auth
      });

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Create user profile error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Get user profile endpoint
  app.get("/api/users/profile", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUserBySupabaseId(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user profile endpoint
  app.put("/api/users/profile", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUserBySupabaseId(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const { username, email, name, handicap } = req.body;
      
      // Check if username is already taken by another user
      if (username && username !== user.username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== user.id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail && existingEmail.id !== user.id) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Update user profile (for now, we'll just return the existing user since we don't have an update method)
      // In a real implementation, you would add an updateUser method to the storage interface
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create user profile from Supabase data
  app.post("/api/users/profile-from-supabase", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user profile already exists
      const existingUser = await storage.getUserBySupabaseId(req.user.id);
      if (existingUser) {
        const { password, ...userWithoutPassword } = existingUser;
        return res.json({ user: userWithoutPassword });
      }

      // Extract user data from Supabase user metadata
      const userMetadata = req.user.user_metadata || {};
      let finalUsername = userMetadata.username || req.user.email?.split('@')[0] || 'player';
      const name = userMetadata.name || finalUsername;
      const handicap = userMetadata.handicap || 0;

      // Check if username is already taken
      const existingUsername = await storage.getUserByUsername(finalUsername);
      if (existingUsername) {
        // Generate a unique username
        const baseUsername = finalUsername;
        let counter = 1;
        let newUsername = `${baseUsername}${counter}`;
        while (await storage.getUserByUsername(newUsername)) {
          counter++;
          newUsername = `${baseUsername}${counter}`;
        }
        finalUsername = newUsername;
      }

      // Create user profile
      const user = await storage.createUser({
        supabaseId: req.user.id,
        username: finalUsername,
        email: req.user.email || 'unknown@example.com',
        name,
        handicap,
        password: 'supabase_auth'
      });

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Create user profile from Supabase error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Game routes
  app.post("/api/games", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('=== CREATE GAME DEBUG ===');
      console.log('Headers:', req.headers);
      console.log('Authorization header:', req.headers.authorization);
      console.log('User object:', req.user);
      console.log('User ID:', req.user?.id);
      console.log('Request body:', req.body);
      console.log('=======================');
      
      if (!req.user) {
        console.log('ERROR: User is null!');
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const gameData = insertGameSchema.parse(req.body);
      console.log('Game data:', gameData);
      
      // Use the authenticated user's Supabase ID directly
      const game = await storage.createGame({
        ...gameData,
        hostId: req.user.id // This is now the Supabase UUID
      });
      
      console.log('Game created successfully:', game);
      
      // Don't automatically add host as player - they need to join like everyone else
      // This allows the host to see the game but not be counted as a player until they join
      
      res.json(game);
    } catch (error) {
      console.error('Create game error:', error);
      res.status(400).json({ message: "Invalid game data" });
    }
  });

  app.get("/api/games/:gameCode/join", async (req, res) => {
    try {
      const { gameCode } = req.params;
      const game = await storage.getGameByCode(gameCode);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Game is no longer accepting players" });
      }

      const players = await storage.getGamePlayers(game.id);
      if (players.length >= game.maxPlayers) {
        return res.status(400).json({ message: "Game is full" });
      }

      res.json({ game, playerCount: players.length });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/games/:gameCode/join", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { gameCode } = req.params;
      const playerId = req.user!.id; // This is now the Supabase UUID

      const game = await storage.getGameByCode(gameCode);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Game is no longer accepting players" });
      }

      const players = await storage.getGamePlayers(game.id);
      if (players.length >= game.maxPlayers) {
        return res.status(400).json({ message: "Game is full" });
      }

      // Check if player already joined
      const alreadyJoined = players.some(p => p.playerId === playerId);
      if (alreadyJoined) {
        return res.status(400).json({ message: "Already joined this game" });
      }

      await storage.addPlayerToGame({ gameId: game.id, playerId });
      const updatedPlayers = await storage.getGamePlayers(game.id);
      
      res.json({ game, players: updatedPlayers });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Start game endpoint
  app.post("/api/games/:id/start", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const hostId = req.user!.id; // This is now the Supabase UUID

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.hostId !== hostId) {
        return res.status(403).json({ message: "Only the host can start the game" });
      }

      if (game.status !== "waiting") {
        return res.status(400).json({ message: "Game is not in waiting status" });
      }

      const players = await storage.getGamePlayers(gameId);
      if (players.length < 2) {
        return res.status(400).json({ message: "Need at least 2 players to start the game" });
      }

      // Update game status to playing
      await storage.updateGameStatus(gameId, "playing");

      res.json({ 
        message: "Game started successfully",
        game: { ...game, status: "playing" }
      });
    } catch (error) {
      console.error('Start game error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get game info endpoint
  app.get("/api/games/:id", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const players = await storage.getGamePlayers(gameId);
      res.json({ game, players });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get leaderboard endpoint
  app.get("/api/games/:id/leaderboard", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const players = await storage.getGamePlayers(gameId);
      const scores = await storage.getGameScores(gameId);
      
      const leaderboard = players.map(player => {
        const playerScores = scores.filter(s => s.playerId === player.playerId);
        const totalStrokes = playerScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
        const totalPar = playerScores.reduce((sum, score) => sum + score.par, 0);
        const handicap = player.player.handicap || 0;
        const netScore = totalStrokes - handicap;
        const holesPlayed = playerScores.filter(s => s.strokes !== null).length;
        
        return {
          playerId: player.playerId,
          playerName: player.player.name,
          handicap,
          totalStrokes,
          totalPar,
          netScore,
          holesPlayed
        };
      }).sort((a, b) => a.netScore - b.netScore);
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Scorecard routes
  app.post("/api/games/:id/scores", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const scoreData = insertScorecardSchema.parse({ 
        ...req.body, 
        gameId,
        playerId: req.user!.id // This is now the Supabase UUID
      });
      
      const scorecard = await storage.updateScore(scoreData);
      res.json(scorecard);
    } catch (error) {
      res.status(400).json({ message: "Invalid score data" });
    }
  });

  app.get("/api/games/:id/scores", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const scores = await storage.getGameScores(gameId);
      const players = await storage.getGamePlayers(gameId);
      
      res.json({ scores, players });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Complete game and calculate results
  app.post("/api/games/:id/complete", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const hostId = req.user!.id; // This is now the Supabase UUID

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.hostId !== hostId) {
        return res.status(403).json({ message: "Only the host can complete the game" });
      }

      if (game.status !== "playing") {
        return res.status(400).json({ message: "Game is not in progress" });
      }

      // Calculate and save game results
      const results = await storage.saveGameResults(gameId);
      
      // Update game status to completed
      await storage.updateGameStatus(gameId, "completed");

      res.json({ 
        message: "Game completed successfully",
        results: results
      });
    } catch (error) {
      console.error('Complete game error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get game results/leaderboard
  app.get("/api/games/:id/results", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== "completed") {
        return res.status(400).json({ message: "Game is not completed yet" });
      }

      const results = await storage.getGameResults(gameId);
      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User routes - Updated to use Supabase authentication
  // Get user's game history with winning statistics
  app.get("/api/users/games", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const history = await storage.getUserGameHistory(req.user.id);
      const stats = await storage.getUserStats(req.user.id);
      
      // Transform the data to match frontend expectations
      const transformedHistory = history.map(record => ({
        id: record.id,
        gameId: record.gameId,
        playerId: record.playerId,
        totalStrokes: record.totalStrokes,
        totalPar: record.totalPar,
        netScore: record.netScore,
        handicap: record.handicap,
        position: record.position,
        isWinner: record.isWinner,
        createdAt: record.createdAt,
        game: {
          id: record.game.id,
          courseName: record.game.courseName,
          coursePar: record.game.coursePar,
          maxPlayers: record.game.maxPlayers,
          gameCode: record.game.gameCode,
          status: record.game.status,
          hostId: record.game.hostId,
          createdAt: record.game.createdAt,
          completedAt: record.game.completedAt
        }
      }));
      
      res.json({ 
        history: transformedHistory,
        stats
      });
    } catch (error) {
      console.error('Get user games error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user statistics
  app.get("/api/users/stats", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const stats = await storage.getUserStats(req.user.id);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Check if game has been completed by host
  app.get("/api/games/:id/status", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json({ 
        status: game.status,
        completedAt: game.completedAt
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
