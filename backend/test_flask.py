from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

@app.route('/test', methods=['GET'])
def test_get():
    return jsonify({"success": True, "message": "GET funktioniert!"})

@app.route('/test', methods=['POST'])
def test_post():
    data = request.get_json()
    return jsonify({"success": True, "message": "POST funktioniert!", "received": data})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if data and data.get('email') == 'admin@example.com' and data.get('password') == 'admin123':
        return jsonify({
            "success": True,
            "token": "test_token_123",
            "user": {
                "id": 1,
                "email": "admin@example.com",
                "role": "admin",
                "tenant_id": 1
            }
        })
    return jsonify({"success": False, "message": "Falsche Anmeldedaten"})

if __name__ == '__main__':
    print("Starte einfachen Flask-Test-Server auf http://127.0.0.1:5000")
    app.run(debug=True) 