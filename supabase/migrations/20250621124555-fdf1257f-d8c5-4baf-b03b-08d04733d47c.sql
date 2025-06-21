
-- Fix infinite recursion by creating security definer functions
CREATE OR REPLACE FUNCTION public.is_game_participant(game_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE game_players.game_id = $1 AND game_players.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.is_game_host(game_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = $1 AND games.host_user_id = $2
  );
$$;

-- Drop and recreate policies to fix infinite recursion
DROP POLICY IF EXISTS "Users can view games they are part of" ON public.games;
DROP POLICY IF EXISTS "Users can view players in games they are part of" ON public.game_players;
DROP POLICY IF EXISTS "Users can view scores in games they are part of" ON public.scores;

-- Create new policies using security definer functions
CREATE POLICY "Users can view games they are part of" 
  ON public.games 
  FOR SELECT 
  USING (
    host_user_id = auth.uid() OR 
    public.is_game_participant(id, auth.uid())
  );

CREATE POLICY "Users can view players in games they are part of" 
  ON public.game_players 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    public.is_game_host(game_id, auth.uid()) OR
    public.is_game_participant(game_id, auth.uid())
  );

CREATE POLICY "Users can view scores in games they are part of" 
  ON public.scores 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    public.is_game_participant(game_id, auth.uid())
  );

-- Enable realtime for live updates
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;
ALTER TABLE public.scores REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
