from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
from sklearn.linear_model import LogisticRegression

texts = [
    "Learn Python functions and recursion",
    "Memes about cats and jokes",
]

# Set up TF-IDF vectorizer with stopwords removed
vectorizer = TfidfVectorizer(
    stop_words='english',     # remove common English words like "and", "the", etc.
    lowercase=True,           # default = True, ensures case consistency
    ngram_range=(1, 1)        # unigrams only (can try bigrams later)
)

X = vectorizer.fit_transform(texts)

# Show the shape
print("TF-IDF matrix shape:", X.shape)  # (num_docs, num_words)

# Show vocabulary
print("Vocabulary:", vectorizer.get_feature_names_out())

# Convert sparse matrix to readable DataFrame
df = pd.DataFrame(X.toarray(), columns=vectorizer.get_feature_names_out())
print(df)

labels = [1, 0]
