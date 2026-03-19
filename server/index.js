const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PDFGenerator = require('./pdfGenerator');
const PDFGeneratorLogic = require('./pdfGenerator');
const DocumentAgent = require('./documentAgent');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const SarvamService = require('./sarvamService');
const { retrieveContext } = require('./rag/ragService');
const { initDB } = require('./db');

// Load environment variables
dotenv.config();

const { search } = require('duck-duck-scrape');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/files', express.static(path.join(__dirname, 'public/files')));

// Ensure public/files directory exists
const generatedFilesDir = path.join(__dirname, 'public/files');
if (!fs.existsSync(generatedFilesDir)) {
    fs.mkdirSync(generatedFilesDir, { recursive: true });
}

// Serve Vite React frontend static files (must be before API routes)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    console.log('✅ Serving React frontend from client/dist');
} else {
    console.warn('⚠️  client/dist not found - run npm run build in client dir');
}

// API Keys Management
const apiKeys = {
    groq: process.env.GROQ_KEYS ? process.env.GROQ_KEYS.split(',') : [],
    openrouter: process.env.OPENROUTER_KEYS ? process.env.OPENROUTER_KEYS.split(',') : [],
    gemini: process.env.GEMINI_KEYS ? process.env.GEMINI_KEYS.split(',') : [],
    serper: process.env.SERPER_KEYS ? process.env.SERPER_KEYS.split(',') : [],
    ilovepdf: process.env.ILOVEPDF_KEYS ? process.env.ILOVEPDF_KEYS.split(',') : [],
    sarvam: process.env.SARVAM_AI_API_KEY ? [process.env.SARVAM_AI_API_KEY] : []
};

// Key Rotation Logic
class KeyManager {
    constructor(keys) {
        this.keys = keys;
        this.currentIndex = 0;
    }

    getKey() {
        if (!this.keys || this.keys.length === 0) return null;
        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    getAllKeys() {
        return this.keys;
    }
}

const keyManagers = {
    groq: new KeyManager(apiKeys.groq),
    openrouter: new KeyManager(apiKeys.openrouter),
    gemini: new KeyManager(apiKeys.gemini),
    serper: new KeyManager(apiKeys.serper),
    ilovepdf: new KeyManager(apiKeys.ilovepdf),
    sarvam: new KeyManager(apiKeys.sarvam)
};

// Initialize Document Agent
let documentAgent = null;
const geminiKeys = apiKeys.gemini;
if (geminiKeys.length > 0) {
    try {
        documentAgent = new DocumentAgent(geminiKeys[0]);
        console.log('✅ Document Agent initialized with Gemini API');
    } catch (error) {
        console.warn('⚠️  Document Agent initialization failed:', error.message);
    }
} else {
    console.warn('⚠️  No Gemini API key found. Document Agent features will be disabled.');
}

// Initialize Sarvam Service
const sarvamService = apiKeys.sarvam ? new SarvamService(apiKeys.sarvam) : null;
if (sarvamService) {
    console.log('✅ Sarvam AI Service initialized');
} else {
    console.warn('⚠️  Sarvam AI API key not found. TTS features will be disabled.');
}

// Helper function to execute with retry logic
const executeWithRetry = async (provider, operation) => {
    let attempts = 0;
    const maxAttempts = keyManagers[provider].getAllKeys().length || 1;

    while (attempts < maxAttempts) {
        const apiKey = keyManagers[provider].getKey();
        // If no keys for provider, try anyway (maybe not needed or using env var directly in some libs)
        // But here we rely on apiKey being passed.

        try {
            return await operation(apiKey);
        } catch (error) {
            console.error(`Error with ${provider} key (Attempt ${attempts + 1}/${maxAttempts}):`, error.message);
            attempts++;
            if (attempts === maxAttempts) throw error;
        }
    }
};

// Expose key manager for use
const keyManager = {
    executeWithRetry: (provider, op) => executeWithRetry(provider, op)
};

const isWebsiteGenerationRequest = (text = '') => {
    const normalized = text.toLowerCase();
    return /(build|create|generate|make|design)\s+(a\s+)?(website|web\s?site|landing\s?page|web\s?page)/i.test(normalized)
        || normalized.includes('html website')
        || normalized.includes('website code')
        || normalized.includes('portfolio website');
};

const isPdfGenerationRequest = (text = '') => {
    const normalized = text.toLowerCase();
    return /(generate|create|export|make|write)\s+(a\s+)?pdf/i.test(normalized)
        || normalized.includes('pdf report')
        || normalized.includes('pdf document')
        || normalized.includes('download pdf');
};

const isWebSearchRequest = (text = '') => {
    const normalized = text.toLowerCase();
    return /(search the web|search internet|look up online|latest news|who is the current|what is the price of|current events|search for|what happened today)/i.test(normalized);
};

const extractImagePrompt = (responseText = '') => {
    if (!responseText) return null;
    const match = responseText.match(/<kaya_image>([\s\S]*?)<\/kaya_image>/i);
    return match ? match[1].trim() : null;
};

const extractHtmlFromResponse = (responseText = '') => {
    if (!responseText) return null;

    const taggedBlock = responseText.match(/<kaya_website>([\s\S]*?)<\/kaya_website>/i);
    const taggedContent = taggedBlock ? taggedBlock[1] : responseText;

    const htmlBlock = taggedContent.match(/```html\s*([\s\S]*?)```/i);
    if (htmlBlock && htmlBlock[1]) {
        return htmlBlock[1].trim();
    }

    const genericCodeBlock = taggedContent.match(/```\s*([\s\S]*?)```/i);
    if (genericCodeBlock && genericCodeBlock[1]) {
        return genericCodeBlock[1].trim();
    }

    if (/<html[\s>]/i.test(taggedContent) || /<!doctype\s+html>/i.test(taggedContent)) {
        return taggedContent.trim();
    }

    return null;
};

const toStandaloneHtml = (html = '', prompt = '') => {
    const content = String(html || '').trim();
    if (!content) return null;

    if (/<html[\s>]/i.test(content) || /<!doctype\s+html>/i.test(content)) {
        return content;
    }

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kaya Website</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f7f9fc; color: #111827; }
    main { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
    .card { background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 10px 24px rgba(0,0,0,0.08); }
    pre { white-space: pre-wrap; word-break: break-word; background: #0b1020; color: #e5ecff; padding: 16px; border-radius: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>Generated Website</h1>
      <p>Prompt: ${prompt.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch]))}</p>
      ${content}
    </div>
  </main>
</body>
</html>`;
};

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'Kaya AI Backend' });
});

app.get('/api/auth/me', (req, res) => {
    // Mock auth or pass through
    res.json({ user: null });
});

app.post('/api/markdown-to-pdf', async (req, res) => {
    try {
        const { title = 'Kaya AI Document', content } = req.body || {};
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Content is required' });
        }

        const pdfFilename = `kaya_export_${Date.now()}.pdf`;
        const pdfPath = path.join(generatedFilesDir, pdfFilename);
        const pdfGen = new PDFGeneratorLogic({ title });

        pdfGen.addTitle(title);
        await pdfGen.addMarkdown(content);
        await pdfGen.save(pdfPath);

        const pdfUrl = `http://localhost:${PORT}/files/${pdfFilename}`;
        res.json({ pdfUrl });
    } catch (error) {
        console.error('Markdown-to-PDF Error:', error.message);
        res.status(500).json({ error: 'Failed to export PDF' });
    }
});

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { title = 'Kaya AI Document', content, options = {} } = req.body || {};
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Content is required' });
        }

        const documentId = uuidv4();
        const pdfFilename = `kaya_doc_${Date.now()}_${documentId.substring(0, 8)}.pdf`;
        const pdfPath = path.join(generatedFilesDir, pdfFilename);
        
        const mergedOptions = { title, ...options };
        const pdfGen = new PDFGeneratorLogic(mergedOptions);

        pdfGen.addTitle(title);
        await pdfGen.addMarkdown(content);
        await pdfGen.save(pdfPath);

        const url = `http://localhost:${PORT}/files/${pdfFilename}`;
        res.json({ url, documentId });
    } catch (error) {
        console.error('Generate PDF Error:', error.message);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});


