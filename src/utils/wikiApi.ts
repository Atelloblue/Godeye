export interface WikiSummaryResult {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  pageUrl?: string;
  coordinates?: { lat: number; lon: number };
}

/**
 * Fetches Wikipedia article summary, image, and metadata for any topic, city, building, state, or entity.
 */
export async function fetchWikipediaSummary(topic: string): Promise<WikiSummaryResult | null> {
  try {
    const cleanTopic = topic
      .trim()
      .replace(/^(tell\s+me\s+about|what\s+is|who\s+is|where\s+is|describe|info\s+on|information\s+on|wiki|wikipedia|about|lookup|details\s+on)\s+/i, '')
      .replace(/^(the|a|an)\s+/i, '')
      .trim();

    if (!cleanTopic) return null;

    // 1. Attempt direct Wikipedia REST summary API
    const directUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTopic)}`;
    const res = await fetch(directUrl);

    if (res.ok) {
      const data = await res.json();
      if (data && data.extract && data.type !== 'disambiguation') {
        return {
          title: data.title || data.displaytitle || cleanTopic,
          extract: data.extract,
          description: data.description,
          thumbnailUrl: data.thumbnail?.source,
          originalImageUrl: data.originalimage?.source,
          pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanTopic)}`,
          coordinates: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : undefined,
        };
      }
    }

    // 2. Fallback to Wikipedia Action API Search
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTopic)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const firstResult = searchData?.query?.search?.[0];
      if (firstResult && firstResult.title) {
        const titleUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResult.title)}`;
        const summaryRes = await fetch(titleUrl);
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          if (data && data.extract) {
            return {
              title: data.title || firstResult.title,
              extract: data.extract,
              description: data.description,
              thumbnailUrl: data.thumbnail?.source,
              originalImageUrl: data.originalimage?.source,
              pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(firstResult.title)}`,
              coordinates: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : undefined,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching Wikipedia summary:', err);
  }
  return null;
}

/**
 * Extracts exactly 3 complete sentences from a text string, ignoring periods in acronyms (e.g., D.C., U.S., St., Dr.).
 */
export function extractThreeSentences(text: string): string {
  if (!text) return '';
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Protect common acronyms, initialisms, and titles with temporary placeholders
  // 1. Multi-letter dotted acronyms like D.C., U.S., U.S.A., Ph.D., e.g., i.e.
  let protectedText = cleanText.replace(/\b([A-Za-z]\.){1,5}/g, (match) => {
    return match.replace(/\./g, '___DOT___');
  });

  // 2. Common title abbreviations like St., Mr., Mrs., Ms., Dr., Prof., Sr., Jr., vs., Inc., Corp., Ltd.
  protectedText = protectedText.replace(/\b(St|Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|inc|corp|ltd)\./gi, (match) => {
    return match.replace(/\./g, '___DOT___');
  });

  // 3. Match full sentences ending with . ! ? followed by whitespace or end of string
  const sentences = protectedText.match(/[^.!?]+[.!?]+/g);

  if (!sentences || sentences.length === 0) {
    return cleanText;
  }

  // Restore the original periods in the first 3 sentences
  const firstThree = sentences
    .slice(0, 3)
    .join(' ')
    .replace(/___DOT___/g, '.')
    .trim();

  return firstThree;
}
