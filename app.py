from flask import Flask, request, jsonify
import json
from fuzzywuzzy import fuzz
from collections import defaultdict

app = Flask(__name__)

# Load the JSON data
with open('data.json', 'r') as f:
    data = json.load(f)

# Create an inverted index for keywords
inverted_index = defaultdict(list)
for entry in data:
    for keyword in entry['keywords']:
        inverted_index[keyword.lower()].append(entry)

def recommend(word):
    word = word.lower()
    recommendations = []
    
    # Fuzzy match against the inverted index
    for keyword in inverted_index:
        match_score = fuzz.partial_ratio(word, keyword)
        if match_score > 70:  # Threshold for fuzzy matching
            for entry in inverted_index[keyword]:
                recommendations.append((entry, match_score))
    
    # Sort recommendations by the match score
    recommendations.sort(key=lambda x: x[1], reverse=True)
    
    # Extract unique entries and return the top 5
    unique_recommendations = []
    seen_ids = set()
    for rec, score in recommendations:
        if rec['id'] not in seen_ids:
            unique_recommendations.append(rec)
            seen_ids.add(rec['id'])
    
    return unique_recommendations[:5]

@app.route('/recommend', methods=['GET'])
def recommend_route():
    word = request.args.get('word')
    if not word:
        return jsonify({"error": "Missing 'word' parameter"}), 400
    
    recommendations = recommend(word)
    return jsonify(recommendations)

if __name__ == '__main__':
    app.run(debug=True)
