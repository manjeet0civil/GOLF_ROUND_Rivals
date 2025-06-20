import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  handicap: integer("handicap").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull(),
  gameCode: varchar("game_code", { length: 6 }).notNull().unique(),
  courseName: text("course_name").notNull(),
  coursePar: integer("course_par").notNull().default(72),
  maxPlayers: integer("max_players").notNull().default(4),
  status: text("status").notNull().default("waiting"), // waiting, playing, completed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const scorecards = pgTable("scorecards", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  hole: integer("hole").notNull(), // 1-18
  strokes: integer("strokes"),
  par: integer("par").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  handicap: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  hostId: true,
  courseName: true,
  coursePar: true,
  maxPlayers: true,
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).pick({
  gameId: true,
  playerId: true,
});

export const insertScorecardSchema = createInsertSchema(scorecards).pick({
  gameId: true,
  playerId: true,
  hole: true,
  strokes: true,
  par: true,
}).extend({
  strokes: z.number().nullable().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type InsertScorecard = z.infer<typeof insertScorecardSchema>;
export type Scorecard = typeof scorecards.$inferSelect;
