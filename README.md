# Feedback Analyse & Visualisatie Applicatie

## Introductie

Deze applicatie is ontwikkeld voor het analyseren en visualiseren van 360-graden feedbackresultaten. De tool verwerkt Excel-bestanden met feedbackdata, berekent gemiddelde scores per competentiegebied voor individuele medewerkers, en visualiseert deze in een interactieve radar chart waarbij individuele scores worden vergeleken met teamgemiddelden.

De applicatie is specifiek ontworpen voor privacy-gevoelige data en draait daarom volledig lokaal op uw eigen computer.

## Features

- **Excel Upload**: Upload 360-graden feedback Excel bestanden (.xlsx, .xls)
- **Automatische Dataverwerking**: Intelligente mapping van tekstuele antwoorden naar numerieke scores
- **Competentie Analyse**: Analyse van 8 hoofdcompetentiegebieden
- **Interactieve Radar Chart**: Visuele vergelijking tussen individuele scores en teamgemiddelden
- **Privacy-First**: Alle data blijft lokaal op uw computer
- **Gebruiksvriendelijk**: Eenvoudige web interface voor niet-technische gebruikers
- **Responsive Design**: Werkt op desktop, tablet en mobiele apparaten

### Ondersteunde Competentiegebieden

1. **PROBLEEMANALYSE** - Analytisch denkvermogen en probleemoplossing
2. **KWALITEITSZORG** - Aandacht voor detail en kwaliteitsstandaarden
3. **KLANTGERICHTHEID** - Klantfocus en servicegerichtheid
4. **PROJECTMANAGEMENT** - Planning en organisatie van werkzaamheden
5. **TEAMSPELER** - Samenwerking en teamdynamiek
6. **COLLEGIALE ONTWIKKELING** - Ondersteuning van collega's en kennisdeling
7. **LEIDERSCHAP EN INTEGRITEIT** - Leiderschapskwaliteiten en ethisch handelen
8. **INNOVATIE EN COMMERCIE** - Vernieuwing en commercieel inzicht

## Installatie

### Vereisten

- Python 3.8 of hoger
- pip (Python package manager)
- Moderne webbrowser (Chrome, Firefox, Safari, Edge)

### Stap-voor-stap Setup

1. **Clone de repository**
   ```bash
   git clone https://github.com/Fbeunder/RadarChart.git
   cd RadarChart
   ```

2. **Maak een virtuele omgeving aan (aanbevolen)**
   ```bash
   python -m venv venv
   
   # Windows
   venv\\Scripts\\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Installeer dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start de applicatie**
   ```bash
   python app.py
   ```

5. **Open de applicatie**
   - Ga naar `http://localhost:5010` in uw webbrowser
   - De applicatie is nu klaar voor gebruik

## Gebruik

### Excel Bestand Voorbereiden

Uw Excel bestand moet de volgende structuur hebben:

**Vereiste Kolommen:**
- `Timestamp` - Tijdstempel van de feedback
- `Wie ben jij?` - Naam van de beoordelaar
- `Voor welke collega vul je dit formulier in?` - Naam van de beoordeelde persoon

**Competentie Kolommen:**
Kolommen met competentievragen, bijvoorbeeld:
- `🔹 **PROBLEEMANALYSE** [Begrijpt de kern van problemen]`
- `🔹 **KWALITEITSZORG** [Levert hoge kwaliteit werk]`

**Ondersteunde Antwoorden:**
- "Zeer vaak" (score: 5)
- "Vaak" (score: 4)
- "Soms" (score: 3)
- "Zelden" (score: 2)
- "Nooit" (score: 1)
- "Weet ik niet" (wordt genegeerd in berekeningen)

### Upload Proces

1. **Bestand Uploaden**
   - Sleep uw Excel bestand naar het upload gebied, of
   - Klik op "Choose File" en selecteer uw Excel bestand
   - Ondersteunde formaten: .xlsx, .xls (max 16MB)

2. **Automatische Verwerking**
   - De applicatie verwerkt automatisch uw data
   - Tekstuele antwoorden worden omgezet naar numerieke scores
   - Competenties worden gegroepeerd en gemiddelden berekend

3. **Persoon Selecteren**
   - Na succesvolle upload verschijnt een dropdown met alle personen
   - Selecteer de persoon waarvan u de feedback wilt bekijken
   - Klik op "Analyseer Feedback"

4. **Resultaten Bekijken**
   - De interactieve radar chart wordt automatisch gegenereerd
   - Vergelijk individuele scores (blauw) met teamgemiddelden (groen)

### Interpretatie van Resultaten

- **Blauwe lijn**: Individuele scores van de geselecteerde persoon
- **Groene lijn**: Gemiddelde scores van het hele team
- **Schaal**: 1-5 (1 = laagste score, 5 = hoogste score)
- **Gebieden boven teamgemiddelde**: Sterktes van de persoon
- **Gebieden onder teamgemiddelde**: Mogelijke ontwikkelpunten

