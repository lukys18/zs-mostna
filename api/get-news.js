import { createClient } from "@supabase/supabase-js";

const SUPA = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  try {
    // Povolenie CORS pre frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Načítaj všetky novinky z databázy (triedené podľa dátumu publikácie)
    const { data: news, error } = await SUPA
      .from("school_news")
      .select("id, category, title, content, keywords, url, published_date")
      .order("published_date", { ascending: false, nullsLast: true })
      .order("scraped_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch news: ${error.message}`);
    }

    // Transformuj do formátu ako v database.js
    const formattedNews = (news || []).map(item => ({
      id: item.id,
      category: item.category || "Novinky",
      title: item.title,
      content: item.content,
      keywords: item.keywords || [],
      link: item.url,
      date: item.published_date
    }));

    res.status(200).json({
      success: true,
      count: formattedNews.length,
      news: formattedNews
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
