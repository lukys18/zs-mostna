// rag-system.js
// RAG (Retrieval-Augmented Generation) systém pre ZŠ Mostná Chatbot

class RAGSystem {
  constructor(knowledgeBase) {
    this.knowledgeBase = knowledgeBase;
    this.newsLoaded = false;
    this.loadNewsFromAPI(); // Automaticky načítaj news pri inicializácii
    this.stopWords = new Set([
      'a', 'je', 'to', 'na', 'v', 'sa', 'so', 'pre', 'ako', 'že', 'ma', 'mi', 'me', 'si', 'su', 'som',
      'ale', 'ani', 'az', 'ak', 'bo', 'by', 'co', 'ci', 'do', 'ho', 'im', 'ju', 'ka', 'ku', 'ly',
      'ne', 'ni', 'no', 'od', 'po', 'pri', 'ro', 'ta', 'te', 'ti', 'tu', 'ty', 'uz', 'vo', 'za'
    ]);
    
    // Synonymá pre lepšie vyhľadávanie (prispôsobené pre ZŠ)
    this.synonyms = {
      'škola': ['skola', 'zakladna', 'zs', 'mostna', 'nove', 'zamky'],
      'kontakt': ['telefon', 'email', 'adresa', 'spojenie', 'udaje'],
      'rozvrh': ['hodiny', 'vyucovanie', 'predmety', 'triedy', 'cas'],
      'krúžok': ['kruzok', 'kruzky', 'aktivity', 'zaujmove', 'popoludni'],
      'jedáleň': ['jedalen', 'strava', 'obed', 'stravovanie', 'menu', 'jedlo'],
      'zápis': ['zapis', 'prihlaska', 'prvacik', 'prihlasenie', 'registracia'],
      'rodič': ['rodicia', 'mama', 'otec', 'zastupca'],
      'žiak': ['ziak', 'student', 'dieta', 'deti'],
      'učiteľ': ['ucitel', 'pedagog', 'vychovavatel', 'triedny'],
      'riaditeľ': ['riaditel', 'vedenie', 'skola'],
      'prázdniny': ['prazdniny', 'volno', 'dovolenka'],
      'trieda': ['triedy', 'rocnik', 'skupina'],
      'známka': ['znamky', 'hodnotenie', 'vysvedcenie'],
      'projekt': ['projekty', 'sutaz', 'olympiada'],
      'šport': ['sport', 'telesna', 'telocvik', 'sportovy'],
      'akcia': ['akcie', 'podujatie', 'vylety', 'exkurzia'],
      'novinka': ['novinky', 'aktuality', 'news', 'informacie', 'oznam']
    };
  }

  // Načítaj novinky z API a pridaj ich do knowledge base
  async loadNewsFromAPI() {
    if (this.newsLoaded) return;
    
    try {
      console.log('📰 Načítavam novinky z databázy...');
      const response = await fetch('/api/get-news');
      const data = await response.json();
      
      if (data.success && data.news && data.news.length > 0) {
        // Pridaj novinky do existujúcej knowledge base
        this.knowledgeBase = [...this.knowledgeBase, ...data.news];
        this.newsLoaded = true;
        console.log(`✅ Načítaných ${data.news.length} noviniek`);
      } else {
        console.log('⚠️ Žiadne novinky v databáze');
      }
    } catch (error) {
      console.error('❌ Chyba pri načítaní noviniek:', error);
    }
  }

