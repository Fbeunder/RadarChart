"""
Test script om de voorbeelddata uit issue #8 te controleren
"""

import pandas as pd
import io
from data_processor import ExcelProcessor

# Voorbeelddata uit issue #8
sample_data = """Timestamp;Wie ben jij?;Wat is je mailadres;Voor welke collega vul je dit formulier in?;Op welk project baseer je je feedback?;🔹 **PROBLEEMANALYSE - Laat deze collega zien een goede probleemanalyse uit te kunnen voeren?** [Begrijpt de kern van het probleem door de juiste vragen te stellen aan de klant];🔹 **PROBLEEMANALYSE - Laat deze collega zien een goede probleemanalyse uit te kunnen voeren?** [Biedt effectieve en haalbare oplossingen voor klantproblemen];🔹 **PROBLEEMANALYSE - Laat deze collega zien een goede probleemanalyse uit te kunnen voeren?** [Herkent de onderliggende oorzaken van problemen];🔹 **KWALITEITSZORG - Draagt deze collega zorg voor hoogwaardige kwaliteit in het werk?** [Levert analyses en code van hoge kwaliteit];🔹 **KWALITEITSZORG - Draagt deze collega zorg voor hoogwaardige kwaliteit in het werk?** [Toont vindingrijkheid bij probleemoplossing];🔹 **KWALITEITSZORG - Draagt deze collega zorg voor hoogwaardige kwaliteit in het werk?** [Toetst analyses aan de werkelijkheid, controleert of deze wel reëel zijn en valideert resultaten];🔹 **KLANTGERICHTHEID met boodschap overbrengen - Communiceert deze collega effectief en duidelijk?** [Communiceert resultaten, inzichten of analyses op een begrijpelijke manier];🔹 **KLANTGERICHTHEID met boodschap overbrengen - Communiceert deze collega effectief en duidelijk?** [Zet analyse-uitkomsten of ontwikkelvoorstellen om in praktische en begrijpbare adviezen];🔹 **KLANTGERICHTHEID met boodschap overbrengen - Communiceert deze collega effectief en duidelijk?** [Past zijn/haar communicatiestijl aan om effectief aan te sluiten bij de tegenpartij];🔹 **KLANTGERICHTHEID met behoefte ophalen - Is deze collega klantgericht in zijn/haar benadering?** [Begrijpt de behoeften van de klant en betrekt de klant actief bij het proces];🔹 **KLANTGERICHTHEID met behoefte ophalen - Is deze collega klantgericht in zijn/haar benadering?** [Luistert actief naar de klant en weet in het gesprek de (verschillende) standpunten te identificeren en te benoemen];🔹 **KLANTGERICHTHEID met behoefte ophalen - Is deze collega klantgericht in zijn/haar benadering?** [Reageert adequaat op veranderingen in klantbehoeften];🔹 **PROJECTMANAGEMENT - Beheert deze collega projecten efficiënt en succesvol?** [Heeft de doelen scherp en bewaakt de scope van het project];🔹 **PROJECTMANAGEMENT - Beheert deze collega projecten efficiënt en succesvol?** [Structureert en verdeelt het werk effectief gedurende het project];🔹 **PROJECTMANAGEMENT - Beheert deze collega projecten efficiënt en succesvol?** [Handhaaft een acceptabel werktempo en respecteert persoonlijke verplichtingen van teamleden];🔹 **TEAMSPELER - Toont deze collega goed teamwork en samenwerking?** [Toont inzet om teamleden te betrekken en te ondersteunen];🔹 **TEAMSPELER - Toont deze collega goed teamwork en samenwerking?** [Staat open voor uitdagingen en nieuwe ideeën];🔹 **TEAMSPELER - Toont deze collega goed teamwork en samenwerking?** [Genereert enthousiasme en motiveert het team];🔹 **COLLEGIALE ONTWIKKELING - Bevordert deze collega de ontwikkeling van zijn/haar collega's?** [Is beschikbaar en benaderbaar voor collega's];🔹 **COLLEGIALE ONTWIKKELING - Bevordert deze collega de ontwikkeling van zijn/haar collega's?** [Draagt actief kennis en ervaring over aan collega's];🔹 **COLLEGIALE ONTWIKKELING - Bevordert deze collega de ontwikkeling van zijn/haar collega's?** [Begeleidt teamleden succesvol en stimuleert hun professionele groei];🔹 **LEIDERSCHAP EN INTEGRITEIT - Laat deze collega leiderschap en integriteit zien in zijn/haar werk?** [Behandelt iedereen met respect, ongeacht achtergrond of positie];🔹 **LEIDERSCHAP EN INTEGRITEIT - Laat deze collega leiderschap en integriteit zien in zijn/haar werk?** [Draagt bij aan een positieve en ondersteunende werkomgeving];🔹 **LEIDERSCHAP EN INTEGRITEIT - Laat deze collega leiderschap en integriteit zien in zijn/haar werk?** [Toont doorzettingsvermogen bij obstakels en uitdagingen];🔹 **INNOVATIE EN COMMERCIE - Draagt deze collega bij aan vernieuwing en commercieel succes?** [Denkt proactief mee over nieuwe kansen en mogelijkheden in de markt];🔹 **INNOVATIE EN COMMERCIE - Draagt deze collega bij aan vernieuwing en commercieel succes?** [Vertaalt klantbehoeften effectief naar innovatieve oplossingen of diensten];🔹 **INNOVATIE EN COMMERCIE - Draagt deze collega bij aan vernieuwing en commercieel succes?** [Initieert en stimuleert vernieuwende ideeën binnen het team]
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
19-2-2025 14:01;Stan ;stan@laks.nl;Tom;NL - HaskoningDHV Nederland BV - ROBAA - PowerAll 2025;Zeer vaak;Zeer vaak;Zeer vaak;Vaak;Vaak;Vaak;Vaak;Vaak;Zeer vaak;Soms;Zeer vaak;Vaak;Vaak;Vaak;Zeer vaak;Zeer vaak;Zeer vaak;Vaak;Zeer vaak;Vaak;Vaak;Zeer vaak;Zeer vaak;Zeer vaak;Soms;Vaak;Vaak
19-2-2025 14:13;Stan ;stan@laks.nl;Anne de ;NL - HaskoningDHV Nederland BV - ROBAA - PowerAll 2025;Soms;Vaak;Vaak;Vaak;Vaak;Vaak;Vaak;Soms;Soms;Soms;Soms;Soms;Vaak;Vaak;Zeer vaak;Zeer vaak;Vaak;Vaak;Zeer vaak;Vaak;Soms;Zeer vaak;Vaak;Vaak;Zelden;Soms;Soms
19-2-2025 14:21;Tom ;tom@laks.nl;Koen ;NL - HaskoningDHV Nederland BV - ROBAA - PowerAll 2025;Zeer vaak;Zeer vaak;Zeer vaak;Zeer vaak;Vaak;Zeer vaak;Vaak;Vaak;Vaak;Zeer vaak;Vaak;Zeer vaak;Zeer vaak;Vaak;Zeer vaak;Zeer vaak;Vaak;Vaak;Vaak;Vaak;Vaak;Zeer vaak;Vaak;Zeer vaak;Zeer vaak;Zeer vaak;Soms
19-2-2025 14:23;Tom ;tom@laks.nl;Anne ;NL - HaskoningDHV Nederland BV - ROBAA - PowerAll 2025;Soms;Vaak;Soms;Zeer vaak;Zeer vaak;Zeer vaak;Vaak;Soms;Soms;Soms;Vaak;Weet ik niet;Weet ik niet;Soms;Zeer vaak;Zeer vaak;Zeer vaak;Zeer vaak;Zeer vaak;Zeer vaak;Zelden;Zeer vaak;Zeer vaak;Vaak;Soms;Vaak;Vaak"""

