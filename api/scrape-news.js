import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const SUPA = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const NEWS_PAGE = "https://www.zsmostna.sk/";

// Funkcia na extrahovanie kľúčových slov z textu
function extractKeywords(title, content) {
  const stopWords = new Set(['a', 'je', 'to', 'na', 'v', 'sa', 'so', 'pre', 'ako', 'že', 'ma', 'mi', 'me', 'si', 'su', 'som', 'ale', 'ani', 'az', 'ak', 'bo', 'by', 'co', 'ci', 'do', 'ho', 'im', 'ju', 'ka', 'ku', 'ly', 'ne', 'ni', 'no', 'od', 'po', 'pri', 'ro', 'ta', 'te', 'ti', 'tu', 'ty', 'uz', 'vo', 'za', 'kde', 'kto', 'ako', 'preco', 'kedy']);
  
  const text = `${title} ${content}`.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // odstráni diakritiku
    .replace(/[^\w\s]/g, ' '); // odstráni špeciálne znaky
  
  const words = text.split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Počítanie výskytov
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Top 5-10 najčastejšie sa vyskytujúce slová
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  return keywords;
}

export default async function handler(req, res) {
  try {
    // Načítaj hlavnú stránku
    const html = (await axios.get(NEWS_PAGE)).data;
    const $ = cheerio.load(html);

    // Získaj všetky existujúce URL z databázy
    const { data: existingNews, error: fetchError } = await SUPA
      .from("school_news")
      .select("url");
    
    if (fetchError) {
      throw new Error(`Failed to fetch existing news: ${fetchError.message}`);
    }

    const existingUrls = new Set(existingNews?.map(n => n.url) || []);

    // Nájdi všetky news divy
    const newsItems = [];
    $("div.news").each((i, el) => {
      const sumDiv = $(el).find("div.sum");
      const h2 = sumDiv.find("h2");
      const link = h2.find("a");
      
      const title = link.text().trim();
      let href = link.attr("href");
      
      if (title && href) {
        // Vytvor absolútnu URL ak je relatívna
        if (!href.startsWith("http")) {
          href = new URL(href, NEWS_PAGE).href;
        }
        newsItems.push({ title, url: href });
      }
    });

    // Filtruj iba nové news (tie čo ešte nie sú v DB)
    const newNews = newsItems.filter(n => !existingUrls.has(n.url));

    let added = 0;
    for (const news of newNews) {
      try {
        // Načítaj podstránku
        const subpageHtml = (await axios.get(news.url)).data;
        const $sub = cheerio.load(subpageHtml);

        // Získaj všetky <p> tagy z div#text
        const paragraphs = [];
        $sub("div#text p").each((i, el) => {
          const text = $sub(el).text().trim();
          if (text) {
            paragraphs.push(text);
          }
        });

        const content = paragraphs.join("\n\n");

        // Generuj ID a keywords pre RAG systém
        const newsId = `news_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const keywords = extractKeywords(news.title, content);

        // Ulož do databázy
        const { error } = await SUPA
          .from("school_news")
          .insert({
            id: newsId,
            category: "Novinky",
            title: news.title,
            url: news.url,
            content: content,
            keywords: keywords,
            scraped_at: new Date().toISOString()
          });

        if (!error) {
          added++;
        } else {
          console.error(`Error inserting news "${news.title}":`, error.message);
        }
      } catch (subpageError) {
        console.error(`Error scraping subpage ${news.url}:`, subpageError.message);
      }
    }

    res.status(200).json({ 
      total_found: newsItems.length, 
      new_found: newNews.length, 
      added 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
