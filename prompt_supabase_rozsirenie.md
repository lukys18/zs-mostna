**📋 Kompletný prehľad zmien a databázovej štruktúry**

**🗄️ Databázová schéma - Tabuľka chat_logs**

**SQL na vytvorenie tabuľky:**

> CREATE TABLE chat_logs (
>
> id SERIAL PRIMARY KEY,
>
> user_message TEXT NOT NULL,
>
> bot_response TEXT,
>
> website VARCHAR(255) NOT NULL,
>
> created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
>
> user_ip INET,
>
> session_id UUID NOT NULL,
>
> message_index INT,
>
> time_to_respond INTEGER,
>
> category VARCHAR(100),
>
> geo_location_city VARCHAR(100),
>
> email_submitted BOOLEAN DEFAULT FALSE
>
> );

**📊 Stĺpce a ich význam:**

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Stĺpec**                                                                                                                                                                      **Typ**        **Popis**                  **Príklad hodnoty**
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------- -------------------------- -----------------------------------
  id                                                                                                                                                                              SERIAL         Auto-increment ID          1, 2, 3\...

  [user_message](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)        TEXT           Správa od používateľa      \"Koľko to stojí?\"

  [bot_response](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)        TEXT           Odpoveď bota               \"Naše ceny začínajú od €99\...\"

  [website](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)             VARCHAR(255)   Hostname webu              \"ragnetiq.com\"

  [created_at](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)          TIMESTAMP      Čas vytvorenia             \"2025-10-26 14:30:00+00\"

  [user_ip](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)             INET           IP adresa používateľa      \"185.123.45.67\"

  [session_id](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)          UUID           Unikátne ID relácie        \"a1b2c3d4-e5f6-\...\"

  [message_index](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)       INT            Poradie správy v session   1, 2, 3\...

  [time_to_respond](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)     INTEGER        Čas odozvy v ms            1250

  [category](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)            VARCHAR(100)   Kategória otázky           \"ceny\", \"Email\"

  [geo_location_city](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)   VARCHAR(100)   Mesto používateľa          \"Bratislava\"

  [email_submitted](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)     BOOLEAN        Či bol odoslaný email      true/false
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**🔧 Implementované funkcie:**

**1. Session Management**

> // Generuje nové UUID pri každom načítaní stránky
>
> let sessionId = null;
>
> let messageIndex = 0;
>
> let emailSubmittedInSession = false;
>
> function getSessionId() {
>
> if (!sessionId) {
>
> sessionId = \'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\'.replace(/\[xy\]/g, function(c) {
>
> const r = Math.random() \* 16 \| 0;
>
> const v = c == \'x\' ? r : (r & 0x3 \| 0x8);
>
> return v.toString(16);
>
> });
>
> }
>
> return sessionId;
>
> }

**2. RAG-based Kategorizácia**

