from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
import os
import tempfile
from datetime import datetime
import json
from data_processor import ExcelProcessor, DataProcessingError

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
    "upload_timestamp": None,
    "processing_summary": {},  # Samenvatting van verwerking
    "available_persons": []  # Lijst van beschikbare personen
}

# Toegestane bestandsextensies
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

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
                <h2>Ondersteunde Excel Formaten:</h2>
                <ul>
                    <li>.xlsx (Excel 2007+)</li>
                    <li>.xls (Excel 97-2003)</li>
                </ul>
                <h2>Verwachte Excel Structuur:</h2>
                <ul>
                    <li><strong>Persoon</strong>: Naam van beoordeelde persoon</li>
                    <li><strong>Beoordelaar</strong>: Naam van beoordelaar</li>
                    <li><strong>Competentie</strong>: Naam van competentie</li>
                    <li><strong>Score</strong>: Score (1-5 schaal)</li>
                    <li><strong>Type</strong>: Type feedback (self, peer, manager)</li>
                </ul>
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
                'error': 'Alleen .xlsx en .xls bestanden zijn toegestaan',
                'success': False,
                'supported_formats': ['.xlsx', '.xls']
            }), 400
        
        # Beveilig bestandsnaam
        filename = secure_filename(file.filename)
        
        # Sla bestand tijdelijk op voor verwerking
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{filename.split(".")[-1]}') as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Gebruik ExcelProcessor voor verwerking
            processor = ExcelProcessor()
            result = processor.process_excel_file(temp_file_path)
            
            # Verwijder tijdelijk bestand
            os.unlink(temp_file_path)
            
            if not result['success']:
                return jsonify({
                    'error': f'Fout bij verwerken Excel bestand: {result["error"]}',
                    'success': False,
                    'validation_errors': result.get('validation_errors', [])
                }), 400
            
            # Sla verwerkte data op in memory
            processed_data["persons"] = {}
            for person_name, person_data in result['persons'].items():
                processed_data["persons"][person_name] = {
                    "scores": person_data['scores'],
                    "details": person_data['details'],
                    "total_responses": person_data['total_responses']
                }
            
            processed_data["team_averages"] = result['team_averages']
            processed_data["upload_timestamp"] = datetime.now().isoformat()
            processed_data["processing_summary"] = result['processing_summary']
            processed_data["available_persons"] = result['available_persons']
            
            # Retourneer succesvol resultaat
            return jsonify({
                'success': True,
                'message': f'Bestand {filename} succesvol verwerkt',
                'persons': result['available_persons'],
                'competencies': result['competencies'],
                'upload_timestamp': processed_data["upload_timestamp"],
                'processing_summary': {
                    'total_rows_processed': result['processing_summary']['total_rows_processed'],
                    'persons_found': result['processing_summary']['persons_found'],
                    'competencies_found': result['processing_summary']['competencies_found'],
                    'total_responses': result['total_responses']
                }
            })
            
        except DataProcessingError as e:
            # Verwijder tijdelijk bestand bij fout
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
            return jsonify({
                'error': f'Data processing fout: {str(e)}',
                'success': False
            }), 400
            
        except Exception as e:
            # Verwijder tijdelijk bestand bij onverwachte fout
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
            return jsonify({
                'error': f'Onverwachte fout bij verwerken: {str(e)}',
                'success': False
            }), 500
        
    except Exception as e:
        return jsonify({
            'error': f'Fout bij uploaden bestand: {str(e)}',
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
            available_persons = processed_data["available_persons"]
            return jsonify({
                'error': f'Persoon "{person_name}" niet gevonden',
                'available_persons': available_persons,
                'success': False
            }), 404
        
        # Haal persoon data op
        person_data = processed_data["persons"][person_name]
        
        # Bereid data voor radar chart - FIX: Gebruik juiste data structuur
        radar_data = {
            'person_name': person_name,
            'scores': {
                'individual_scores': person_data["scores"],  # Frontend verwacht individual_scores
                'team_averages': processed_data["team_averages"]
            },
            'person_details': person_data["details"],
            'competencies': list(person_data["scores"].keys()),
            'upload_timestamp': processed_data["upload_timestamp"],
            'total_responses': person_data["total_responses"],
            'success': True
        }
        
        return jsonify(radar_data)
        
    except Exception as e:
        return jsonify({
            'error': f'Fout bij ophalen scores: {str(e)}',
            'success': False
        }), 500

@app.route('/get_person_details/<person_name>')
def get_person_details(person_name):
    """Retourneer gedetailleerde informatie voor specifieke persoon"""
    try:
        # Controleer of er data beschikbaar is
        if not processed_data["persons"]:
            return jsonify({
                'error': 'Geen data beschikbaar. Upload eerst een Excel bestand.',
                'success': False
            }), 404
        
        # Controleer of persoon bestaat
        if person_name not in processed_data["persons"]:
            return jsonify({
                'error': f'Persoon "{person_name}" niet gevonden',
                'available_persons': processed_data["available_persons"],
                'success': False
            }), 404
        
        # Haal gedetailleerde persoon data op
        person_data = processed_data["persons"][person_name]
        
        detailed_data = {
            'person_name': person_name,
            'scores': person_data["scores"],
            'details': person_data["details"],
            'total_responses': person_data["total_responses"],
            'team_averages': processed_data["team_averages"],
            'success': True
        }
        
        return jsonify(detailed_data)
        
    except Exception as e:
        return jsonify({
            'error': f'Fout bij ophalen persoon details: {str(e)}',
            'success': False
        }), 500

@app.route('/get_all_persons_data')
def get_all_persons_data():
    """Retourneer data voor alle personen voor batch export"""
    try:
        if not processed_data["persons"]:
            return jsonify({
                'error': 'Geen data beschikbaar',
                'success': False
            }), 404
        
        all_persons_data = []
        for person_name in processed_data["available_persons"]:
            person_data = processed_data["persons"][person_name]
            all_persons_data.append({
                'person_name': person_name,
                'scores': {
                    'individual_scores': person_data["scores"],
                    'team_averages': processed_data["team_averages"]
                }
            })
        
        return jsonify({
            'success': True,
            'persons_data': all_persons_data,
            'total_persons': len(all_persons_data)
        })
    except Exception as e:
        return jsonify({
            'error': f'Fout bij ophalen data: {str(e)}',
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
        'available_persons': processed_data["available_persons"],
        'competencies_count': len(processed_data["team_averages"]),
        'processing_summary': processed_data.get("processing_summary", {})
    })

@app.route('/validate', methods=['POST'])
def validate_file():
    """Valideer Excel bestand zonder het volledig te verwerken"""
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
                'error': 'Alleen .xlsx en .xls bestanden zijn toegestaan',
                'success': False
            }), 400
        
        # Beveilig bestandsnaam
        filename = secure_filename(file.filename)
        
        # Sla bestand tijdelijk op voor validatie
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{filename.split(".")[-1]}') as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Gebruik ExcelProcessor voor validatie
            from data_processor import validate_excel_file
            is_valid, errors = validate_excel_file(temp_file_path)
            
            # Verwijder tijdelijk bestand
            os.unlink(temp_file_path)
            
            return jsonify({
                'success': True,
                'valid': is_valid,
                'filename': filename,
                'validation_errors': errors,
                'message': 'Bestand is geldig en kan worden verwerkt' if is_valid else 'Bestand bevat validatie fouten'
            })
            
        except Exception as e:
            # Verwijder tijdelijk bestand bij fout
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
            return jsonify({
                'error': f'Fout bij valideren bestand: {str(e)}',
                'success': False
            }), 500
        
    except Exception as e:
        return jsonify({
            'error': f'Fout bij validatie: {str(e)}',
            'success': False
        }), 500

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
    print("🔍 Details endpoint: GET /get_person_details/<person_name>")
    print("📦 Batch export endpoint: GET /get_all_persons_data")
    print("✅ Validatie endpoint: POST /validate")
    print("ℹ️  Status endpoint: GET /status")
    print("📋 Ondersteunde formaten: .xlsx, .xls")
    print("-" * 50)
    
    app.run(host='0.0.0.0', port=5010, debug=True)