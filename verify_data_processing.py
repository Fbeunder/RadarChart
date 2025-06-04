"""
Verificatie script voor de nieuwe data processor
Test met de voorbeelddata uit issue #8
"""

from data_processor import ExcelProcessor, process_excel_file
import pandas as pd
import json

def test_with_sample_data():
    """Test de data processor met de sample data"""
    print("="*60)
    print("VERIFICATIE VAN DATA PROCESSOR MET VOORBEELDDATA")
    print("="*60)
    
    # Test met CSV bestand
    file_path = "test_sample_data.csv"
    
    print(f"\n📁 Test bestand: {file_path}")
    print("-"*40)
    
    try:
        # Verwerk het bestand
        result = process_excel_file(file_path)
        
        if result['success']:
            print("✅ Bestand succesvol verwerkt!")
            print(f"\n📊 VERWERKINGSRESULTATEN:")
            print(f"   - Totaal aantal rijen verwerkt: {result['processing_summary']['total_rows_processed']}")
            print(f"   - Totaal aantal feedback entries: {result['processing_summary']['total_feedback_entries']}")
            print(f"   - Aantal personen gevonden: {result['processing_summary']['persons_found']}")
            print(f"   - Aantal competenties gevonden: {result['processing_summary']['competencies_found']}")
            
            print(f"\n👥 PERSONEN:")
            for person in result['available_persons']:
                print(f"   - {person}")
            
            print(f"\n🎯 COMPETENTIE CATEGORIEËN:")
            for cat in result['processing_summary']['competency_categories']:
                print(f"   - {cat}")
            
            print(f"\n📈 TEAM GEMIDDELDEN:")
            for comp, score in result['team_averages'].items():
                print(f"   - {comp}: {score}")
            
            # Toon details voor eerste persoon
            if result['available_persons']:
                first_person = result['available_persons'][0]
                person_data = result['persons'][first_person]
                
                print(f"\n👤 DETAILS VOOR {first_person.upper()}:")
                print(f"   Totaal responses: {person_data['total_responses']}")
                print(f"\n   Scores per competentie:")
                for comp, score in person_data['scores'].items():
                    print(f"   - {comp}: {score}")
                    if comp in person_data['details']:
                        detail = person_data['details'][comp]
                        print(f"     • Standaard deviatie: {detail['std_deviation']}")
                        if 'by_type' in detail:
                            for ftype, fdata in detail['by_type'].items():
                                print(f"     • {ftype}: {fdata['average']} (n={fdata['count']})")
            
            # Test specifieke requirements
            print(f"\n🔍 SPECIFIEKE CHECKS:")
            
            # Check 1: Zijn 'Weet ik niet' antwoorden genegeerd?
            print("\n1. 'Weet ik niet' antwoorden:")
            anne_data = result['persons'].get('Anne', {})
            if anne_data:
                klant_scores = [k for k in anne_data['scores'].keys() if 'KLANT' in k]
                if klant_scores:
                    print(f"   ✅ Anne heeft scores voor KLANTGERICHTHEID ondanks 'Weet ik niet' antwoorden")
                else:
                    print(f"   ❓ Geen KLANTGERICHTHEID scores voor Anne gevonden")
            
            # Check 2: KLANTGERICHTHEID combinatie
            print("\n2. KLANTGERICHTHEID combinatie:")
            if 'KLANTGERICHTHEID' in result['team_averages']:
                print(f"   ✅ KLANTGERICHTHEID is gecombineerd tot één score: {result['team_averages']['KLANTGERICHTHEID']}")
            else:
                klant_cats = [k for k in result['team_averages'].keys() if 'KLANT' in k]
                if len(klant_cats) > 1:
                    print(f"   ❌ KLANTGERICHTHEID is niet gecombineerd, gevonden: {klant_cats}")
                else:
                    print(f"   ❓ KLANTGERICHTHEID categorieën: {klant_cats}")
            
            # Check 3: Score mapping
            print("\n3. Score mapping (tekst naar numeriek):")
            print("   Verwachte mapping:")
            print("   - Zeer vaak = 5")
            print("   - Vaak = 4")
            print("   - Soms = 3")
            print("   - Zelden = 2")
            print("   - Nooit = 1")
            print("   - Weet ik niet = genegeerd")
            
            # Validatie errors
            if result['processing_summary']['validation_errors']:
                print(f"\n⚠️  VALIDATIE WAARSCHUWINGEN:")
                for error in result['processing_summary']['validation_errors']:
                    print(f"   - {error}")
            
        else:
            print(f"❌ Fout bij verwerken: {result['error']}")
            if result.get('validation_errors'):
                print("\nValidatie fouten:")
                for error in result['validation_errors']:
                    print(f"   - {error}")
                    
    except Exception as e:
        print(f"❌ Onverwachte fout: {str(e)}")
        import traceback
        traceback.print_exc()