> // Kategória sa určuje z najvyššie hodnoteného RAG výsledku
>
> if (ragSystem) {
>
> relevantContent = ragSystem.searchRelevantContent(message, 3);
>
> if (relevantContent.length \> 0) {
>
> const topResult = relevantContent\[0\].title.toLowerCase();
>
> if (topResult.includes(\'cen\') \|\| topResult.includes(\'balík\')) {
>
> detectedCategory = \'ceny\';
>
> } else if (topResult.includes(\'kontakt\') \|\| topResult.includes(\'stretnutie\')) {
>
> detectedCategory = \'kontakt\';
>
> }
>
> // \... ďalšie kategórie
>
> }
>
> }
>
> // Fallback na keyword analýzu ak RAG nenájde nič
>
> if (!useRAG) {
>
> detectedCategory = categorizeMessage(message);
>
> }

**Kategórie:**

-   ceny - otázky o cenách, balíkoch

-   kontakt - žiadosti o kontakt, stretnutia

-   produkty - otázky o funkciách chatbotu

-   proces - proces implementácie, kroky

-   podpora - technická podpora, problémy

-   Email - úspešne odoslané emaily

-   všeobecné - ostatné

**3. Chat Message Saving**

> async function sendMessage() {
>
> // \... po každej odpovedi bota
>
> messageIndex++; // Increment index
>
> const startTime = Date.now();
>
> // \... získanie odpovede z API
>
> const timeToRespond = Date.now() - startTime;
>
> const category = detectedCategory; // z RAG
>
> // Uloženie do databázy
>
> saveChatToAPI(message, reply, messageIndex, timeToRespond, category);
>
> }

**4. IP & Geolocation Tracking**

> // IP adresa
>
> const ipResponse = await fetch(\'https://api.ipify.org?format=json\');
>
> const ipData = await ipResponse.json();
>
> ipAddress = ipData.ip;
>
> // Geolokácia
>
> const geoResponse = await fetch(\`https://ipapi.co/\${ipAddress}/json/\`);
>
> const geoData = await geoResponse.json();
>
> geoLocationCity = geoData.city; // napr. \"Bratislava\"

**5. Email Form Tracking**

> function handleContactSubmit(event, formId) {
>
> emailjs.sendForm(\'service_xxx\', \'template_xxx\', \'#\' + formId)
>
> .then((response) =\> {
>
> // Nastaviť flag pre session
>
> markEmailSubmittedForSession(); // emailSubmittedInSession = true
>
> // Increment message index
>
> messageIndex++;
>
> // Uložiť email event
>
> saveEmailEventToAPI(botSuccessMessage, messageIndex);
>
> });
>
> }
>
> async function saveEmailEventToAPI(botSuccessMessage, emailMessageIndex) {
>
> await fetch(\'/api/saveChat\', {
>
> method: \'POST\',
>
> body: JSON.stringify({
>
> userMessage: \'Správa poslaná\',
>
> botResponse: botSuccessMessage,
>
> website: window.location.hostname,
>
> ipAddress: ipAddress,
>
> sessionId: getSessionId(),
>
> messageIndex: emailMessageIndex, // Sekvenčný index!
>
> timeToRespond: null,
>
> category: \'Email\',
>
> geoLocationCity: geoLocationCity,
>
> emailSubmitted: true
>
> })
>
> });
>
> }

**📤 Čo sa posiela do API endpoint /api/saveChat:**

**Request Body:**

> {
>
> userMessage: string, // Správa používateľa
>
> botResponse: string, // Odpoveď bota
>
> website: string, // window.location.hostname
>
> ipAddress: string, // z ipify.org API
>
> sessionId: string, // UUID
>
> messageIndex: number, // 1, 2, 3\...
>
> timeToRespond: number, // ms (null pre email event)
>
> category: string, // z RAG alebo keywords
>
> geoLocationCity: string, // z ipapi.co
>
> emailSubmitted: boolean // true/false
>
> }

**🔄 API Endpoint - **[saveChat.js](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)**:**

> import { createClient } from \'@supabase/supabase-js\';
>
> export default async function handler(req, res) {
>
> const supabase = createClient(
>
> process.env.SUPABASE_URL,
>
> process.env.SUPABASE_KEY
>
> );
>
> const {
>
> userMessage, botResponse, website, ipAddress,
>
> sessionId, messageIndex, timeToRespond,
>
> category, geoLocationCity, emailSubmitted
>
> } = req.body;
>
> // Validácia
>
> if (!userMessage \|\| !website \|\| !sessionId) {
>
> return res.status(400).json({ error: \'Bad request\' });
>
> }
>
> // Príprava dát
>
> const chatData = {
>
> user_message: userMessage,
>
> bot_response: botResponse \|\| null,
>
> website: website,
>
> user_ip: ipAddress \|\| null,
>
> session_id: sessionId,
>
> message_index: messageIndex \|\| null,
>
> time_to_respond: timeToRespond \|\| null,
>
> category: category \|\| null,
>
> geo_location_city: geoLocationCity \|\| null,
>
> email_submitted: emailSubmitted \|\| false,
>
> created_at: new Date().toISOString()
>
> };
>
> // Uloženie do Supabase
>
> const { data, error } = await supabase
>
> .from(\'chat_logs\')
>
> .insert(\[chatData\])
>
> .select();
>
> if (error) {
>
> return res.status(500).json({ error: error.message });
>
> }
>
> return res.status(200).json({ success: true, data });
>
> }

**🎯 Príklad priebehu konverzácie v databáze:**

> \-- Session: abc-123-def-456
>
> \-- Správa 1
>
> INSERT INTO chat_logs VALUES (
>
> user_message: \'Koľko to stojí?\',
>
> bot_response: \'Naše ceny začínajú od €99/mesiac\...\',
>
> session_id: \'abc-123-def-456\',
>
> message_index: 1,
>
> time_to_respond: 1250,
>
> category: \'ceny\',
>
> email_submitted: false
>
> );
>
> \-- Správa 2
>
> INSERT INTO chat_logs VALUES (
>
> user_message: \'Ktorý balík odporúčate?\',
>
> bot_response: \'Odporúčam PRO balík\...\',
>
> session_id: \'abc-123-def-456\',
>
> message_index: 2,
>
> time_to_respond: 980,
>
> category: \'ceny\',
>
> email_submitted: false
>
> );
>
> \-- Email event
>
> INSERT INTO chat_logs VALUES (
>
> user_message: \'Správa poslaná\',
>
> bot_response: \'🎉 Ďakujeme! Vaša správa\...\',
>
> session_id: \'abc-123-def-456\',
>
> message_index: 3,
>
> time_to_respond: null,
>
> category: \'Email\',
>
> email_submitted: true ← TRUE
>
> );
>
> \-- Správa 4 (ak user píše ďalej)
>
> INSERT INTO chat_logs VALUES (
>
> user_message: \'Ďakujem\',
>
> bot_response: \'Rád som pomohol!\',
>
> session_id: \'abc-123-def-456\',
>
> message_index: 4,
>
> time_to_respond: 650,
>
> category: \'všeobecné\',
>
> email_submitted: true ← stále TRUE
>
> );

**✅ Checklist pre nový bot:**

1.  ✅ Vytvor tabuľku chat_logs v Supabase

2.  ✅ Skopíruj session management kód

3.  ✅ Skopíruj RAG kategorizáciu (alebo keyword fallback)

4.  ✅ Implementuj saveChatToAPI() funkciu

5.  ✅ Implementuj saveEmailEventToAPI() funkciu

6.  ✅ Pridaj IP & geolocation tracking

7.  ✅ Vytvor [saveChat.js](vscode-file://vscode-app/c:/Users/lukyn/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) endpoint

8.  ✅ Nastav environment variables vo Vercel

9.  ✅ Pridaj @supabase/supabase-js do dependencies

**Všetko čo potrebuješ na replikáciu! 🚀**
