-- Complete Database Setup for Agasobanuye Movies
-- Run this script in your Supabase SQL Editor

-- ==============================================
-- 1. CREATE BASIC TABLES
-- ==============================================

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date DATE,
  runtime INTEGER,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  genres JSONB DEFAULT '[]',
  trailer_url TEXT,
  embed_url TEXT NOT NULL,
  download_url TEXT,
  part_number INTEGER DEFAULT 1,
  parent_movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  scheduled_release TIMESTAMP,
  narrator TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create TV shows table
CREATE TABLE IF NOT EXISTS tv_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  first_air_date DATE,
  last_air_date DATE,
  number_of_seasons INTEGER,
  number_of_episodes INTEGER,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  genres JSONB DEFAULT '[]',
  trailer_url TEXT,
  download_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  scheduled_release TIMESTAMP,
  narrator TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_show_id UUID REFERENCES tv_shows(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  overview TEXT,
  poster_path TEXT,
  air_date DATE,
  episode_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tv_show_id, season_number)
);

-- Create episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  tv_show_id UUID REFERENCES tv_shows(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  overview TEXT,
  still_path TEXT,
  air_date DATE,
  runtime INTEGER,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  embed_url TEXT NOT NULL,
  download_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(season_id, episode_number)
);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create movie requests table
CREATE TABLE IF NOT EXISTS movie_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INTEGER,
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv_show')),
  requester_ip VARCHAR(45),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE MOVIE ROOMS TABLES
-- ==============================================

-- Create movie rooms table for synchronized viewing
CREATE TABLE IF NOT EXISTS movie_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  created_by VARCHAR(255) NOT NULL,
  room_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  current_participants INTEGER DEFAULT 1,
  playback_position DECIMAL(10,2) DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  playback_speed DECIMAL(3,2) DEFAULT 1.0,
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create room participants table
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES movie_rooms(id) ON DELETE CASCADE,
  participant_id VARCHAR(255) NOT NULL,
  participant_name VARCHAR(255),
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, participant_id)
);

-- Create room messages table for chat
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES movie_rooms(id) ON DELETE CASCADE,
  participant_id VARCHAR(255) NOT NULL,
  participant_name VARCHAR(255),
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- 3. CREATE INDEXES
-- ==============================================

-- Movies indexes
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_scheduled_release ON movies(scheduled_release);
CREATE INDEX IF NOT EXISTS idx_movies_parent_movie_id ON movies(parent_movie_id);
CREATE INDEX IF NOT EXISTS idx_movies_part_number ON movies(part_number);

-- TV Shows indexes
CREATE INDEX IF NOT EXISTS idx_tv_shows_tmdb_id ON tv_shows(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_tv_shows_status ON tv_shows(status);
CREATE INDEX IF NOT EXISTS idx_tv_shows_first_air_date ON tv_shows(first_air_date);

-- Episodes indexes
CREATE INDEX IF NOT EXISTS idx_episodes_tv_show_id ON episodes(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_episode ON episodes(season_number, episode_number);

-- Movie rooms indexes
CREATE INDEX IF NOT EXISTS idx_movie_rooms_room_code ON movie_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_movie_rooms_movie_id ON movie_rooms(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_rooms_is_active ON movie_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_movie_rooms_created_at ON movie_rooms(created_at);

-- Room participants indexes
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_participant_id ON room_participants(participant_id);

-- Room messages indexes
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_timestamp ON room_messages(timestamp);

-- ==============================================
-- 4. CREATE FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    code VARCHAR(8);
    exists_count INTEGER;
BEGIN
    LOOP
        code := UPPER(substring(md5(random()::text) from 1 for 8));
        SELECT COUNT(*) INTO exists_count FROM movie_rooms WHERE room_code = code;
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE movie_rooms 
    SET is_active = false 
    WHERE last_activity < NOW() - INTERVAL '24 hours' 
    AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update room activity
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE movie_rooms 
    SET last_activity = NOW() 
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. CREATE TRIGGERS
-- ==============================================

-- Triggers for updated_at
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tv_shows_updated_at BEFORE UPDATE ON tv_shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movie_rooms_updated_at BEFORE UPDATE ON movie_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for room activity
CREATE TRIGGER update_room_activity_on_participant 
    AFTER INSERT OR UPDATE ON room_participants
    FOR EACH ROW EXECUTE FUNCTION update_room_activity();

CREATE TRIGGER update_room_activity_on_message 
    AFTER INSERT ON room_messages
    FOR EACH ROW EXECUTE FUNCTION update_room_activity();

-- ==============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 7. CREATE RLS POLICIES
-- ==============================================

-- Public read access policies
CREATE POLICY "Public read access for movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Public read access for tv shows" ON tv_shows FOR SELECT USING (true);
CREATE POLICY "Public read access for seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read access for episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Public read access for genres" ON genres FOR SELECT USING (true);
CREATE POLICY "Public read access for movie requests" ON movie_requests FOR SELECT USING (true);

-- Movie rooms policies
CREATE POLICY "Allow read active rooms" ON movie_rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Allow create rooms" ON movie_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update own rooms" ON movie_rooms FOR UPDATE USING (true);

-- Room participants policies
CREATE POLICY "Allow read participants" ON room_participants FOR SELECT USING (true);
CREATE POLICY "Allow join rooms" ON room_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow leave rooms" ON room_participants FOR DELETE USING (true);

-- Room messages policies
CREATE POLICY "Allow read messages" ON room_messages FOR SELECT USING (true);
CREATE POLICY "Allow send messages" ON room_messages FOR INSERT WITH CHECK (true);

-- Admin policies (for service role)
CREATE POLICY "Service role can manage movies" ON movies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage tv shows" ON tv_shows FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage seasons" ON seasons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage episodes" ON episodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage genres" ON genres FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage movie requests" ON movie_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage movie rooms" ON movie_rooms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage room participants" ON room_participants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage room messages" ON room_messages FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 8. GRANT PERMISSIONS
-- ==============================================

GRANT ALL ON movies TO authenticated;
GRANT ALL ON tv_shows TO authenticated;
GRANT ALL ON seasons TO authenticated;
GRANT ALL ON episodes TO authenticated;
GRANT ALL ON genres TO authenticated;
GRANT ALL ON movie_requests TO authenticated;
GRANT ALL ON movie_rooms TO authenticated;
GRANT ALL ON room_participants TO authenticated;
GRANT ALL ON room_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ==============================================
-- 9. SEED BASIC GENRES
-- ==============================================

INSERT INTO genres (tmdb_id, name) VALUES
(28, 'Action'),
(12, 'Adventure'),
(16, 'Animation'),
(35, 'Comedy'),
(80, 'Crime'),
(99, 'Documentary'),
(18, 'Drama'),
(10751, 'Family'),
(14, 'Fantasy'),
(36, 'History'),
(27, 'Horror'),
(10402, 'Music'),
(9648, 'Mystery'),
(10749, 'Romance'),
(878, 'Science Fiction'),
(10770, 'TV Movie'),
(53, 'Thriller'),
(10752, 'War'),
(37, 'Western')
ON CONFLICT (tmdb_id) DO NOTHING;

-- ==============================================
-- COMPLETE SETUP FINISHED
-- ==============================================

-- You can now test the setup by visiting your admin panel
-- and creating movie rooms!
