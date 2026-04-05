# complaints/utils.py
import os
import joblib
import spacy
import re

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

# Load custom model files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logistic_model = joblib.load(os.path.join(BASE_DIR, 'models/logistic_model.joblib'))
tfidf_vectorizer = joblib.load(os.path.join(BASE_DIR, 'models/tfidf_vectorizer.joblib'))
label_encoder = joblib.load(os.path.join(BASE_DIR, 'models/label_encoder.joblib'))

def advanced_clean_text(text):
    if not isinstance(text, str):
        return ''
    text = text.strip().lower()
    text = re.sub(r'<.*?>|http\S+|www\S+|https\S+|\S+@\S+', '', text)
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc 
              if not token.is_stop and not token.is_punct and not token.is_space and len(token.text) > 2]
    return ' '.join(tokens)

def predict_custom_sentiment(text):
    cleaned_text = advanced_clean_text(text)
    vectorized_text = tfidf_vectorizer.transform([cleaned_text])
    prediction = logistic_model.predict(vectorized_text)
    sentiment = label_encoder.inverse_transform(prediction)[0]
    return sentiment.capitalize()  # Capitalize to match TextBlob format (Positive, Negative, Neutral)