from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Datenbankkonfiguration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:hello1234@db/TalentBridgeDB'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))

@app.route('/')
def home():
    return "Hallo, das ist meine Flask-API!"

@app.route('/employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    return jsonify([{"id": emp.id, "name": emp.name} for emp in employees])

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)