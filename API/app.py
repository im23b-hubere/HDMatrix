from flask import Flask, jsonify
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)
def get_db_connection():
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='hello1234',
        database='TalentBridgeDB'
    )
    return connection

@app.route('/', methods=['GET'])
def home():
    return "Welcome to the TalentBridge API"


@app.route('/employees', methods=['GET'])
def get_employees():
    connection = get_db_connection()
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM mitarbeiter")
    employees = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(employees)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)