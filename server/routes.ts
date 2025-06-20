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

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
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

  // Game routes
  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
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

  app.post("/api/games/:gameCode/join", async (req, res) => {
    try {
      const { gameCode } = req.params;
      const { playerId } = req.body;

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

  app.post("/api/games/:id/start", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { hostId } = req.body;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.hostId !== hostId) {
        return res.status(403).json({ message: "Only the host can start the game" });
      }

      const players = await storage.getGamePlayers(gameId);
      if (players.length < 2) {
        return res.status(400).json({ message: "Need at least 2 players to start" });
      }

      await storage.updateGameStatus(gameId, "playing");

      // Initialize scorecards for all players
      const standardPars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4]; // Standard 18-hole pars
      
      for (const player of players) {
        for (let hole = 1; hole <= 18; hole++) {
          await storage.updateScore({
            gameId,
            playerId: player.playerId,
            hole,
            strokes: null,
            par: standardPars[hole - 1]
          });
        }
      }

      res.json({ message: "Game started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Scorecard routes
  app.post("/api/games/:id/scores", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const scoreData = insertScorecardSchema.parse({ ...req.body, gameId });
      
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

  app.get("/api/games/:id/leaderboard", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const scores = await storage.getGameScores(gameId);
      const players = await storage.getGamePlayers(gameId);

      // Calculate leaderboard
      const leaderboard = players.map(playerData => {
        const playerScores = scores.filter(s => s.playerId === playerData.playerId);
        const totalStrokes = playerScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
        const holesPlayed = playerScores.filter(s => s.strokes !== null).length;
        const netScore = totalStrokes - (playerData.player.handicap || 0);

        return {
          playerId: playerData.playerId,
          playerName: playerData.player.name,
          handicap: playerData.player.handicap || 0,
          totalStrokes,
          netScore,
          holesPlayed,
          scores: playerScores.sort((a, b) => a.hole - b.hole)
        };
      }).sort((a, b) => a.netScore - b.netScore);

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Complete game
  app.post("/api/games/:id/complete", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { playerId } = req.body;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.hostId !== playerId) {
        return res.status(403).json({ message: "Only the host can complete the game" });
      }

      await storage.updateGameStatus(gameId, "completed");

      res.json({ message: "Game completed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/users/:id/games", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const playerGames = await storage.getPlayerGames(userId);
      
      res.json(playerGames);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
