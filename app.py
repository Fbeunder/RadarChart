from flask import Flask, render_template, request, jsonify
from io import BytesIO
from data_processor import read_excel, preprocess, calculate_individual_scores, calculate_overall_average

app = Flask(__name__)

# In-memory storage for processed data
DATA = {
    "individual_scores": {},
    "overall_scores": {},
    "persons": []
}

PERSON_COLUMN = "Voor welke collega vul je dit formulier in?"

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    try:
        df = read_excel(BytesIO(file.read()))
        df = preprocess(df)

        individual = calculate_individual_scores(df, PERSON_COLUMN)
        overall = calculate_overall_average(individual)

        DATA['individual_scores'] = individual
        DATA['overall_scores'] = overall
        DATA['persons'] = list(individual.keys())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'persons': DATA['persons']})


@app.route('/get_scores/<person_name>', methods=['GET'])
def get_scores(person_name):
    if person_name not in DATA['individual_scores']:
        return jsonify({'error': 'Person not found'}), 404

    person_scores = DATA['individual_scores'][person_name]
    response = {
        'personName': person_name,
        'competencies': [
            {
                'axis': comp,
                'individualScore': person_scores.get(comp),
                'overallScore': DATA['overall_scores'].get(comp)
            }
            for comp in DATA['overall_scores'].keys()
        ]
    }
    return jsonify(response)


if __name__ == '__main__':
    app.run(debug=True)
