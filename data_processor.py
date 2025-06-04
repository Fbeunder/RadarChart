"""
Data Processing Module voor RadarChart Feedback Analyse

Deze module verwerkt Excel bestanden met feedbackdata en zet deze om naar
bruikbare scores per competentie voor radar chart visualisatie.

Auteur: RadarChart Development Team
Versie: 1.0
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
from pathlib import Path

# Logging configuratie
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Competentie categorieën gebaseerd op 360-feedback modellen
COMPETENCY_CATEGORIES = {
    "Leiderschap": ["Visie", "Besluitvorming", "Delegeren", "Inspireren", "Coaching"],
    "Communicatie": ["Luisteren", "Presenteren", "Feedback geven", "Overtuigen", "Duidelijkheid"],
    "Samenwerking": ["Teamwork", "Conflicthantering", "Netwerken", "Empathie", "Samenwerken"],
    "Resultaatgerichtheid": ["Planning", "Uitvoering", "Kwaliteit", "Efficiency", "Doelgerichtheid"],
    "Persoonlijke Ontwikkeling": ["Leren", "Aanpassingsvermogen", "Innovatie", "Zelfreflectie", "Groei"]
}

# Verwachte kolommen in Excel bestand
REQUIRED_COLUMNS = [
    'Persoon',           # Naam van beoordeelde persoon
    'Beoordelaar',       # Naam van beoordelaar
    'Competentie',       # Naam van competentie
    'Score',             # Score (1-5 schaal)
    'Type'               # Type feedback: 'self', 'peer', 'manager'
]

# Optionele kolommen
OPTIONAL_COLUMNS = [
    'Opmerkingen',       # Tekstuele feedback
    'Datum',             # Datum van beoordeling
    'Afdeling',          # Afdeling van persoon
    'Functie'            # Functie van persoon
]

class DataProcessingError(Exception):
    """Custom exception voor data processing fouten"""
    pass

class ExcelProcessor:
    """Hoofdklasse voor Excel bestand verwerking"""
    
    def __init__(self):
        self.df = None
        self.processed_data = {}
        self.validation_errors = []
    
    def read_excel_file(self, file_path: str) -> pd.DataFrame:
        """
        Leest Excel bestand en retourneert gestructureerde data
        
        Args:
            file_path (str): Pad naar Excel bestand
            
        Returns:
            pd.DataFrame: Gestructureerde data uit Excel
            
        Raises:
            DataProcessingError: Bij fouten in bestand lezen
        """
        try:
            # Probeer verschillende Excel formaten
            if file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path, engine='openpyxl')
            elif file_path.endswith('.xls'):
                df = pd.read_excel(file_path, engine='xlrd')
            else:
                raise DataProcessingError(f"Niet ondersteund bestandsformaat: {file_path}")
            
            logger.info(f"Excel bestand succesvol gelezen: {len(df)} rijen, {len(df.columns)} kolommen")
            
            # Controleer of bestand niet leeg is
            if df.empty:
                raise DataProcessingError("Excel bestand is leeg")
            
            self.df = df
            return df
            
        except FileNotFoundError:
            raise DataProcessingError(f"Bestand niet gevonden: {file_path}")
        except pd.errors.EmptyDataError:
            raise DataProcessingError("Excel bestand bevat geen data")
        except Exception as e:
            raise DataProcessingError(f"Fout bij lezen Excel bestand: {str(e)}")
    
    def validate_excel_structure(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Valideert of Excel bestand de juiste structuur heeft
        
        Args:
            df (pd.DataFrame): DataFrame om te valideren
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        errors = []
        
        # Controleer aanwezigheid verplichte kolommen
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_columns:
            errors.append(f"Ontbrekende verplichte kolommen: {', '.join(missing_columns)}")
        
        # Controleer data types en waarden
        if 'Score' in df.columns:
            # Valideer score range (1-5)
            invalid_scores = df[~df['Score'].between(1, 5, inclusive='both')]
            if not invalid_scores.empty:
                errors.append(f"Ongeldige scores gevonden (moeten tussen 1-5 zijn): {len(invalid_scores)} rijen")
            
            # Controleer op niet-numerieke scores
            non_numeric_scores = df[pd.to_numeric(df['Score'], errors='coerce').isna()]
            if not non_numeric_scores.empty:
                errors.append(f"Niet-numerieke scores gevonden: {len(non_numeric_scores)} rijen")
        
        # Controleer feedback types
        if 'Type' in df.columns:
            valid_types = ['self', 'peer', 'manager']
            invalid_types = df[~df['Type'].str.lower().isin(valid_types)]
            if not invalid_types.empty:
                unique_invalid = invalid_types['Type'].unique()
                errors.append(f"Ongeldige feedback types: {', '.join(unique_invalid)}. Geldige types: {', '.join(valid_types)}")
        
        # Controleer op lege verplichte velden
        for col in REQUIRED_COLUMNS:
            if col in df.columns:
                empty_values = df[df[col].isna() | (df[col] == '')]
                if not empty_values.empty:
                    errors.append(f"Lege waarden in verplichte kolom '{col}': {len(empty_values)} rijen")
        
        self.validation_errors = errors
        return len(errors) == 0, errors
    
    def map_feedback_structure(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Mapt Excel kolommen naar verwachte data structuur
        
        Args:
            df (pd.DataFrame): Ruwe Excel data
            
        Returns:
            pd.DataFrame: Gemapte en geschoonde data
        """
        # Maak kopie om originele data te behouden
        mapped_df = df.copy()
        
        # Normaliseer kolomnamen (verwijder spaties, maak lowercase)
        column_mapping = {}
        for col in df.columns:
            clean_col = col.strip().lower()
            if 'persoon' in clean_col or 'naam' in clean_col:
                column_mapping[col] = 'Persoon'
            elif 'beoordelaar' in clean_col or 'reviewer' in clean_col:
                column_mapping[col] = 'Beoordelaar'
            elif 'competentie' in clean_col or 'skill' in clean_col:
                column_mapping[col] = 'Competentie'
            elif 'score' in clean_col or 'rating' in clean_col:
                column_mapping[col] = 'Score'
            elif 'type' in clean_col or 'category' in clean_col:
                column_mapping[col] = 'Type'
        
        # Pas mapping toe
        mapped_df = mapped_df.rename(columns=column_mapping)
        
        # Normaliseer data waarden
        if 'Type' in mapped_df.columns:
            mapped_df['Type'] = mapped_df['Type'].str.lower().str.strip()
        
        if 'Persoon' in mapped_df.columns:
            mapped_df['Persoon'] = mapped_df['Persoon'].str.strip()
        
        if 'Competentie' in mapped_df.columns:
            mapped_df['Competentie'] = mapped_df['Competentie'].str.strip()
        
        # Converteer scores naar numeriek
        if 'Score' in mapped_df.columns:
            mapped_df['Score'] = pd.to_numeric(mapped_df['Score'], errors='coerce')
        
        logger.info(f"Data structuur gemapped: {len(mapped_df)} rijen verwerkt")
        return mapped_df
    
    def calculate_competency_scores(self, feedback_data: pd.DataFrame, person_name: str) -> Dict[str, Any]:
        """
        Berekent gemiddelde scores per competentie voor een persoon
        
        Args:
            feedback_data (pd.DataFrame): Feedback data
            person_name (str): Naam van persoon om scores voor te berekenen
            
        Returns:
            Dict[str, Any]: Dictionary met scores en statistieken
        """
        # Filter data voor specifieke persoon
        person_data = feedback_data[feedback_data['Persoon'] == person_name].copy()
        
        if person_data.empty:
            raise DataProcessingError(f"Geen data gevonden voor persoon: {person_name}")
        
        # Bereken scores per competentie
        competency_scores = {}
        competency_details = {}
        
        for competentie in person_data['Competentie'].unique():
            comp_data = person_data[person_data['Competentie'] == competentie]
            
            # Algemeen gemiddelde
            avg_score = comp_data['Score'].mean()
            
            # Scores per feedback type
            type_scores = {}
            for feedback_type in comp_data['Type'].unique():
                type_data = comp_data[comp_data['Type'] == feedback_type]
                type_scores[feedback_type] = {
                    'average': type_data['Score'].mean(),
                    'count': len(type_data),
                    'scores': type_data['Score'].tolist()
                }
            
            competency_scores[competentie] = round(avg_score, 2)
            competency_details[competentie] = {
                'overall_average': round(avg_score, 2),
                'by_type': type_scores,
                'total_responses': len(comp_data),
                'std_deviation': round(comp_data['Score'].std(), 2)
            }
        
        return {
            'person_name': person_name,
            'scores': competency_scores,
            'details': competency_details,
            'total_responses': len(person_data)
        }
    
    def calculate_team_averages(self, feedback_data: pd.DataFrame) -> Dict[str, float]:
        """
        Berekent team gemiddelden per competentie
        
        Args:
            feedback_data (pd.DataFrame): Alle feedback data
            
        Returns:
            Dict[str, float]: Team gemiddelden per competentie
        """
        team_averages = {}
        
        for competentie in feedback_data['Competentie'].unique():
            comp_data = feedback_data[feedback_data['Competentie'] == competentie]
            
            # Bereken gemiddelde per persoon eerst, dan team gemiddelde
            person_averages = []
            for person in comp_data['Persoon'].unique():
                person_comp_data = comp_data[comp_data['Persoon'] == person]
                person_avg = person_comp_data['Score'].mean()
                person_averages.append(person_avg)
            
            team_avg = np.mean(person_averages)
            team_averages[competentie] = round(team_avg, 2)
        
        logger.info(f"Team gemiddelden berekend voor {len(team_averages)} competenties")
        return team_averages
    
    def get_available_persons(self, feedback_data: pd.DataFrame) -> List[str]:
        """
        Retourneert lijst van beschikbare personen in dataset
        
        Args:
            feedback_data (pd.DataFrame): Feedback data
            
        Returns:
            List[str]: Lijst van persoonsnamen
        """
        if 'Persoon' not in feedback_data.columns:
            return []
        
        persons = feedback_data['Persoon'].unique().tolist()
        persons.sort()  # Alfabetisch sorteren
        return persons
    
    def process_excel_file(self, file_path: str) -> Dict[str, Any]:
        """
        Hoofdfunctie om Excel bestand volledig te verwerken
        
        Args:
            file_path (str): Pad naar Excel bestand
            
        Returns:
            Dict[str, Any]: Volledig verwerkte data
        """
        try:
            # Stap 1: Lees Excel bestand
            df = self.read_excel_file(file_path)
            
            # Stap 2: Map data structuur
            mapped_df = self.map_feedback_structure(df)
            
            # Stap 3: Valideer structuur
            is_valid, errors = self.validate_excel_structure(mapped_df)
            if not is_valid:
                raise DataProcessingError(f"Validatie fouten: {'; '.join(errors)}")
            
            # Stap 4: Bereken team gemiddelden
            team_averages = self.calculate_team_averages(mapped_df)
            
            # Stap 5: Bereken individuele scores
            available_persons = self.get_available_persons(mapped_df)
            persons_data = {}
            
            for person in available_persons:
                try:
                    person_scores = self.calculate_competency_scores(mapped_df, person)
                    persons_data[person] = person_scores
                except Exception as e:
                    logger.warning(f"Fout bij verwerken data voor {person}: {str(e)}")
                    continue
            
            # Stap 6: Compileer resultaat
            result = {
                'success': True,
                'persons': persons_data,
                'team_averages': team_averages,
                'available_persons': available_persons,
                'total_responses': len(mapped_df),
                'competencies': list(team_averages.keys()),
                'processing_summary': {
                    'total_rows_processed': len(mapped_df),
                    'persons_found': len(available_persons),
                    'competencies_found': len(team_averages),
                    'validation_errors': self.validation_errors
                }
            }
            
            logger.info(f"Excel verwerking succesvol: {len(available_persons)} personen, {len(team_averages)} competenties")
            return result
            
        except Exception as e:
            logger.error(f"Fout bij verwerken Excel bestand: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'validation_errors': self.validation_errors
            }