  // Hlavná metóda pre vyhľadávanie relevantného obsahu
  searchRelevantContent(query, maxResults = 5) {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.extractKeywords(normalizedQuery);
    const bigrams = this.extractBigrams(normalizedQuery);
    const expandedWords = this.expandWithSynonyms(queryWords);
    
    if (queryWords.length === 0 && bigrams.length === 0) {
      return [];
    }

    const allScores = this.knowledgeBase.map(item => {
      const score = this.calculateRelevanceScore(item, expandedWords, normalizedQuery, bigrams);
      return { ...item, relevanceScore: score };
    });
    
    const results = allScores
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => {
        // Primárne triedenie podľa relevancie
        if (Math.abs(a.relevanceScore - b.relevanceScore) > 5) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Sekundárne triedenie pre novinky s podobnou relevanciou podľa dátumu
        if (a.category === "Novinky" && b.category === "Novinky" && a.date && b.date) {
          return this.compareDates(b.date, a.date); // novšie novinky vyššie
        }
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, maxResults);

    console.log('✅ RAG Search Results:', results.map(r => ({ 
      id: r.id, 
      title: r.title.substring(0, 60), 
      category: r.category,
      score: r.relevanceScore.toFixed(2),
      date: r.date || 'N/A'
    })));
    
    if (results.length > 0 && results[0].relevanceScore < 10) {
      console.log('⚠️ Nízka relevancia výsledkov');
    }
    
    if (results.length === 0) {
      console.log('❌ Žiadne relevantné výsledky');
    }
    
    return results;
  }

  // Výpočet skóre relevancie
  calculateRelevanceScore(item, queryWords, fullQuery, bigrams = []) {
    let score = 0;
    const normalizedTitle = this.normalizeText(item.title);
    const normalizedContent = this.normalizeText(item.content);
    const normalizedKeywords = item.keywords ? item.keywords.map(k => this.normalizeText(k)) : [];
    const normalizedCategory = this.normalizeText(item.category);
    
    // Scoring pre kategóriu
    queryWords.forEach(word => {
      if (normalizedCategory.includes(word)) {
        score += 4;
      }
    });
    
    // Scoring pre jednotlivé slová
    queryWords.forEach(word => {
      // Kľúčové slová
      const keywordMatch = normalizedKeywords.some(keyword => 
        keyword.includes(word) || word.includes(keyword) || this.isSimilar(word, keyword)
      );
      if (keywordMatch) {
        score += 8;
      }
      
      // Názov
      if (normalizedTitle.includes(word)) {
        score += 6;
      }
      
      // Obsah
      if (normalizedContent.includes(word)) {
        const frequency = (normalizedContent.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(frequency * 1.5, 6);
      }
    });

    // Scoring pre bigramy
    bigrams.forEach(bigram => {
      if (normalizedContent.includes(bigram) || normalizedTitle.includes(bigram)) {
        score += 7;
      }
      normalizedKeywords.forEach(keyword => {
        if (keyword.includes(bigram)) {
          score += 10;
        }
      });
    });

    // Bonus za presný match
    if (normalizedContent.includes(fullQuery) || normalizedTitle.includes(fullQuery)) {
      score += 12;
    }

    // Bonus za čísla
    const numbers = fullQuery.match(/\d+/g);
    if (numbers) {
      numbers.forEach(num => {
        if (normalizedContent.includes(num) || normalizedTitle.includes(num)) {
          score += 5;
        }
      });
    }

    // Bonus za ID match
    if (item.id && fullQuery.includes(item.id.toString().toLowerCase())) {
      score += 20;
    }
    
    // Bonus za link
    if (item.link && item.link !== '') {
      score += 2;
    }

    return score;
  }

  // Extrakcia kľúčových slov z dotazu
  extractKeywords(normalizedText) {
    return normalizedText
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .slice(0, 15);
  }

  // Extrakcia bigramov (2-slovné frázy)
  extractBigrams(normalizedText) {
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    const bigrams = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!(this.stopWords.has(words[i]) && this.stopWords.has(words[i + 1]))) {
        bigrams.push(bigram);
      }
    }
    
