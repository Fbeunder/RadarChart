# Feedback Analyse & Visualisatie Applicatie

## Introductie

Deze applicatie is ontwikkeld voor het analyseren en visualiseren van 360-graden feedbackresultaten. De tool verwerkt Excel-bestanden met feedbackdata, berekent gemiddelde scores per competentiegebied voor individuele medewerkers, en visualiseert deze in een interactieve radar chart waarbij individuele scores worden vergeleken met teamgemiddelden.

De applicatie is specifiek ontworpen voor privacy-gevoelige data en draait daarom volledig lokaal op uw eigen computer.

## Features

- **Excel Upload**: Upload 360-graden feedback Excel bestanden
- **Automatische Dataverwerking**: Intelligente mapping van tekstuele antwoorden naar numerieke scores
- **Competentie Analyse**: Analyse van 8 hoofdcompetentiegebieden
- **Interactieve Radar Chart**: Visuele vergelijking tussen individuele scores en teamgemiddelden
- **Privacy-First**: Alle data blijft lokaal op uw computer
- **Gebruiksvriendelijk**: Eenvoudige web interface voor niet-technische gebruikers

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
   venv\Scripts\activate
   
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

### Excel Bestand Uploaden

1. **Bestand Voorbereiden**
   - Zorg ervoor dat uw Excel bestand de juiste structuur heeft
   - Kolommen moeten de competentievragen bevatten
   - Rijen bevatten de antwoorden per respondent

2. **Upload Proces**
   - Klik op "Choose File" en selecteer uw Excel bestand
   - Klik op "Upload" om het bestand te verwerken
   - Wacht tot de verwerking is voltooid

3. **Resultaten Bekijken**
   - Selecteer een persoon uit de dropdown lijst
   - De radar chart wordt automatisch gegenereerd
   - Vergelijk individuele scores (blauw) met teamgemiddelden (rood)

### Interpretatie van Resultaten

- **Blauwe lijn**: Individuele scores van de geselecteerde persoon
- **Rode lijn**: Gemiddelde scores van het hele team
- **Schaal**: 1-4 (1 = laagste score, 4 = hoogste score)
- **Gebieden boven teamgemiddelde**: Sterktes van de persoon
- **Gebieden onder teamgemiddelde**: Mogelijke ontwikkelpunten

## Technische Details

### Gebruikte Technologieën

- **Backend**: Python 3.8+, Flask 3.0.0
- **Data Processing**: pandas 2.1.4, openpyxl 3.1.2
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualisatie**: D3.js voor radar chart rendering
- **Security**: Werkzeug 3.0.1 voor veilige file uploads

### Architectuur

```
RadarChart/
├── app.py                 # Flask hoofdapplicatie
├── data_processor.py      # Excel verwerking en data analyse
├── requirements.txt       # Python dependencies
├── README.md             # Deze documentatie
├── templates/            # HTML templates
│   └── index.html        # Hoofdpagina interface
├── static/               # Statische bestanden
│   ├── css/
│   │   └── style.css     # Applicatie styling
│   └── js/
│       ├── script.js     # Frontend logica
│       └── radarChart.js # D3.js radar chart
└── uploads/              # Tijdelijke upload directory
```

### Data Verwerking

De applicatie verwerkt Excel bestanden door:

1. **Tekstuele antwoorden** te mappen naar numerieke scores:
   - "Helemaal mee eens" → 4
   - "Mee eens" → 3
   - "Mee oneens" → 2
   - "Helemaal mee oneens" → 1
   - "Weet ik niet" → Genegeerd in berekeningen

2. **Competentie mapping** van individuele vragen naar 8 hoofdgebieden

3. **Gemiddelde berekening** per competentiegebied per persoon

4. **Team gemiddelden** berekening voor vergelijkingsdoeleinden

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

## Licentie

Dit project is ontwikkeld voor interne gebruik. Neem contact op met de eigenaar voor gebruiksrechten.

## Support

Voor vragen of ondersteuning, maak een issue aan in de GitHub repository of neem contact op met het ontwikkelteam.

---

**Versie**: 1.0.0  
**Laatste update**: December 2024