def create_sample_excel_structure() -> pd.DataFrame:
    """
    Creëert een voorbeeld Excel structuur voor testing
    
    Returns:
        pd.DataFrame: Voorbeeld data structuur
    """
    sample_data = []
    
    persons = ["Jan Jansen", "Maria Pietersen", "Peter de Vries", "Lisa van Dam", "Tom Bakker"]
    competencies = ["Communicatie", "Teamwork", "Leiderschap", "Probleemoplossing", "Creativiteit", "Analytisch denken"]
    feedback_types = ["self", "peer", "manager"]
    
    # Genereer sample data
    for person in persons:
        for competentie in competencies:
            for feedback_type in feedback_types:
                # Simuleer 2-3 beoordelaars per type
                num_reviewers = np.random.randint(2, 4)
                for i in range(num_reviewers):
                    reviewer = f"{feedback_type}_reviewer_{i+1}" if feedback_type != "self" else person
                    score = np.random.randint(3, 6)  # Scores tussen 3-5
                    
                    sample_data.append({
                        'Persoon': person,
                        'Beoordelaar': reviewer,
                        'Competentie': competentie,
                        'Score': score,
                        'Type': feedback_type,
                        'Opmerkingen': f"Sample feedback voor {competentie}",
                        'Datum': '2024-01-15'
                    })
    
    return pd.DataFrame(sample_data)