    return bigrams;
  }

  // Rozšírenie slov o synonymá
  expandWithSynonyms(words) {
    const expanded = new Set(words);
    
    words.forEach(word => {
      for (const [key, synonymList] of Object.entries(this.synonyms)) {
        if (key === word || synonymList.includes(word)) {
          expanded.add(key);
          synonymList.forEach(syn => expanded.add(syn));
        }
      }
    });
    
    return Array.from(expanded);
  }

  // Kontrola podobnosti slov (fuzzy matching)
  isSimilar(word1, word2) {
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > 2) return false;
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    const maxChanges = word1.length > 6 ? 2 : 1;
    let changes = 0;
    const maxLen = Math.max(word1.length, word2.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (word1[i] !== word2[i]) changes++;
      if (changes > maxChanges) return false;
    }
    
    return changes <= maxChanges;
  }

  // Normalizácia textu
  normalizeText(text) {
    if (!text) return '';
    
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\sáäčďéíĺľňóôŕšťúýž]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Vytvorenie kontextu pre AI model
  buildContext(relevantContent) {
    if (relevantContent.length === 0) {
      return '';
    }
    
    const context = relevantContent
      .map((item, index) => {
        let contextPart = `**${index + 1}. ${item.title}** [${item.category}]`;
        if (item.id) {
          contextPart += ` (ID: ${item.id})`;
        }
        contextPart += `:\n${item.content}`;
        
        if (item.link && item.link !== '') {
          contextPart += `\n📎 Link: ${item.link}`;
        }
        
        return contextPart;
      })
      .join('\n\n');
    
    const hasContactInfo = relevantContent.some(item => 
      item.category === 'Kontakt' || 
      (item.keywords && item.keywords.some(kw => ['kontakt', 'email', 'telefon', 'adresa'].includes(kw.toLowerCase())))
    );
    
    const contactNote = hasContactInfo 
      ? '\n\n⚠️ KONTAKTY: Pri odpovedaní na otázky o kontaktoch použi PRESNE uvedené kontaktné údaje. Neuvádzaj žiadne vymyslené kontakty.'
      : '';
    
    return `INFORMÁCIE O ZŠ MOSTNÁ V NOVÝCH ZÁMKOCH (používaj LEN tieto fakty):\n\n${context}\n\n📌 INŠTRUKCIE: Odpovedaj PRESNE podľa týchto informácií z databázy. NEPRÍDÁVAJ žiadne vlastné interpretácie alebo detaily, ktoré nie sú explicitne uvedené. Ak informácia nie je v kontexte, POVEDZ to a odporuč kontaktovanie sekretariátu školy. Buď priateľský a nápomocný.${contactNote}`;
  }

  // Vyhľadávanie podľa ID
  getById(id) {
    return this.knowledgeBase.find(item => item.id === id);
  }

  // Vyhľadávanie podľa kategórie
  getByCategory(category) {
    return this.knowledgeBase.filter(item => 
      item.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Vyhľadávanie podľa kľúčových slov
  getByKeyword(keyword) {
    const normalized = this.normalizeText(keyword);
    return this.knowledgeBase.filter(item =>
      item.keywords && item.keywords.some(kw => this.normalizeText(kw).includes(normalized))
    );
  }

  // Získanie štatistík databázy
  // Porovnanie dátumov (podporuje formáty: DD.MM.YYYY, YYYY-MM-DD, ISO)
  compareDates(date1, date2) {
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      
      // DD.MM.YYYY
      if (dateStr.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        const [day, month, year] = dateStr.split('.').map(Number);
        return new Date(year, month - 1, day);
      }
      
      // Ostatné formáty (ISO, YYYY-MM-DD)
      return new Date(dateStr);
    };
    
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    
    return d1 - d2;
  }

  getStats() {
    const categories = [...new Set(this.knowledgeBase.map(item => item.category))];
    return {
      totalItems: this.knowledgeBase.length,
      categories: categories,
      categoryCounts: categories.map(cat => ({
        category: cat,
        count: this.knowledgeBase.filter(item => item.category === cat).length
      }))
    };
  }
}

// Export pre použitie v iných súboroch
if (typeof window !== 'undefined') {
  window.RAGSystem = RAGSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGSystem;
}