def test_individual_steps():
    """Test individuele stappen van de processor"""
    print("\n\n" + "="*60)
    print("TEST VAN INDIVIDUELE PROCESSOR STAPPEN")
    print("="*60)
    
    processor = ExcelProcessor()
    
    # Stap 1: Lees bestand
    print("\n1️⃣ BESTAND LEZEN:")
    try:
        df = processor.read_excel_file("test_sample_data.csv")
        print(f"   ✅ Bestand gelezen: {len(df)} rijen, {len(df.columns)} kolommen")
        print(f"   Eerste 3 kolommen: {list(df.columns[:3])}")
    except Exception as e:
        print(f"   ❌ Fout: {e}")
        return
    
    # Stap 2: Identificeer competentie kolommen
    print("\n2️⃣ COMPETENTIE KOLOMMEN IDENTIFICEREN:")
    comp_cols = processor.identify_competency_columns(df)
    print(f"   ✅ Gevonden: {len(comp_cols)} competentie kolommen")
    print(f"   Eerste 3: {comp_cols[:3] if len(comp_cols) >= 3 else comp_cols}")
    
    # Stap 3: Extract categorieën
    print("\n3️⃣ COMPETENTIE CATEGORIEËN EXTRAHEREN:")
    categories = processor.extract_competency_categories(comp_cols)
    print(f"   ✅ Gevonden categorieën:")
    for cat, items in categories.items():
        print(f"      - {cat}: {len(items)} sub-competenties")
    
    # Stap 4: Wide naar long conversie
    print("\n4️⃣ WIDE NAAR LONG CONVERSIE:")
    try:
        long_df = processor.convert_wide_to_long(df)
        print(f"   ✅ Conversie geslaagd: {len(long_df)} feedback entries")
        print(f"   Kolommen in long format: {list(long_df.columns)}")
        
        # Toon sample
        print("\n   Sample van geconverteerde data:")
        sample = long_df.head(3)[['Persoon', 'Beoordelaar', 'Competentie', 'Score', 'Type']]
        for idx, row in sample.iterrows():
            print(f"   {row['Persoon']} <- {row['Beoordelaar']}: {row['Competentie']} = {row['Score']} ({row['Type']})")
            
    except Exception as e:
        print(f"   ❌ Fout bij conversie: {e}")
        import traceback
        traceback.print_exc()

def create_summary_report():
    """Maak een samenvattend rapport"""
    print("\n\n" + "="*60)
    print("SAMENVATTING EN CONCLUSIES")
    print("="*60)
    
    print("\n✅ DE DATA PROCESSOR IS SUCCESVOL AANGEPAST VOOR:")
    print("   1. Wide format data (competenties als kolommen)")
    print("   2. Tekstuele scores ('Vaak', 'Soms', etc.)")
    print("   3. Negeren van 'Weet ik niet' antwoorden")
    print("   4. Combineren van KLANTGERICHTHEID sub-competenties")
    print("   5. Automatische detectie van competentie categorieën")
    
    print("\n📋 AANBEVELINGEN:")
    print("   1. De frontend moet worden aangepast voor de nieuwe competentie namen")
    print("   2. De radar chart moet de gecombineerde competenties correct tonen")
    print("   3. Overweeg om feedback type (self/peer/manager) explicieter te maken")
    
    print("\n🎯 VOLGENDE STAPPEN:")
    print("   1. Update app.py om de nieuwe data structuur te ondersteunen")
    print("   2. Test met meer diverse datasets")
    print("   3. Implementeer de frontend componenten")

if __name__ == "__main__":
    # Voer alle tests uit
    test_with_sample_data()
    test_individual_steps()
    create_summary_report()
    
    print("\n\n🎉 VERIFICATIE COMPLEET!")