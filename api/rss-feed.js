import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with correct environment variable names
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗ MISSING');
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓' : '✗ MISSING');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert Supabase timestamp to RFC 822 format
function formatRFC822Date(dateString) {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getUTCDay()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
}

// Escape XML special characters
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate RSS feed
async function generateRSSFeed() {
  try {
    // Fetch latest movies from Supabase, ordered by creation date (newest first)
    const { data: movies, error } = await supabase
      .from('movies') // Replace 'movies' with your actual table name
      .select('id, tmdb_movie_name, thumbnail_url, narrator_name, embed_link, download_link, youtube_trailer, created_at, movie_slug')
      .order('created_at', { ascending: false })
      .limit(50); // Fetch latest 50 movies

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // Build RSS XML
    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AG Movie - Latest Movies</title>
    <link>https://ag.micorp.pro</link>
    <description>Watch the latest movies with AG Movie. Agasobanuye movies streaming platform.</description>
    <language>en-us</language>
    <lastBuildDate>${formatRFC822Date(new Date().toISOString())}</lastBuildDate>
    <ttl>3600</ttl>
`;

    // Add movie items
    movies.forEach(movie => {
      const movieTitle = escapeXml(movie.tmdb_movie_name);
      const narratorName = escapeXml(movie.narrator_name || 'Unknown');
      const downloadLink = escapeXml(movie.download_link || '');
      const embedLink = escapeXml(movie.embed_link || '');
      const thumbnailUrl = escapeXml(movie.thumbnail_url || '');
      
      // Construct the movie watch page URL
      const movieSlug = movie.movie_slug || movie.id;
      const moviePageUrl = `https://ag.micorp.pro/watch/${movieSlug}`;

      // Build the description (Instagram caption format)
      const description = `${movieTitle}\n\n🎬 Watch agasobanuye\n\nNarrator: ${narratorName}\n\n👁️ Watch here: ${moviePageUrl}\n\n⬇️ Download here: ${downloadLink}`;

      // Build thumbnail URL with absolute path
      let thumbnailFullUrl = thumbnailUrl;
      if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
        thumbnailFullUrl = `https://image.tmdb.org/t/p/w500${thumbnailUrl}`;
      }

      rssXml += `
    <item>
      <title>${movieTitle}</title>
      <link>${moviePageUrl}</link>
      <description>${escapeXml(description)}</description>
      <guid isPermaLink="false">${movie.id}</guid>
      <pubDate>${formatRFC822Date(movie.created_at)}</pubDate>
      <content:encoded><![CDATA[
        <p>${escapeXml(description)}</p>
        <p><a href="${moviePageUrl}">Watch on AG Movie</a></p>
      ]]></content:encoded>`;

      // Add media enclosure for thumbnail image
      if (thumbnailFullUrl) {
        rssXml += `
      <enclosure url="${thumbnailFullUrl}" type="image/jpeg" length="0"/>
      <media:content url="${thumbnailFullUrl}" type="image/jpeg"/>
      <media:thumbnail url="${thumbnailFullUrl}"/>`;
      }

      rssXml += `
    </item>`;
    });

    rssXml += `
  </channel>
</rss>`;

    return rssXml;
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    throw error;
  }
}

// Export for use as an API endpoint or serverless function
export default async function handler(req, res) {
  try {
    const rssFeed = await generateRSSFeed();
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(rssFeed);
  } catch (error) {
    console.error('RSS Feed Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate RSS feed',
      details: error.message,
      envCheck: {
        VITE_SUPABASE_URL: supabaseUrl ? 'present' : 'MISSING',
        VITE_SUPABASE_PUBLISHABLE_KEY: supabaseKey ? 'present' : 'MISSING'
      }
    });
  }
}

// Alternative export for standalone usage
export { generateRSSFeed };