# Convenience functies voor directe import
def process_excel_file(file_path: str) -> Dict[str, Any]:
    """
    Convenience functie om Excel bestand te verwerken
    
    Args:
        file_path (str): Pad naar Excel bestand
        
    Returns:
        Dict[str, Any]: Verwerkte data
    """
    processor = ExcelProcessor()
    return processor.process_excel_file(file_path)

def validate_excel_file(file_path: str) -> Tuple[bool, List[str]]:
    """
    Convenience functie om Excel bestand te valideren
    
    Args:
        file_path (str): Pad naar Excel bestand
        
    Returns:
        Tuple[bool, List[str]]: (is_valid, error_messages)
    """
    processor = ExcelProcessor()
    try:
        df = processor.read_excel_file(file_path)
        mapped_df = processor.map_feedback_structure(df)
        return processor.validate_excel_structure(mapped_df)
    except Exception as e:
        return False, [str(e)]

if __name__ == "__main__":
    # Test de module met sample data
    print("🧪 Testing Data Processor Module...")
    
    # Creëer sample data
    sample_df = create_sample_excel_structure()
    print(f"✅ Sample data gecreëerd: {len(sample_df)} rijen")
    
    # Test processor
    processor = ExcelProcessor()
    processor.df = sample_df
    
    # Test validatie
    is_valid, errors = processor.validate_excel_structure(sample_df)
    print(f"✅ Validatie: {'Geslaagd' if is_valid else 'Gefaald'}")
    if errors:
        for error in errors:
            print(f"   ❌ {error}")
    
    # Test score berekening
    try:
        team_avg = processor.calculate_team_averages(sample_df)
        print(f"✅ Team gemiddelden berekend: {len(team_avg)} competenties")
        
        persons = processor.get_available_persons(sample_df)
        print(f"✅ Personen gevonden: {len(persons)}")
        
        if persons:
            person_scores = processor.calculate_competency_scores(sample_df, persons[0])
            print(f"✅ Individuele scores berekend voor: {persons[0]}")
            
    except Exception as e:
        print(f"❌ Fout bij testen: {str(e)}")
    
    print("🎉 Data Processor Module test voltooid!")