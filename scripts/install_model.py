import requests
import json

def install_mistral():
    url = "http://localhost:11434/api/pull"
    data = {
        "name": "mistral"
    }
    
    print("Starting Mistral model installation...")
    try:
        response = requests.post(url, json=data, stream=True)
        
        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    print(json.loads(line))
            print("Installation completed successfully!")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    install_mistral() 