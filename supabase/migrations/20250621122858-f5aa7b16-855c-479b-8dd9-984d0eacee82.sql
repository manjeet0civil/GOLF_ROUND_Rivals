
-- Create games table to store game information
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID REFERENCES auth.users NOT NULL,
  course_name TEXT NOT NULL,
  game_code TEXT NOT NULL UNIQUE,
  max_players INTEGER DEFAULT 4,
  number_of_holes INTEGER DEFAULT 18,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create game_players table to track who is in each game
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  player_name TEXT NOT NULL,
  handicap INTEGER DEFAULT 18,
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create scores table to store individual hole scores
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  strokes INTEGER CHECK (strokes > 0),
  par INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id, hole_number)
);

-- Add RLS policies for games table
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view games they are part of" 
  ON public.games 
  FOR SELECT 
  USING (
    host_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.game_players 
      WHERE game_id = games.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create games" 
  ON public.games 
  FOR INSERT 
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Host can update their games" 
  ON public.games 
  FOR UPDATE 
  USING (host_user_id = auth.uid());

-- Add RLS policies for game_players table
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view players in games they are part of" 
  ON public.game_players 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE id = game_id AND host_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.game_players gp2 
      WHERE gp2.game_id = game_players.game_id AND gp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join games" 
  ON public.game_players 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Add RLS policies for scores table
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores in games they are part of" 
  ON public.scores 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.game_players 
      WHERE game_id = scores.game_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own scores" 
  ON public.scores 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scores" 
  ON public.scores 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_games_game_code ON public.games(game_code);
CREATE INDEX idx_games_host_user_id ON public.games(host_user_id);
CREATE INDEX idx_game_players_game_id ON public.game_players(game_id);
CREATE INDEX idx_game_players_user_id ON public.game_players(user_id);
CREATE INDEX idx_scores_game_id ON public.scores(game_id);
CREATE INDEX idx_scores_user_id ON public.scores(user_id);

-- Function to generate unique game codes
CREATE OR REPLACE FUNCTION generate_game_code() 
RETURNS TEXT 
LANGUAGE plpgsql 
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    code := 'GOLF' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM public.games WHERE game_code = code) INTO exists_check;
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$;
