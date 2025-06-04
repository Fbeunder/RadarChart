from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import json

# Flask applicatie initialisatie
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# CORS headers voor lokaal gebruik
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# In-memory data opslag
processed_data = {
    "persons": {},  # Dictionary met persoon data
    "team_averages": {},  # Team gemiddelden per competentie
    "upload_timestamp": None
}

# Toegestane bestandsextensies
ALLOWED_EXTENSIONS = {'xlsx'}

def allowed_file(filename):
    """Controleer of bestand een toegestane extensie heeft"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Serveer de hoofdpagina"""
    try:
        return render_template('index.html')
    except:
        # Fallback als template nog niet bestaat
        return """
        <html>
            <head><title>RadarChart Feedback Analyse</title></head>
            <body>
                <h1>RadarChart Feedback Analyse Applicatie</h1>
                <p>Backend server is actief op poort 5010</p>
                <p>Upload functionaliteit: POST naar /upload</p>
                <p>Scores ophalen: GET /get_scores/&lt;person_name&gt;</p>
            </body>
        </html>
        """

@app.route('/upload', methods=['POST'])
def upload_file():
    """Ontvang en verwerk Excel bestand"""
    try:
        # Controleer of er een bestand in de request zit
        if 'file' not in request.files:
            return jsonify({
                'error': 'Geen bestand gevonden in request',
                'success': False
            }), 400
        
        file = request.files['file']
        
        # Controleer of er een bestand geselecteerd is
        if file.filename == '':
            return jsonify({
                'error': 'Geen bestand geselecteerd',
                'success': False
            }), 400
        
        # Valideer bestandstype
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Alleen .xlsx bestanden zijn toegestaan',
                'success': False
            }), 400
        
        # Beveilig bestandsnaam
        filename = secure_filename(file.filename)
        
        # Mock data processing - later vervangen door echte data_processor
        # Simuleer verwerkte data
        mock_persons_data = {
            "Jan Jansen": {
                "scores": {
                    "Communicatie": 8.5,
                    "Teamwork": 7.8,
                    "Leiderschap": 6.9,
                    "Probleemoplossing": 8.2,
                    "Creativiteit": 7.5,
                    "Analytisch denken": 8.0
                }
            },
            "Maria Pietersen": {
                "scores": {
                    "Communicatie": 9.1,
                    "Teamwork": 8.7,
                    "Leiderschap": 8.3,
                    "Probleemoplossing": 7.6,
                    "Creativiteit": 8.8,
                    "Analytisch denken": 7.9
                }
            },
            "Peter de Vries": {
                "scores": {
                    "Communicatie": 7.2,
                    "Teamwork": 8.1,
                    "Leiderschap": 7.5,
                    "Probleemoplossing": 8.9,
                    "Creativiteit": 6.8,
                    "Analytisch denken": 8.7
                }
            }
        }
        
        # Bereken team gemiddelden
        competenties = ["Communicatie", "Teamwork", "Leiderschap", "Probleemoplossing", "Creativiteit", "Analytisch denken"]
        team_averages = {}
        
        for competentie in competenties:
            scores = [person_data["scores"][competentie] for person_data in mock_persons_data.values()]
            team_averages[competentie] = round(sum(scores) / len(scores), 2)
        
        # Sla verwerkte data op in memory
        processed_data["persons"] = mock_persons_data
        processed_data["team_averages"] = team_averages
        processed_data["upload_timestamp"] = datetime.now().isoformat()
        
        # Retourneer lijst met beschikbare personen
        persons_list = list(mock_persons_data.keys())
        
        return jsonify({
            'success': True,
            'message': f'Bestand {filename} succesvol verwerkt',
            'persons': persons_list,
            'upload_timestamp': processed_data["upload_timestamp"]
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Fout bij verwerken bestand: {str(e)}',
            'success': False
        }), 500

@app.route('/get_scores/<person_name>')
def get_scores(person_name):
    """Retourneer scores voor specifieke persoon"""
    try:
        # Controleer of er data beschikbaar is
        if not processed_data["persons"]:
            return jsonify({
                'error': 'Geen data beschikbaar. Upload eerst een Excel bestand.',
                'success': False
            }), 404
        
        # Controleer of persoon bestaat
        if person_name not in processed_data["persons"]:
            available_persons = list(processed_data["persons"].keys())
            return jsonify({
                'error': f'Persoon "{person_name}" niet gevonden',
                'available_persons': available_persons,
                'success': False
            }), 404
        
        # Haal persoon data op
        person_data = processed_data["persons"][person_name]
        
        # Bereid data voor radar chart
        radar_data = {
            'person_name': person_name,
            'person_scores': person_data["scores"],
            'team_averages': processed_data["team_averages"],
            'competencies': list(person_data["scores"].keys()),
            'upload_timestamp': processed_data["upload_timestamp"],
            'success': True
        }
        
        return jsonify(radar_data)
        
    except Exception as e:
        return jsonify({
            'error': f'Fout bij ophalen scores: {str(e)}',
            'success': False
        }), 500

@app.route('/status')
def status():
    """Geef status informatie van de applicatie"""
    return jsonify({
        'status': 'active',
        'data_available': bool(processed_data["persons"]),
        'persons_count': len(processed_data["persons"]),
        'upload_timestamp': processed_data["upload_timestamp"],
        'available_persons': list(processed_data["persons"].keys()) if processed_data["persons"] else []
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'error': 'Bestand te groot. Maximum grootte is 16MB.',
        'success': False
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint niet gevonden',
        'success': False
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    return jsonify({
        'error': 'Interne server fout',
        'success': False
    }), 500

if __name__ == '__main__':
    print("🚀 RadarChart Backend Server wordt gestart...")
    print("📊 Feedback Analyse & Visualisatie Applicatie")
    print("🌐 Server draait op: http://localhost:5010")
    print("📁 Upload endpoint: POST /upload")
    print("📈 Scores endpoint: GET /get_scores/<person_name>")
    print("ℹ️  Status endpoint: GET /status")
    print("-" * 50)
    
    app.run(host='0.0.0.0', port=5010, debug=True)