// Chat Endpoint with RAG and PDF Generation
app.post('/api/chat', async (req, res) => {
    const { messages, provider = 'groq', image } = req.body;
    const db = await initDB();

    // Ensure a default user exists for this demo
    const defaultUserId = 'default-user';
    await db.run('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)', [defaultUserId, 'user@example.com']);


    try {
        // Extract the last user message for processing
        const userMsgs = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1] : null;

        if (!lastUserMessage) {
            return res.status(400).json({ error: 'No user message found' });
        }

        // Helper for normalization
        const normalizeText = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedMsg = normalizeText(lastUserMessage.content);
        const lowerMsg = lastUserMessage.content.toLowerCase(); // Keep specific variable for backwards compat if needed, or just use normalized
        const wantsWebsiteGeneration = isWebsiteGenerationRequest(lastUserMessage.content);
        const wantsPdfGeneration = isPdfGenerationRequest(lastUserMessage.content);
        const luoBoostKeywords = [
            "dholuo", "jaluo", "misawa", "nango", "inyalo", "adwaro", "erokamano", "ng'a", "chak", "kony"
        ];
        const kenyaLanguageKeywords = [
            "kisii", "ekegusii", "gusii", "luhya", "kiluhya", "lulogooli", "oluluhya",
            "kalenjin", "nandi", "kipsigis", "tugen", "marakwet", "meru", "kimeru", "maasai", "maa"
        ];
        const isLikelyLuoQuery = luoBoostKeywords.some((k) => normalizedMsg.includes(k));
        const isLikelyKenyanLanguageQuery = kenyaLanguageKeywords.some((k) => normalizedMsg.includes(k));

        // Normal chat flow with multi-provider fallback
        let ragContext = await retrieveContext(lastUserMessage.content, (isLikelyLuoQuery || isLikelyKenyanLanguageQuery) ? 8 : 4);

        const wantsWebSearch = isWebSearchRequest(lastUserMessage.content);
        if (wantsWebSearch) {
            try {
                console.log(`🔍 Web search triggered for: ${lastUserMessage.content}`);
                const searchResults = await search(lastUserMessage.content);
                if (searchResults && searchResults.results && searchResults.results.length > 0) {
                    const topResults = searchResults.results.slice(0, 3).map(r => `- ${r.title}: ${r.description} (Source: ${r.url})`).join('\n');
                    ragContext = `${ragContext}\n\n### LATEST WEB SEARCH RESULTS:\n${topResults}\n`;
                }
            } catch (err) {
                console.error("Web search failed:", err.message);
            }
        }

        // GLOBAL PROVIDER ROTATION (Load Balancing)
        // Rotate the starting provider to distribute load across all keys (Groq + OpenRouter + Gemini)
        const allProviders = ['groq', 'openrouter', 'gemini', 'sarvam'];

        // If provider is specified in request, prioritize it. Otherwise use rotation.
        let providers = [];
        if (req.body.provider && req.body.provider !== 'groq') {
            // User forced a specific provider
            providers = [req.body.provider, ...allProviders.filter(p => p !== req.body.provider)];
        } else {
            // Automatic Rotation
            if (!global.providerIndex) global.providerIndex = 0;
            const startIdx = global.providerIndex % allProviders.length;
            global.providerIndex++;

            // Reorder providers starting from the rotated index
            // e.g. index 0: ['groq', 'openrouter', 'gemini']
            // e.g. index 1: ['openrouter', 'gemini', 'groq']
            // e.g. index 2: ['gemini', 'groq', 'openrouter']
            providers = [
                ...allProviders.slice(startIdx),
                ...allProviders.slice(0, startIdx)
            ];
            console.log(`⚖️ Load Balancing: Starting with ${providers[0]} (Rotation Index: ${startIdx})`);
        }

        let response = null;
        let lastError = null;

        for (const currentProvider of providers) {
            try {
                console.log(`🔄 Attempting with provider: ${currentProvider}`);
                response = await keyManager.executeWithRetry(currentProvider, async (apiKey) => {

                    // COMPREHENSIVE MULTILINGUAL DETECTION

                    // Luo Keywords (Expanded to 100+)
                    const luoKeywords = [
                        "idhi nade", "oyaore", "misawa", "dholuo", "ng'a", "rais en", "kit mikai", "nango",
                        "inyalo", "konya", "adwaro", "anyalo", "erokamano", "kiyie", "ibiro",
                        "sa adi", "chiemo", "metho", "dala", "joodi", "nyingi",
                        "wuonu", "minu", "osiep", "hera", "chuny", "rieko", "jaluo", "nyasaye", "gweth",
                        "wacho", "iwacho", "penjo", "dwoko", "winjo", "timo",
                        "itimo", "idhi", "isomo", "idak", "ohala",
                        "kik in", "kodi", "mondo", "kawuono", "nyoro", "kanyo", "ok inyal", "ber ahinya",
                        "koro", "maber", "en ango", "an maber", "en ang'o", "koro biology", "atuo", "amor", "pesa",
                        "ang'o itimo", "kanye idhi", "sa adi ibiro", "ng'a owacho", "kare ang'o",
                        "achiemo", "atedo", "ang'iewo", "adwaro pesa", "ber ahinya", "duong' moloyo",
                        "tek ahinya", "yot moloyo", "ok adhi", "ok ochiemo", "osechiemo", "asedhi",
                        "bukuna", "ohta", "simune", "garwa", "chalo gi", "kiyie ikonya", "anyalo dhi",
                        "anyalo penjo", "inyalo nyisa", "e ot", "e skul", "e ohala", "ir wuora",
                        "mondo asom", "bang' chiemo", "kapok adhi", "wuod-jaluo", "nyar-jaluo",
                        "wuon-dala", "jatich", "japuonj", "odhi ber", "oriti", "wang'-teko",
                        "chuny-maber", "dhok-maber", "it-matin", "mako-wang'", "mor-mar-chuny",
                        "wach-maber", "wach-marach", "loko-ohala", "ot-lemo", "ot-somo", "onge-gimoro"
                    ];

                    // French Keywords
                    const frenchKeywords = [
                        "bonjour", "salut", "merci", "comment", "ça va", "oui", "non", "s'il vous plaît",
                        "pardon", "excusez", "au revoir", "bonsoir", "bonne nuit", "je suis", "tu es",
                        "comment allez-vous", "enchanté", "de rien", "avec plaisir", "français"
                    ];

                    // Kikuyu Keywords
                    const kikuyuKeywords = [
                        "wĩ mwega", "nĩ atĩa", "nĩ wega", "nĩ ũrĩa", "thengiu", "nĩ kĩĩ", "ũguo nĩ wega",
                        "ndĩ mwega", "wĩ ũ", "gĩkũyũ", "mũgĩkũyũ", "ũhoro", "ũrĩa", "atĩrĩrĩ"
                    ];

                    // Kamba Keywords
                    const kambaKeywords = [
                        "mwĩthĩo", "nĩ atĩa", "nesa", "nĩ ũndũ", "asante", "wĩ ũ", "ũkamba",
                        "mũkamba", "ũhoro", "nĩ kĩĩ", "wĩ mwega", "ndĩ mwega"
                    ];

                    // Spanish Keywords
                    const spanishKeywords = [
                        "hola", "buenos días", "buenas tardes", "buenas noches", "gracias", "por favor",
                        "cómo estás", "cómo está", "qué tal", "adiós", "hasta luego", "sí", "no",
                        "perdón", "disculpa", "mucho gusto", "de nada", "español", "hablas", "espanyol",
                        "bien", "y tú", "un poco", "amigo"
                    ];

                    // Arabic Keywords
                    const arabicKeywords = [
                        "مرحبا", "السلام عليكم", "صباح الخير", "مساء الخير", "شكرا", "من فضلك",
                        "كيف حالك", "نعم", "لا", "مع السلامة", "عربي", "عربية", "أهلا", "تشرفنا"
                    ];

                    // Chinese (Mandarin) Keywords
                    const chineseKeywords = [
                        "你好", "早上好", "晚上好", "谢谢", "请", "对不起", "再见", "是", "不是",
                        "怎么样", "中文", "普通话", "您好", "不客气", "没关系"
                    ];

                    // Swahili Keywords
                    const swahiliKeywords = [
                        "habari", "mambo", "nini", "asante", "tafadhali", "pole", "kwaheri",
                        "ndiyo", "hapana", "karibu", "jambo", "kiswahili", "sawa", "unaendelea aje",
                        "uko aje", "vipi", "poa", "mzuri", "niko", "salama", "na wewe", "kaka", "dada",
                        "shikamoo", "marahaba"
                    ];

                    // Kisii (Ekegusii) Keywords
                    const kisiiKeywords = [
                        "kisii", "ekegusii", "gusii", "omogusii", "egesii", "bwire", "mwaye"
                    ];

                    // Luhya Keywords
                    const luhyaKeywords = [
                        "luhya", "kiluhya", "oluluhya", "lulogooli", "bukusu", "idakho", "mulembe"
                    ];

                    // Kalenjin Keywords
                    const kalenjinKeywords = [
                        "kalenjin", "nandi", "kipsigis", "tugen", "keiyo", "marakwet", "pokot", "chamgei"
                    ];

                    // Meru Keywords
                    const meruKeywords = [
                        "meru", "kimeru", "imeru", "njuri", "nchiru", "mweri"
                    ];

                    // Maasai (Maa) Keywords
                    const maasaiKeywords = [
                        "maasai", "masaai", "maa", "enkang", "sopa", "sidai"
                    ];

                    // Detect Language
                    // Use normalized checking to handle accents and exact word boundaries to prevent bugs like "si" in "website"
                    const isMatch = (keywords, text) => keywords.some(k => {
                        const escaped = normalizeText(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
                    });

                    const isLuo = isMatch(luoKeywords, normalizedMsg);
                    const isFrench = isMatch(frenchKeywords, normalizedMsg);
                    const isKikuyu = isMatch(kikuyuKeywords, normalizedMsg);
                    const isKamba = isMatch(kambaKeywords, normalizedMsg);
                    const isSpanish = isMatch(spanishKeywords, normalizedMsg);
                    const hasArabicScript = /[\u0600-\u06ff]/.test(lastUserMessage.content);
                    const hasChineseScript = /[\u4e00-\u9fff]/.test(lastUserMessage.content);
                    const isArabic = hasArabicScript || isMatch(arabicKeywords, normalizedMsg);
                    const isChinese = hasChineseScript || isMatch(chineseKeywords, normalizedMsg);
                    const isSwahili = isMatch(swahiliKeywords, normalizedMsg);
                    const isKisii = isMatch(kisiiKeywords, normalizedMsg);
                    const isLuhya = isMatch(luhyaKeywords, normalizedMsg);
                    const isKalenjin = isMatch(kalenjinKeywords, normalizedMsg);
                    const isMeru = isMatch(meruKeywords, normalizedMsg);
                    const isMaasai = isMatch(maasaiKeywords, normalizedMsg);

                    let systemPromptContent = "";

                    // KIKUYU LANGUAGE HANDLING (Priority)
                    if (isKikuyu) {
                        if (normalizedMsg.includes("wĩ mwega")) {
                            return "Wĩ mwega! Nĩ niĩ Kaya AI. Ũkwenda ũteithio atĩa?";
                        }
                        if (normalizedMsg.includes("nĩ atĩa") || normalizedMsg.includes("ũrĩ atĩa")) {
                            return "Ndĩ mwega mũno! Nawe ũrĩ atĩa?";
                        }
                        if (normalizedMsg.includes("thengiu")) {
                            return "Ndũrĩ na ũndũ! Nĩ ngũkenera gũgũteithia.";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Kikuyu (Gĩkũyũ). Be helpful and respectful.

**USER MESSAGE (Kikuyu):** "${lastUserMessage.content}"`;
                    }
                    // KAMBA LANGUAGE HANDLING
                    else if (isKamba) {
                        if (normalizedMsg.includes("mwĩthĩo")) {
                            return "Mwĩthĩo! Nĩ niĩ Kaya AI. Nĩ ndakũteithya atĩa?";
                        }
                        if (normalizedMsg.includes("nĩ atĩa")) {
                            return "Ndĩ mwega! Nawe ũrĩ atĩa?";
                        }
                        if (normalizedMsg.includes("asante")) {
                            return "Ndũrĩ na ũndũ! Nĩ ngũkenera gũgũteithia.";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Kamba (Kĩkamba). Be helpful and respectful.

**USER MESSAGE (Kamba):** "${lastUserMessage.content}"`;
                    }
                    // SWAHILI LANGUAGE HANDLING
                    else if (isSwahili) {
                        if (normalizedMsg.includes("habari") || normalizedMsg.includes("mambo") || normalizedMsg.includes("jambo")) {
                            return "Habari! Mimi ni Kaya AI. Naweza kukusaidia vipi leo?";
                        }
                        if (normalizedMsg.includes("asante")) {
                            return "Karibu sana! Ninafurahi kukusaidia.";
                        }
                        if (normalizedMsg.includes("kwaheri")) {
                            return "Kwaheri! Tutaonana tena!";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Swahili. Be helpful and respectful.

**USER MESSAGE (Swahili):** "${lastUserMessage.content}"`;
                    }
                    // KISII LANGUAGE HANDLING
                    else if (isKisii) {
                        if (normalizedMsg.includes("bwire") || normalizedMsg.includes("mwaye")) {
                            return "Bwire! Nene ni Kaya AI. Nching'e gokonyia ndenge?";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Kisii (Ekegusii). Be helpful and respectful.
If unsure about dialect wording, use simple Kisii and ask a brief clarification question.

**USER MESSAGE (Kisii):** "${lastUserMessage.content}"`;
                    }
                    // LUHYA LANGUAGE HANDLING
                    else if (isLuhya) {
                        if (normalizedMsg.includes("mulembe")) {
                            return "Mulembe! Ndi Kaya AI. Ninyala okhukhonyia khuliina?";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Luhya (use broadly understandable Luhya wording).
If dialect uncertainty appears, ask user to specify dialect (e.g., Bukusu, Maragoli, Idakho).

**USER MESSAGE (Luhya):** "${lastUserMessage.content}"`;
                    }
                    // KALENJIN LANGUAGE HANDLING
                    else if (isKalenjin) {
                        if (normalizedMsg.includes("chamgei")) {
                            return "Chamgei! An Kaya AI. Anyal akonuk nge?";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Kalenjin (neutral wording understandable across major Kalenjin dialects).
If wording may vary by dialect (Nandi/Kipsigis/Tugen), ask a short clarification.

**USER MESSAGE (Kalenjin):** "${lastUserMessage.content}"`;
                    }
                    // MERU LANGUAGE HANDLING
                    else if (isMeru) {
                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Meru (Kimeru), in simple and respectful style.
If user asks translation, provide Kimeru + requested target language.

**USER MESSAGE (Meru):** "${lastUserMessage.content}"`;
                    }
                    // MAASAI LANGUAGE HANDLING
                    else if (isMaasai) {
                        if (normalizedMsg.includes("sopa")) {
                            return "Sopa! Nanu Kaya AI. Aingoru enkata ening?";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Maasai (Maa), with respectful and clear phrasing.
If uncertain about local variant, keep it simple and ask a short follow-up.

**USER MESSAGE (Maasai):** "${lastUserMessage.content}"`;
                    }
                    // SPANISH LANGUAGE HANDLING
                    else if (isSpanish) {
                        if (normalizedMsg.includes("hola") || normalizedMsg.includes("buenos días") || normalizedMsg.includes("buenas tardes")) {
                            return "¡Hola! Soy Kaya AI. ¿Cómo puedo ayudarte hoy?";
                        }
                        if (normalizedMsg.includes("cómo estás") || normalizedMsg.includes("qué tal")) {
                            return "¡Estoy muy bien, gracias! ¿Y tú?";
                        }
                        if (normalizedMsg.includes("gracias")) {
                            return "¡De nada! Estoy feliz de ayudarte.";
                        }
                        if (normalizedMsg.includes("adiós") || normalizedMsg.includes("hasta luego")) {
                            return "¡Adiós! ¡Hasta pronto!";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Spanish. Be helpful, polite, and professional.

**USER MESSAGE (Spanish):** "${lastUserMessage.content}"`;
                    }
                    // FRENCH LANGUAGE HANDLING
                    else if (isFrench) {
                        if (normalizedMsg.includes("bonjour") || normalizedMsg.includes("salut")) {
                            return "Bonjour! Je suis Kaya AI. Comment puis-je vous aider aujourd'hui?";
                        }
                        if (normalizedMsg.includes("ça va") || normalizedMsg.includes("comment allez-vous")) {
                            return "Je vais très bien, merci! Et vous?";
                        }
                        if (normalizedMsg.includes("merci")) {
                            return "De rien! Je suis heureux de vous aider.";
                        }
                        if (normalizedMsg.includes("au revoir")) {
                            return "Au revoir! À bientôt!";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in French. Be helpful, polite, and professional.

**USER MESSAGE (French):** "${lastUserMessage.content}"`;
                    }
                    // ARABIC LANGUAGE HANDLING
                    else if (isArabic) {
                        if (normalizedMsg.includes("مرحبا") || normalizedMsg.includes("السلام عليكم") || normalizedMsg.includes("أهلا")) {
                            return "مرحبا! أنا Kaya AI. كيف يمكنني مساعدتك اليوم؟";
                        }
                        if (normalizedMsg.includes("كيف حالك")) {
                            return "أنا بخير، شكراً! وأنت؟";
                        }
                        if (normalizedMsg.includes("شكرا")) {
                            return "على الرحب والسعة! يسعدني مساعدتك.";
                        }
                        if (normalizedMsg.includes("مع السلامة")) {
                            return "مع السلامة! إلى اللقاء!";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Arabic. Be helpful, polite, and professional.

**USER MESSAGE (Arabic):** "${lastUserMessage.content}"`;
                    }
                    // CHINESE (MANDARIN) LANGUAGE HANDLING
                    else if (isChinese) {
                        if (normalizedMsg.includes("你好") || normalizedMsg.includes("您好")) {
                            return "你好！我是Kaya AI。今天我能帮你什么？";
                        }
                        if (normalizedMsg.includes("怎么样")) {
                            return "我很好，谢谢！你呢？";
                        }
                        if (normalizedMsg.includes("谢谢")) {
                            return "不客气！我很高兴能帮助你。";
                        }
                        if (normalizedMsg.includes("再见")) {
                            return "再见！回头见！";
                        }

                        systemPromptContent = `You are Kaya AI, a helpful AI assistant.

### KNOWLEDGE BASE:
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### INSTRUCTION:
Respond ONLY in Chinese (Mandarin). Be helpful, polite, and professional.

**USER MESSAGE (Chinese):** "${lastUserMessage.content}"`;
                    }
                    // LUO LANGUAGE HANDLING (Placed after others to prevent false positives)
                    else if (isLuo) {
                        // HARDCODED LUO RESPONSES
                        if (normalizedMsg.includes("nango") || normalizedMsg.includes("idhi nade")) {
                            return "Adhi maber. In nango?";
                        }
                        if (normalizedMsg.includes("oyaore") || normalizedMsg.includes("oyawore")) {
                            return "Oyawore. Inindo nade?";
                        }
                        if (normalizedMsg.includes("oimore")) {
                            return "Oimore. Tich dhi nade?";
                        }
                        if (normalizedMsg.includes("otieno")) {
                            return "Otieno. Chieng' ne nade?";
                        }
                        if (normalizedMsg.includes("in ng'a") || normalizedMsg.includes("in ang'o")) {
                            return "An Open Kaya AI, japuonj mar rieko ma nochweyo gi tim mar OpenKaya ma jatelo maduong' (CEO) en Stanley Samwel Owino. An gi rieko mathoth kuom Dholuo, tim Jaluo, kod weche duto mag Jaluo.";
                        }
                        if (normalizedMsg.includes("nyingi ng'a")) {
                            return "Nyinga en Open Kaya AI.";
                        }
                        if (normalizedMsg.includes("inyalo konya") || normalizedMsg.includes("anyalo yudo kony") || normalizedMsg.includes("koro inyalo konya")) {
                            return "Ee, anyalo konyi! Inyalo penga gimoro amora kuom Dholuo, tim Jaluo, kata weche mag Kenya. Adwaro konyi nade?";
                        }
                        if (normalizedMsg.includes("itimo ang'o") || normalizedMsg.includes("inyalo timo ang'o")) {
                            return "Anyalo konyi gi weche mathoth: puonjo Dholuo, loko weche, miyo ngeche mag Jaluo, kod dwoko penjo duto mag Dholuo. Penj gimoro!";
                        }
                        if (normalizedMsg.includes("erokamano")) {
                            return "Onge gima! Amor konyi pile.";
                        }
                        if (normalizedMsg.includes("oriti") || normalizedMsg.includes("odhi ber")) {
                            return "Oriti maber! Wanere bang'e.";
                        }
                        if (normalizedMsg.includes("in kanye") || normalizedMsg.includes("idak kanye")) {
                            return "An Kaya AI, adak e intanet. Anyalo konyi kamoro amora!";
                        }
                        if (normalizedMsg.includes("isomo kanye")) {
                            return "Asomo weche duto mag Dholuo kod tim Jaluo. An gi rieko mar Jaluo duto.";
                        }
                        if (normalizedMsg.includes("iwacho ang'o") || normalizedMsg.includes("koro iwacho ang'o")) {
                            return "Awacho ni anyalo konyi gi gimoro amora ma idwaro. Penj gimoro kuom Dholuo, tim Jaluo, kata weche mag Kenya!";
                        }
                        if (normalizedMsg.includes("adwaro dhi") && normalizedMsg.includes("skul")) {
                            return "Ber ahinya! Somo en gimoro maduong'. Anyalo konyi gi weche mag somo kata puonjo Dholuo. Idwaro somo ang'o?";
                        }
                        if (normalizedMsg.includes("adwaro dhi")) {
                            return "Idwaro dhi kanye? Anyalo konyi gi yo kata weche mag dhi kamoro amora.";
                        }
                        if (normalizedMsg.includes("adwaro somo")) {
                            return "Ber! Idwaro somo ang'o? Anyalo puonji Dholuo, ngeche mag Jaluo, kata weche mamoko.";
                        }
                        if (normalizedMsg.includes("adwaro ng'eyo")) {
                            return "Maber! Idwaro ng'eyo ang'o? Penga gimoro amora kuom Dholuo kata tim Jaluo.";
                        }

                        systemPromptContent = `You are Open Kaya AI, created by the OpenKaya team whose CEO is Stanley Samwel Owino.

### KNOWLEDGE BASE (Luo Facts):
${ragContext ? `\n${ragContext}\n` : 'No specific Luo knowledge found.'}

### CRITICAL INSTRUCTION FOR LUO:
1. Respond in natural, clear Luo (Dholuo). Keep grammar and spelling strong.
2. Use the knowledge base first, but you may explain in your own words when needed.
3. If user asks for translation, provide Luo + requested language.
4. If unsure, say what you are unsure about and ask a short follow-up in Luo.

**USER QUESTION (Luo):** "${lastUserMessage.content}"`;
                    }
                    // ENGLISH (DEFAULT)
                    else {
                        // MULTILINGUAL DEFAULT PROMPT
                        systemPromptContent = `You are Open Kaya AI, a helpful and powerful AI assistant created by the OpenKaya team whose CEO is Stanley Samwel Owino.

### LANGUAGE RULE — CRITICAL:
The user's message is in ENGLISH. You MUST respond in ENGLISH ONLY.
Do NOT switch to Luo, Swahili, or any other language regardless of what the knowledge base contains.
If the user explicitly asks you to respond in another language, you may do so. Otherwise, always reply in English.

### KNOWLEDGE BASE (for factual context only):
${ragContext ? `\n${ragContext}\n` : 'No specific knowledge found.'}

### RULES:
1. Respond in ENGLISH always (unless user explicitly requests another language).
2. Use the knowledge base ONLY for factual questions — ignore its language, respond in English.
3. For greetings (e.g. "hello", "hi", "hey"), respond naturally and briefly in English.
4. Do NOT quote or translate from the knowledge base unless asked.
5. **Image Generation:** If the user asks you to create, generate, or draw an image/picture/photo, DO NOT use JSON or markdown images. Instead, respond EXACTLY with this tag:
   <kaya_image>A highly detailed visual description of the requested image in English</kaya_image>

**USER MESSAGE:** "${lastUserMessage.content}"`;
                    }

                    if (wantsWebsiteGeneration) {
                        systemPromptContent += `

### WEBSITE BUILDER MODE:
Return a complete, production-ready single-file website.
- Include semantic HTML, embedded CSS, and embedded JavaScript in one file.
- Make it responsive for mobile and desktop.
- Do not include explanations before the code.
- Format output exactly as:
<kaya_website>
\`\`\`html
<!doctype html>
...
\`\`\`
</kaya_website>`;
                    }
                    if (wantsPdfGeneration) {
                        systemPromptContent += `

### PDF MODE:
Generate structured markdown that can be directly converted to a professional PDF.
- Include a title, short summary, and clear sections.
- Use concise paragraphs and bullet points where useful.
- Do not include code fences unless explicitly asked.`;
                    }

                    const systemPrompt = {
                        role: 'system',
                        content: systemPromptContent
                    };

                    const conversationMessages = [systemPrompt, ...messages];

                    if (currentProvider === 'groq') {
                        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                            model: 'llama-3.3-70b-versatile',
                            messages: conversationMessages,
                            temperature: 0.7,
                            max_tokens: 2048
                        }, {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return result.data.choices[0].message.content;
                    }

                    if (currentProvider === 'openrouter') {
                        const result = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                            model: 'meta-llama/llama-3.3-70b-instruct',
                            messages: conversationMessages
                        }, {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return result.data.choices[0].message.content;
                    }

                    if (currentProvider === 'gemini') {
                        const geminiMessages = conversationMessages.filter(m => m.role !== 'system').map(m => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }]
                        }));

                        if (geminiMessages.length > 0) {
                            geminiMessages[0].parts[0].text = `${systemPrompt.content}\n\n${geminiMessages[0].parts[0].text}`;
                        }

                        const result = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                            contents: geminiMessages
                        });
                        return result.data.candidates[0].content.parts[0].text;
                    }


                    if (currentProvider === 'sarvam') {
                        const result = await axios.post('https://api.sarvam.ai/v1/chat/completions', {
                            model: 'sarvam-2b',
                            messages: conversationMessages,
                            temperature: 0.7,
                            max_tokens: 1024
                        }, {
                            headers: {
                                'api-subscription-key': apiKey,
                                'Content-Type': 'application/json'
                            }
                        });
                        return result.data.choices[0].message.content;
                    }

                    throw new Error('Unknown provider');
                });

                // If we got a response, break out of the loop
                if (response) {
                    console.log(`✅ Successfully got response from ${currentProvider}`);
                    break;
                }
            } catch (error) {
                console.error(`❌ ${currentProvider} failed:`, error.message);
                lastError = error;
                // Continue to next provider
            }
        }

        if (!response) {
            throw lastError || new Error('All providers failed');
        }

        const imagePrompt = extractImagePrompt(response);
        if (imagePrompt) {
            const encodedPrompt = encodeURIComponent(imagePrompt);
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
            const cleanResponse = response.replace(/<kaya_image>[\s\S]*?<\/kaya_image>/i, '').trim();

            let finalImageUrl = pollinationsUrl;

            try {
                // Download the image locally to bypass browser ad-blockers and CORS
                const imageResponse = await axios.get(pollinationsUrl, { responseType: 'arraybuffer' });
                const imageFilename = `kaya_img_${Date.now()}_${uuidv4().slice(0, 8)}.jpg`;
                const imagePath = path.join(generatedFilesDir, imageFilename);
                fs.writeFileSync(imagePath, imageResponse.data);

                // Use a relative path so it perfectly works on any domain/host (Railway or Localhost)
                finalImageUrl = `/files/${imageFilename}`;
            } catch (downloadErr) {
                console.error('Failed to proxy generated image locally:', downloadErr.message);
                // Fallback to the direct pollinations URL if download fails for some reason
            }

            try {
                const userMsgId = uuidv4();
                const assistantMsgId = uuidv4();
                
                await db.run('INSERT INTO chats (id, user_id, role, content) VALUES (?, ?, ?, ?)', 
                    [userMsgId, defaultUserId, 'user', lastUserMessage.content]);
                await db.run('INSERT INTO chats (id, user_id, role, content) VALUES (?, ?, ?, ?)', 
                    [assistantMsgId, defaultUserId, 'assistant', cleanResponse || "Here is your generated image:"]);
            } catch (dbError) {
                console.error('Failed to log image chat to DB:', dbError.message);
            }

            return res.json({
                reply: cleanResponse || "Here is your generated image:",
                imageUrl: finalImageUrl,
                isImageGeneration: true
            });
        }

        if (wantsPdfGeneration) {
            try {
                const pdfFilename = `kaya_doc_${Date.now()}.pdf`;
                const pdfPath = path.join(generatedFilesDir, pdfFilename);
                const pdfGen = new PDFGeneratorLogic({ title: 'Kaya AI Report' });

                await pdfGen.addMarkdown(response);
                await pdfGen.save(pdfPath);

                const pdfUrl = `/files/${pdfFilename}`;
                return res.json({
                    reply: `${response}\n\n📄 **[Download PDF](${pdfUrl})**`,
                    pdfUrl,
                    isPdfGeneration: true
                });
            } catch (pdfError) {
                console.error('PDF Generation Error:', pdfError.message);
                return res.json({
                    reply: response,
                    error: `PDF generation failed: ${pdfError.message}`
                });
            }
        }

        if (wantsWebsiteGeneration) {
            const extractedHtml = extractHtmlFromResponse(response);
            const finalHtml = toStandaloneHtml(extractedHtml || response, lastUserMessage.content);

            if (finalHtml) {
                const websiteFilename = `kaya_site_${Date.now()}_${uuidv4().slice(0, 8)}.html`;
                const websitePath = path.join(generatedFilesDir, websiteFilename);
                fs.writeFileSync(websitePath, finalHtml, 'utf8');

                const previewUrl = `/files/${websiteFilename}`;
                return res.json({
                    reply: `${response}\n\n[Open Website Preview](${previewUrl})`,
                    previewUrl,
                    isWebsiteGeneration: true
                });
            }
        }

        // Persist the conversation to SQLite
        try {
            const userMsgId = uuidv4();
            const assistantMsgId = uuidv4();
            
            await db.run('INSERT INTO chats (id, user_id, role, content) VALUES (?, ?, ?, ?)', 
                [userMsgId, defaultUserId, 'user', lastUserMessage.content]);
            await db.run('INSERT INTO chats (id, user_id, role, content) VALUES (?, ?, ?, ?)', 
                [assistantMsgId, defaultUserId, 'assistant', response]);
        } catch (dbError) {
            console.error('Failed to persist chat message:', dbError.message);
        }

        res.json({ reply: response });

    } catch (error) {
        console.error('Chat Error:', error.message);
        res.status(500).json({ error: 'Failed to generate response. All API providers are currently unavailable or have exceeded their quota limits. Please try again later.' });
    }
});

