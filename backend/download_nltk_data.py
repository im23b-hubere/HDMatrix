import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download alle benötigten NLTK-Daten
packages = [
    'punkt',
    'punkt_tab',
    'averaged_perceptron_tagger',
    'maxent_ne_chunker',
    'words',
    'stopwords',
    'universal_tagset'
]

for package in packages:
    try:
        print(f"Downloading {package}...")
        nltk.download(package)
    except Exception as e:
        print(f"Error downloading {package}: {str(e)}")
        
print("Download completed!") 