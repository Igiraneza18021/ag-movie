import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { MovieRoom } from "@/components/movie-room"
import { createClient } from "@/lib/supabase/server"

interface RoomPageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { code } = await params
  
  return {
    title: `Room ${code} - Agasobanuye Movies Watch Party`,
    description: 'Join a synchronized movie watching experience with friends.',
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Fetch room data with proper joins
  const { data: room, error } = await supabase
    .from('movie_rooms')
    .select(`
      *,
      movies!movie_rooms_movie_id_fkey (id, title, poster_path, backdrop_path, embed_url, overview, release_date, runtime, vote_average),
      episodes!movie_rooms_episode_id_fkey (id, name, embed_url, tv_shows (id, name))
    `)
    .eq('room_code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !room) {
    console.error('Room fetch error:', error)
    console.error('Room code searched:', code.toUpperCase())
    notFound()
  }

  console.log('Room data fetched:', {
    id: room.id,
    room_code: room.room_code,
    movie_id: room.movie_id,
    episode_id: room.episode_id,
    has_movie: !!room.movies,
    has_episode: !!room.episodes,
    movie_title: room.movies?.title,
    episode_name: room.episodes?.name
  })

  // If no content found via joins, try direct queries
  if (!room.movies && !room.episodes) {
    console.log('No content found via joins, trying direct queries...')
    
    let content = null
    
    if (room.movie_id) {
      const { data: movie } = await supabase
        .from('movies')
        .select('id, title, poster_path, backdrop_path, embed_url, overview, release_date, runtime, vote_average')
        .eq('id', room.movie_id)
        .single()
      
      if (movie) {
        content = { ...room, movies: movie }
      }
    } else if (room.episode_id) {
      const { data: episode } = await supabase
        .from('episodes')
        .select(`
          id, name, embed_url,
          tv_shows (id, name)
        `)
        .eq('id', room.episode_id)
        .single()
      
      if (episode) {
        content = { ...room, episodes: episode }
      }
    }
    
    if (content) {
      room.movies = content.movies
      room.episodes = content.episodes
    } else {
      console.error('Room has no associated content after direct queries')
      console.error('Room movie_id:', room.movie_id)
      console.error('Room episode_id:', room.episode_id)
      notFound()
    }
  }

  // Get participants
  const { data: participants } = await supabase
    .from('room_participants')
    .select('*')
    .eq('room_id', room.id)
    .order('joined_at', { ascending: true })

  // Get recent messages
  const { data: messages } = await supabase
    .from('room_messages')
    .select('*')
    .eq('room_id', room.id)
    .order('timestamp', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        <MovieRoom 
          room={room}
          participants={participants || []}
          messages={messages || []}
        />
      </main>

      <Footer />
    </div>
  )
}
