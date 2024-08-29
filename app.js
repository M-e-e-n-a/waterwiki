const express = require('express');
const fs = require('fs');
const fuzzy = require('fuzzy');

const app = express();
const port = 5001;

// Load the JSON data
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Create an inverted index for keywords
const invertedIndex = {};
data.forEach(entry => {
    entry.keywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        if (!invertedIndex[lowerKeyword]) {
            invertedIndex[lowerKeyword] = [];
        }
        invertedIndex[lowerKeyword].push(entry);
    });
});

function recommend(word) {
    const recommendations = [];

    // Fuzzy match against the inverted index
    Object.keys(invertedIndex).forEach(keyword => {
        const matches = fuzzy.filter(word, [keyword]);
        const matchScore = matches[0]?.score || 0;

        if (matchScore > 0.5) {  // Threshold for fuzzy matching
            invertedIndex[keyword].forEach(entry => {
                recommendations.push({ entry, matchScore });
            });
        }
    });

    // Sort recommendations by the match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Extract unique entries and return the top 5
    const uniqueRecommendations = [];
    const seenIds = new Set();
    recommendations.forEach(rec => {
        if (!seenIds.has(rec.entry.id)) {
            uniqueRecommendations.push(rec.entry);
            seenIds.add(rec.entry.id);
        }
    });

    return uniqueRecommendations.slice(0, 5);
}

app.get('/recommend', (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.status(400).json({ error: "Missing 'word' parameter" });
    }

    const recommendations = recommend(word.toLowerCase());
    res.json(recommendations);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