def analyze_data_structure():
    """Analyseer de structuur van de voorbeelddata"""
    print("=== ANALYSE VAN VOORBEELDDATA ===\n")
    
    # Lees de data
    df = pd.read_csv(io.StringIO(sample_data), sep=';')
    
    print(f"Aantal rijen: {len(df)}")
    print(f"Aantal kolommen: {len(df.columns)}")
    print("\n=== KOLOMMEN ===")
    
    # Toon eerste paar kolommen
    for i, col in enumerate(df.columns[:10]):
        print(f"{i+1}. {col}")
    print("... en nog meer competentie kolommen\n")
    
    # Analyseer competentie kolommen
    competency_columns = [col for col in df.columns if '**' in col]
    print(f"\nAantal competentie kolommen: {len(competency_columns)}")
    
    # Extract competentie categorieën
    categories = set()
    for col in competency_columns:
        if '**' in col:
            # Extract categorie tussen ** **
            start = col.find('**') + 2
            end = col.find('**', start)
            if end > start:
                category = col[start:end].split(' - ')[0]
                categories.add(category)
    
    print("\n=== COMPETENTIE CATEGORIEËN ===")
    for cat in sorted(categories):
        print(f"- {cat}")
    
    # Analyseer antwoord types
    print("\n=== ANTWOORD TYPES ===")
    answer_types = set()
    for col in competency_columns:
        for val in df[col].dropna().unique():
            answer_types.add(val)
    
    for answer in sorted(answer_types):
        print(f"- {answer}")
    
    # Analyseer personen
    print("\n=== PERSONEN ===")
    personen = df['Voor welke collega vul je dit formulier in?'].unique()
    for persoon in personen:
        print(f"- {persoon}")
    
    print("\n=== BEOORDELAARS ===")
    beoordelaars = df['Wie ben jij?'].unique()
    for beoordelaar in beoordelaars:
        print(f"- {beoordelaar}")
    
    return df