// Vision Endpoint
app.post('/api/vision', async (req, res) => {
    const { messages, imageUrl } = req.body;

    try {
        const response = await keyManager.executeWithRetry('openrouter', async (apiKey) => {
            const visionMessages = messages.map(msg => {
                if (msg.role === 'user' && imageUrl) {
                    return {
                        role: 'user',
                        content: [
                            { type: 'text', text: msg.content },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    };
                }
                return msg;
            });

            const result = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                messages: visionMessages,
                model: 'allenai/molmo-2-8b:free',
            }, {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            return result.data.choices[0].message.content;
        });

        res.json({ reply: response });

    } catch (error) {
        console.error('Vision Error:', error.message);
        res.status(500).json({ error: 'Failed to process vision request.' });
    }
});

// Image Generation Endpoint
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const encodedPrompt = encodeURIComponent(prompt);
        // Using Pollinations AI
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux`;
        const uniqueUrl = `${imageUrl}&t=${Date.now()}`;

        res.json({
            reply: `Included is the image you requested based on "${prompt}":`,
            imageUrl: uniqueUrl,
            isImageGeneration: true
        });
    } catch (error) {
        console.error('Image Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// Web Search Endpoint
app.post('/api/search', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const response = await keyManager.executeWithRetry('serper', async (apiKey) => {
            const result = await axios.post('https://google.serper.dev/search', {
                q: query
            }, {
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            return result.data;
        });

        let searchSummary = "Search Results:\n";
        if (response.organic && response.organic.length > 0) {
            response.organic.slice(0, 5).forEach((item, index) => {
                searchSummary += `${index + 1}. [${item.title}](${item.link}): ${item.snippet}\n`;
            });
        } else {
            searchSummary += "No relevant results found.";
        }

        res.json({ result: searchSummary });

    } catch (error) {
        console.error('Search Error:', error.message);
        res.status(500).json({ error: 'Failed to perform web search' });
    }
});

// Sarvam TTS Endpoint
app.post('/api/tts', async (req, res) => {
    const { text, languageCode = 'hi-IN', speaker = 'shubh' } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    if (!sarvamService) {
        return res.status(503).json({ error: 'Sarvam TTS service is not available' });
    }

    try {
        const audios = await sarvamService.textToSpeech(text, languageCode, speaker);
        res.json({ audios });
    } catch (error) {
        console.error('TTS Error:', error.message);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

// ==================== VOICE AGENT ENDPOINTS ====================
app.get('/api/voice/test', (req, res) => {
    res.json({ status: 'ok', service: 'Voice Agent', sarvamAvailable: !!sarvamService });
});

app.post('/api/voice/speak', async (req, res) => {
    const { text, languageCode = 'hi-IN', speaker = 'shubh' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    if (!sarvamService) return res.status(503).json({ error: 'Voice service not initialized' });

    try {
        const audios = await sarvamService.textToSpeech(text, languageCode, speaker);
        res.json({ audio: audios[0] });
    } catch (error) {
        console.error('Voice/Speak Error:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.post('/api/voice/transcribe', async (req, res) => {
    const { audio, languageCode = 'en-IN' } = req.body;
    if (!audio) return res.status(400).json({ error: 'Audio data required' });
    if (!sarvamService) return res.status(503).json({ error: 'Voice service not initialized' });

    try {
        const transcript = await sarvamService.speechToText(audio, languageCode);
        res.json({ transcript });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});










// Catch-all: serve React app for all non-API routes (React Router support)
app.get(/.*/, (req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built yet. Run npm run build in client directory.');
    }
});

initDB().then(() => {
    console.log('✅ SQLite Database initialized');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database', err);
});
