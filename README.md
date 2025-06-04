# RadarChart - Feedback Analyse & Visualisatie

Een lokaal draaiende applicatie speciaal ontwikkeld voor HR-professionals om privacy-gevoelige feedbackdata veilig te verwerken en visualiseren.

## 🎯 Hoofdfuncties

- **Excel Upload:** Upload feedback bestanden direct vanuit Excel
- **Radar Visualisatie:** Interactieve radar charts voor competentie-analyse  
- **Team Vergelijking:** Vergelijk individuele scores met teamgemiddelden
- **Export Functionaliteit:** Download charts als PNG of SVG afbeeldingen
- **Batch Export:** Exporteer alle personen in één ZIP-bestand voor efficiënte rapportage
- **Privacy First:** Alle data blijft lokaal op uw computer

## 🚀 Nieuwe Batch Export Functionaliteit

### Voor HR-professionals:
- **Tijdsbesparing:** In plaats van 20+ keer handmatig exporteren voor een team, één klik voor alles
- **Consistentie:** Alle exports hebben dezelfde datum/tijd en formatting
- **Volledigheid:** Geen risico dat iemand wordt overgeslagen
- **Professionaliteit:** Gestandaardiseerde naamgeving voor archivering en documentatie

### Bestandsnaamconventie:
```
[YYYY-MM-DD]_[persoon_naam].png
Bijvoorbeeld: 2024-06-04_jan_de_vries.png
```

### Features:
- Real-time voortgangsbalk tijdens batch export
- Teller: "X van Y voltooid"
- Individuele foutrapportage
- Eindstatus met samenvatting
- Alle afbeeldingen worden geleverd in één ZIP-bestand
- Dezelfde professionele opmaak als enkele exports

## 🛠️ Installatie & Gebruik

1. **Vereisten:**
   - Python 3.8+
   - pip (Python package manager)

2. **Installatie:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start de applicatie:**
   ```bash
   python app.py
   ```

4. **Open in browser:**
   ```
   http://localhost:5010
   ```

## 📊 Gebruik

1. **Upload Excel bestand** met feedback data
2. **Selecteer persoon** voor individuele analyse
3. **Bekijk interactieve radar chart** met team vergelijking
4. **Exporteer individueel** als PNG/SVG
5. **Of gebruik batch export** voor alle personen tegelijk (ZIP download)

## 🔒 Privacy & Beveiliging

- Alle data blijft lokaal op uw computer
- Geen externe verbindingen voor data verwerking
- Bestanden worden niet opgeslagen op de server
- Veilig voor gevoelige HR-data

## 📁 Project Structuur

```
RadarChart/
├── app.py                 # Flask backend server
├── templates/
│   └── index.html         # Frontend HTML
├── static/
│   ├── css/
│   │   └── style.css      # Styling
│   └── js/
│       ├── main.js        # Hoofdfunctionaliteit
│       ├── radarChart.js  # D3.js radar chart
│       ├── exportChart.js # Export functionaliteit
│       └── batchExport.js # Batch export functionaliteit
└── requirements.txt       # Python dependencies
```

## 🔧 API Endpoints

- `GET /` - Homepage
- `POST /upload` - Upload Excel bestand
- `GET /get_scores/<person_name>` - Haal scores op voor persoon
- `GET /get_all_persons_data` - Haal data voor alle personen op (batch export)
- `GET /status` - Server status

## 🎨 Technische Details

- **Backend:** Flask (Python)
- **Frontend:** Vanilla JavaScript + D3.js
- **Visualisatie:** D3.js radar charts
- **Export:** Canvas API voor PNG, SVG voor vector
- **Styling:** CSS3 met responsive design
- **Data:** Excel/CSV verwerking met pandas

## 📈 Roadmap

- [ ] PDF export met meerdere charts
- [ ] Team overzicht dashboard
- [ ] Historische trend analyse
- [ ] Custom competentie frameworks
- [ ] Bulk data import verbeteringen

## 🤝 Bijdragen

Dit is een intern HR-tool project. Voor vragen of verbeteringen, neem contact op met het ontwikkelteam.

## 📄 Licentie

Intern gebruik - Alle rechten voorbehouden.