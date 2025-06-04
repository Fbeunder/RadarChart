# Feedback Analyse & Visualisatie Applicatie

Deze applicatie laat gebruikers een Excel-bestand uploaden met feedbackresultaten en toont de gemiddelden per competentie in een interactieve radar chart.

## Installatie
1. Maak een virtual environment aan en activeer deze.
2. Installeer de vereisten:
   ```bash
   pip install -r requirements.txt
   ```
3. Start de applicatie:
   ```bash
   python app.py
   ```
4. Open een browser op `http://127.0.0.1:5000`.

## Gebruik
1. Upload het Excel-bestand met de feedback.
2. Kies een collega uit de dropdown.
3. De radar chart toont de scores van de geselecteerde collega tegenover het algemene gemiddelde.

## Opmerking
Pas `COLUMN_TO_COMPETENCY` in `data_processor.py` aan naar de exacte kolomnamen van het Excel-bestand.
