# recommend.py

import sys
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from pymongo import MongoClient
from bson import ObjectId

try:
    user_id = sys.argv[1]
    current_article_id = sys.argv[2]
except IndexError:
    print("[]")
    sys.exit(0)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["SportsRoundups"]

# Fetch all normal articles
cricket = list(db["cricket"].find())
football = list(db["football"].find())
other = list(db["other"].find())

all_articles = cricket + football + other
df = pd.DataFrame(all_articles)

# Prepare content column
df = df[["_id", "title", "description"]]
df["content"] = df["title"].fillna('') + " " + df["description"].fillna('')

# Compute TF-IDF
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df["content"])

# Get index of current article
try:
    idx = df[df["_id"] == ObjectId(current_article_id)].index[0]
except IndexError:
    print("[]")
    sys.exit(0)

# Compute similarity
cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
sim_scores = list(enumerate(cosine_sim[idx]))
sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
sim_scores = sim_scores[1:4]  # Top 5 excluding self

# Prepare response
article_indices = [i[0] for i in sim_scores]
recommended = df.iloc[article_indices][["_id", "title"]].to_dict(orient='records')

# Convert ObjectId to string (necessary for JSON.stringify in Node)
for item in recommended:
    item["_id"] = str(item["_id"])

# ✅ ONLY THIS SHOULD PRINT (No debug info!)
import json
print(json.dumps(recommended))  




