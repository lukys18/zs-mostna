export default async function handler(req, res) {
  const API_KEY = process.env.API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, useRAG = false, ragContext = '', sources = [] } = req.body;

  try {
    let enhancedMessages = [...messages];
    
    // Ak je povolený RAG, pridaj kontext ako system správu
    if (useRAG && ragContext) {
      const lastUserIndex = enhancedMessages.length - 1;
      if (enhancedMessages[lastUserIndex] && enhancedMessages[lastUserIndex].role === 'user') {
        enhancedMessages.splice(lastUserIndex, 0, {
          role: 'system',
          content: `${ragContext}\n\n⚠️ KRITICKÉ PRAVIDLÁ:\n1. Použi VÝHRADNE informácie z vyššie uvedeného kontextu\n2. Ak je v kontexte uvedený kontakt, link alebo dátum - cituj ho PRESNE\n3. NIKDY si nevymýšľaj fakty, ktoré nie sú v kontexte\n4. Ak je potrebná informácia, ktorá NIE JE v kontexte, povedz to a odporuč kontaktovať sekretariát\n5. Pri linkoch NIKDY nedávaj bodku, čiarku alebo iný znak za URL\n\nTeraz zodpovedaj otázku používateľa striktne podľa tohto kontextu:`
        });
      }
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: enhancedMessages,
        temperature: 0.4,
        max_tokens: 1500,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