def test_current_processor():
    """Test de huidige processor met de voorbeelddata"""
    print("\n\n=== TEST MET HUIDIGE PROCESSOR ===\n")
    
    processor = ExcelProcessor()
    
    # Lees de data
    df = pd.read_csv(io.StringIO(sample_data), sep=';')
    
    # Probeer te mappen
    try:
        mapped_df = processor.map_feedback_structure(df)
        print("✓ Mapping gelukt")
        print(f"Gemapte kolommen: {list(mapped_df.columns)[:5]}...")
    except Exception as e:
        print(f"✗ Mapping gefaald: {e}")
    
    # Probeer te valideren
    try:
        is_valid, errors = processor.validate_excel_structure(df)
        if is_valid:
            print("✓ Validatie geslaagd")
        else:
            print("✗ Validatie gefaald:")
            for error in errors:
                print(f"  - {error}")
    except Exception as e:
        print(f"✗ Validatie error: {e}")

def propose_new_structure():
    """Voorstel voor nieuwe data structuur"""
    print("\n\n=== VOORSTEL VOOR NIEUWE STRUCTUUR ===\n")
    
    print("De huidige data heeft een andere structuur dan verwacht:")
    print("1. Competenties staan als kolommen (wide format) ipv rijen (long format)")
    print("2. Scores zijn tekst ('Vaak', 'Soms', etc.) ipv numeriek (1-5)")
    print("3. Geen expliciete 'Type' kolom (self/peer/manager)")
    print("\nWe moeten de data_processor aanpassen om:")
    print("1. Wide naar long format te converteren")
    print("2. Tekst scores naar numeriek te mappen")
    print("3. Feedback type af te leiden uit context")
    print("4. 'Weet ik niet' antwoorden correct te negeren")

if __name__ == "__main__":
    # Analyseer de data
    df = analyze_data_structure()
    
    # Test huidige processor
    test_current_processor()
    
    # Stel aanpassingen voor
    propose_new_structure()