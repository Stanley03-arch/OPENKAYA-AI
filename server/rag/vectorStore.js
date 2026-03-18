const fs = require('fs');
const path = require('path');

const VECTOR_DB_PATH = path.join(__dirname, 'vectors.json');

class KeywordStore {
    constructor() {
        this.documents = [];
        this.documentKeys = new Set();
        this.load();
    }

    getDocumentKey(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    load() {
        if (fs.existsSync(VECTOR_DB_PATH)) {
            try {
                const data = fs.readFileSync(VECTOR_DB_PATH, 'utf-8');
                this.documents = JSON.parse(data);
                this.documentKeys = new Set(this.documents.map((d) => this.getDocumentKey(d.text)));
                console.log(`Loaded ${this.documents.length} documents for keypad search.`);
            } catch (e) {
                console.error("Error loading store:", e);
                this.documents = [];
                this.documentKeys = new Set();
            }
        } else {
            console.log("No existing store found. Starting fresh.");
            this.documents = [];
            this.documentKeys = new Set();
        }
    }

    save() {
        fs.writeFileSync(VECTOR_DB_PATH, JSON.stringify(this.documents, null, 2));
    }

    async addDocuments(chunks, embeddings, metadata) {
        // We ignore embeddings for keyword search
        for (let i = 0; i < chunks.length; i++) {
            const key = this.getDocumentKey(chunks[i]);
            if (!key || this.documentKeys.has(key)) continue;
            this.documents.push({
                id: `doc_${Date.now()}_${i}`,
                text: chunks[i],
                metadata: metadata[i] || {}
            });
            this.documentKeys.add(key);
        }
        this.save();
        console.log(`Keyword store now contains ${this.documents.length} chunks.`);
    }

    // Simple keyword scoring
    score(query, text) {
        if (!query || !text) return 0;

        // Common Luo and English stop words to ignore
        const STOP_WORDS = new Set([
            'en', 'ma', 'ni', 'gi', 'to', 'ka', 'mar', 'e', 'ne', 'kama', 'man', // Luo
            'the', 'is', 'of', 'in', 'to', 'and', 'a', 'for', 'with', 'on', 'at' // English
        ]);

        // Split by non-word chars but keep apostrophes for Luo words
        const queryTerms = query.toLowerCase().match(/[a-z']+/g) || [];

        // Filter terms: length >= 2 AND not in stop words
        const validTerms = queryTerms.filter(t => t.length >= 2 && !STOP_WORDS.has(t));

        const textLower = text.toLowerCase();

        let score = 0;
        for (const term of validTerms) {
            // Basic frequency count, escaping term for regex
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
            const matches = textLower.match(regex);
            if (matches) {
                // Boost exact phrase matches if possible, but for now simple count
                score += matches.length;
            }
        }
        return score;
    }

    async search(query, topK = 3) {
        if (this.documents.length === 0) return { documents: [[]], metadatas: [[]] };

        const scored = this.documents.map(doc => ({
            ...doc,
            score: this.score(query, doc.text)
        }));

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Filter out zero scores if possible, but keep at least 1 if it's a match
        const topResults = scored.filter(d => d.score > 0).slice(0, topK);

        // Return format matching the expected structure
        return {
            documents: [topResults.map(r => r.text)],
            metadatas: [topResults.map(r => r.metadata)]
        };
    }
}

module.exports = new KeywordStore();