### Interactieve Functies

- **Hover over punten**: Toon exacte scores in tooltip
- **Klik op legenda**: Toon/verberg individuele datasets
- **Hover over areas**: Highlight specifieke competentiegebieden

## Technische Details

### Gebruikte Technologieën

- **Backend**: Python 3.8+, Flask 3.0.0
- **Data Processing**: pandas 2.1.4, openpyxl 3.1.2, numpy 1.24.3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualisatie**: D3.js v7 voor radar chart rendering
- **Security**: Werkzeug 3.0.1 voor veilige file uploads

### Architectuur

```
RadarChart/
├── app.py                 # Flask hoofdapplicatie
├── data_processor.py      # Excel verwerking en data analyse
├── requirements.txt       # Python dependencies
├── README.md             # Deze documentatie
├── project_info.txt      # Project informatie en status
├── project_stappen.txt   # Ontwikkelstappen en roadmap
├── templates/            # HTML templates
│   └── index.html        # Hoofdpagina interface
├── static/               # Statische bestanden
│   ├── css/
│   │   └── style.css     # Applicatie styling
│   └── js/
│       ├── main.js       # Frontend logica
│       └── radarChart.js # D3.js radar chart component
└── uploads/              # Tijdelijke upload directory
```

### Data Verwerking

De applicatie verwerkt Excel bestanden door:

1. **Automatische Structuur Detectie**
   - Identificeert competentie kolommen aan de hand van ** markers
   - Detecteert basis kolommen (persoon, beoordelaar, timestamp)

2. **Tekstuele Score Mapping**
   - "Zeer vaak" → 5
   - "Vaak" → 4
   - "Soms" → 3
   - "Zelden" → 2
   - "Nooit" → 1
   - "Weet ik niet" → Genegeerd in berekeningen

3. **Competentie Categorisatie**
   - Automatische groepering van sub-competenties
   - KLANTGERICHTHEID sub-competenties worden gecombineerd
   - Mapping van individuele vragen naar 8 hoofdgebieden

4. **Score Berekening**
   - Gemiddelde berekening per competentiegebied per persoon
   - Team gemiddelden voor vergelijkingsdoeleinden
   - Statistische gegevens (standaarddeviatie, aantal responses)

### API Endpoints

- `GET /` - Hoofdpagina
- `POST /upload` - Upload en verwerk Excel bestand
- `GET /get_scores/<person_name>` - Haal scores op voor specifieke persoon
- `GET /get_person_details/<person_name>` - Gedetailleerde persoon informatie
- `POST /validate` - Valideer Excel bestand zonder verwerking
- `GET /status` - Applicatie status en statistieken

## Troubleshooting

### Veelvoorkomende Problemen

**Upload Fout: "Geen competentie kolommen gevonden"**
- Controleer of uw Excel kolommen ** markers bevatten
- Zorg ervoor dat competentievragen duidelijk gemarkeerd zijn

**Fout: "Persoon niet gevonden"**
- Controleer of de kolom "Voor welke collega vul je dit formulier in?" correct is ingevuld
- Zorg voor consistente naamgeving (geen extra spaties)

**Radar Chart laadt niet**
- Controleer uw internetverbinding (D3.js wordt van CDN geladen)
- Probeer de pagina te verversen
- Controleer browser console voor JavaScript fouten

**Bestand te groot**
- Maximum bestandsgrootte is 16MB
- Probeer uw Excel bestand te optimaliseren of op te splitsen

### Browser Compatibiliteit

- **Chrome**: Volledig ondersteund
- **Firefox**: Volledig ondersteund  
- **Safari**: Volledig ondersteund
- **Edge**: Volledig ondersteund
- **Internet Explorer**: Niet ondersteund

## Bijdragen

### Development Setup

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/nieuwe-functie`)
3. Commit uw wijzigingen (`git commit -am 'Voeg nieuwe functie toe'`)
4. Push naar de branch (`git push origin feature/nieuwe-functie`)
5. Maak een Pull Request

### Code Standaarden

- Gebruik Python PEP 8 style guide
- Voeg docstrings toe aan alle functies
- Schrijf unit tests voor nieuwe functionaliteit
- Update documentatie bij wijzigingen

### Bug Reports

Rapporteer bugs via GitHub Issues met:
- Beschrijving van het probleem
- Stappen om het probleem te reproduceren
- Verwacht vs. werkelijk gedrag
- Screenshots indien relevant
- Browser en versie informatie

## Licentie

Dit project is ontwikkeld voor interne gebruik. Neem contact op met de eigenaar voor gebruiksrechten.

## Support

Voor vragen of ondersteuning, maak een issue aan in de GitHub repository of neem contact op met het ontwikkelteam.

---

**Versie**: 1.0.0  
**Laatste update**: December 2024  
**Status**: Volledig functioneel - alle must-have features geïmplementeerd