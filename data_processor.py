"""
Data Processing Module voor RadarChart Feedback Analyse

Deze module verwerkt Excel bestanden met feedbackdata en zet deze om naar
bruikbare scores per competentie voor radar chart visualisatie.

Auteur: RadarChart Development Team
Versie: 2.0
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
from pathlib import Path
import re

# Logging configuratie
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Score mapping van tekst naar numeriek
SCORE_MAPPING = {
    'zelden': 1,
    'soms': 2,
    'vaak': 3,
    'zeer vaak': 4,
    'weet ik niet': None,  # Wordt genegeerd in berekeningen
    'n.v.t.': None,
    'nvt': None,
    '': None
}

# Verwachte basis kolommen
BASE_COLUMNS = [
    'Timestamp',
    'Wie ben jij?',
    'Voor welke collega vul je dit formulier in?'
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
        self.competency_columns = []
        self.competency_categories = {}
    
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
            # Probeer verschillende Excel formaten en separators
            if file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path, engine='openpyxl')
            elif file_path.endswith('.xls'):
                df = pd.read_excel(file_path, engine='xlrd')
            elif file_path.endswith('.csv'):
                # Probeer verschillende separators
                for sep in [';', ',', '\t']:
                    try:
                        df = pd.read_csv(file_path, sep=sep)
                        if len(df.columns) > 1:  # Succesvolle split
                            break
                    except:
                        continue
            else:
                raise DataProcessingError(f"Niet ondersteund bestandsformaat: {file_path}")
            
            logger.info(f"Excel bestand succesvol gelezen: {len(df)} rijen, {len(df.columns)} kolommen")
            
            # Controleer of bestand niet leeg is
            if df.empty:
                raise DataProcessingError("Excel bestand is leeg")
            
            # Verwijder lege rijen (waar alle competentie scores leeg zijn)
            df = df.dropna(how='all')
            
            self.df = df
            return df
            
        except FileNotFoundError:
            raise DataProcessingError(f"Bestand niet gevonden: {file_path}")
        except pd.errors.EmptyDataError:
            raise DataProcessingError("Excel bestand bevat geen data")
        except Exception as e:
            raise DataProcessingError(f"Fout bij lezen Excel bestand: {str(e)}")
    
    def identify_competency_columns(self, df: pd.DataFrame) -> List[str]:
        """
        Identificeert competentie kolommen in de dataset
        
        Args:
            df (pd.DataFrame): DataFrame om te analyseren
            
        Returns:
            List[str]: Lijst van competentie kolommen
        """
        competency_columns = []
        
        for col in df.columns:
            # Competentie kolommen bevatten vaak ** of specifieke patronen
            if any(marker in str(col) for marker in ['**', 'ANALYSE', 'KWALITEIT', 'KLANT', 'PROJECT', 'TEAM', 'LEIDER', 'INNOVATIE']):
                competency_columns.append(col)
            # Of kolommen die scores bevatten
            elif col not in BASE_COLUMNS and df[col].dropna().astype(str).str.lower().isin(SCORE_MAPPING.keys()).any():
                competency_columns.append(col)
        
        self.competency_columns = competency_columns
        logger.info(f"Gevonden competentie kolommen: {len(competency_columns)}")
        return competency_columns
    
    def extract_competency_categories(self, columns: List[str]) -> Dict[str, List[str]]:
        """
        Extraheert competentie categorieën uit kolomnamen
        
        Args:
            columns (List[str]): Lijst van competentie kolommen
            
        Returns:
            Dict[str, List[str]]: Mapping van categorieën naar sub-competenties
        """
        categories = {}
        
        for col in columns:
            # Probeer categorie te extraheren tussen ** **
            match = re.search(r'\*\*([^*]+)\*\*', col)
            if match:
                full_category = match.group(1)
                # Split op ' - ' om hoofdcategorie te krijgen
                main_category = full_category.split(' - ')[0].strip()
                
                # Extract sub-competentie beschrijving tussen []
                sub_match = re.search(r'\[([^\]]+)\]', col)
                sub_competency = sub_match.group(1) if sub_match else col
                
                if main_category not in categories:
                    categories[main_category] = []
                categories[main_category].append({
                    'column': col,
                    'description': sub_competency
                })
        
        self.competency_categories = categories
        logger.info(f"Gevonden competentie categorieën: {list(categories.keys())}")
        return categories
    
    def convert_wide_to_long(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Converteert wide format (competenties als kolommen) naar long format
        
        Args:
            df (pd.DataFrame): Wide format DataFrame
            
        Returns:
            pd.DataFrame: Long format DataFrame
        """
        # Identificeer competentie kolommen
        competency_columns = self.identify_competency_columns(df)
        
        if not competency_columns:
            raise DataProcessingError("Geen competentie kolommen gevonden")
        
        # Extract categorieën
        categories = self.extract_competency_categories(competency_columns)
        
        # Bepaal id kolommen (niet-competentie kolommen)
        id_columns = [col for col in df.columns if col not in competency_columns]
        
        # Melt de dataframe
        long_df = pd.melt(
            df,
            id_vars=id_columns,
            value_vars=competency_columns,
            var_name='Competentie_Raw',
            value_name='Score_Text'
        )
        
        # Voeg categorie informatie toe
        def get_category(comp_raw):
            for cat, comps in categories.items():
                for comp in comps:
                    if comp['column'] == comp_raw:
                        return cat
            return 'Overig'
        
        long_df['Competentie'] = long_df['Competentie_Raw'].apply(get_category)
        
        # Map persoon en beoordelaar kolommen
        if 'Voor welke collega vul je dit formulier in?' in long_df.columns:
            long_df['Persoon'] = long_df['Voor welke collega vul je dit formulier in?'].str.strip()
        
        if 'Wie ben jij?' in long_df.columns:
            long_df['Beoordelaar'] = long_df['Wie ben jij?'].str.strip()
        
        # Bepaal feedback type
        def determine_feedback_type(row):
            if pd.isna(row.get('Persoon')) or pd.isna(row.get('Beoordelaar')):
                return 'peer'
            
            persoon = str(row['Persoon']).lower().strip()
            beoordelaar = str(row['Beoordelaar']).lower().strip()
            
            # Self assessment als persoon en beoordelaar (bijna) gelijk zijn
            if persoon in beoordelaar or beoordelaar in persoon:
                return 'self'
            # Voor nu alles als peer, later kunnen we manager logic toevoegen
            else:
                return 'peer'
        
        long_df['Type'] = long_df.apply(determine_feedback_type, axis=1)
        
        # Converteer scores naar numeriek
        long_df['Score'] = long_df['Score_Text'].str.lower().str.strip().map(SCORE_MAPPING)
        
        # Verwijder rijen zonder geldige score
        long_df = long_df[long_df['Score'].notna()]
        
        logger.info(f"Data geconverteerd van wide naar long format: {len(long_df)} rijen")
        
        return long_df
    
    def validate_excel_structure(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Valideert of Excel bestand de juiste structuur heeft
        
        Args:
            df (pd.DataFrame): DataFrame om te valideren
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, error_messages)
        """
        errors = []
        
        # Check voor basis kolommen
        missing_base = []
        for col in ['Wie ben jij?', 'Voor welke collega vul je dit formulier in?']:
            if col not in df.columns:
                missing_base.append(col)
        
        if missing_base:
            errors.append(f"Ontbrekende basis kolommen: {', '.join(missing_base)}")
        
        # Check voor competentie kolommen
        competency_columns = self.identify_competency_columns(df)
        if len(competency_columns) < 5:
            errors.append(f"Te weinig competentie kolommen gevonden: {len(competency_columns)}")
        
        # Check voor data
        if len(df) < 1:
            errors.append("Geen data rijen gevonden")
        
        self.validation_errors = errors
        return len(errors) == 0, errors
    
    def calculate_competency_scores(self, feedback_data: pd.DataFrame, person_name: str) -> Dict[str, Any]:
        """
        Berekent gemiddelde scores per competentie voor een persoon
        
        Args:
            feedback_data (pd.DataFrame): Feedback data in long format
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
            
            # Filter out None scores (van 'Weet ik niet' etc.)
            valid_scores = comp_data['Score'].dropna()
            
            if len(valid_scores) == 0:
                continue
            
            # Algemeen gemiddelde
            avg_score = valid_scores.mean()
            
            # Scores per feedback type
            type_scores = {}
            for feedback_type in comp_data['Type'].unique():
                type_data = comp_data[comp_data['Type'] == feedback_type]
                type_valid_scores = type_data['Score'].dropna()
                
                if len(type_valid_scores) > 0:
                    type_scores[feedback_type] = {
                        'average': type_valid_scores.mean(),
                        'count': len(type_valid_scores),
                        'scores': type_valid_scores.tolist()
                    }
            
            competency_scores[competentie] = round(avg_score, 2)
            competency_details[competentie] = {
                'overall_average': round(avg_score, 2),
                'by_type': type_scores,
                'total_responses': len(valid_scores),
                'std_deviation': round(valid_scores.std(), 2) if len(valid_scores) > 1 else 0
            }
        
        # Voeg KLANTGERICHTHEID samen als die gesplitst is
        klant_keys = [k for k in competency_scores.keys() if 'KLANTGERICHTHEID' in k]
        if len(klant_keys) > 1:
            # Bereken gemiddelde van alle KLANTGERICHTHEID scores
            klant_scores = [competency_scores[k] for k in klant_keys]
            combined_score = round(np.mean(klant_scores), 2)
            
            # Verwijder individuele scores en voeg gecombineerde toe
            for k in klant_keys:
                del competency_scores[k]
                del competency_details[k]
            
            competency_scores['KLANTGERICHTHEID'] = combined_score
            competency_details['KLANTGERICHTHEID'] = {
                'overall_average': combined_score,
                'note': 'Gecombineerd uit meerdere sub-competenties'
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
            feedback_data (pd.DataFrame): Alle feedback data in long format
            
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
                valid_scores = person_comp_data['Score'].dropna()
                
                if len(valid_scores) > 0:
                    person_avg = valid_scores.mean()
                    person_averages.append(person_avg)
            
            if person_averages:
                team_avg = np.mean(person_averages)
                team_averages[competentie] = round(team_avg, 2)
        
        # Combineer KLANTGERICHTHEID sub-competenties
        klant_keys = [k for k in team_averages.keys() if 'KLANTGERICHTHEID' in k]
        if len(klant_keys) > 1:
            klant_scores = [team_averages[k] for k in klant_keys]
            combined_score = round(np.mean(klant_scores), 2)
            
            for k in klant_keys:
                del team_averages[k]
            
            team_averages['KLANTGERICHTHEID'] = combined_score
        
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
        
        persons = feedback_data['Persoon'].dropna().unique().tolist()
        persons = [p for p in persons if p and str(p).strip()]  # Filter lege namen
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
            
            # Stap 2: Valideer structuur
            is_valid, errors = self.validate_excel_structure(df)
            if not is_valid:
                raise DataProcessingError(f"Validatie fouten: {'; '.join(errors)}")
            
            # Stap 3: Converteer van wide naar long format
            long_df = self.convert_wide_to_long(df)
            
            # Stap 4: Bereken team gemiddelden
            team_averages = self.calculate_team_averages(long_df)
            
            # Stap 5: Bereken individuele scores
            available_persons = self.get_available_persons(long_df)
            persons_data = {}
            
            for person in available_persons:
                try:
                    person_scores = self.calculate_competency_scores(long_df, person)
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
                'total_responses': len(long_df),
                'competencies': list(team_averages.keys()),
                'processing_summary': {
                    'total_rows_processed': len(df),
                    'total_feedback_entries': len(long_df),
                    'persons_found': len(available_persons),
                    'competencies_found': len(team_averages),
                    'validation_errors': self.validation_errors,
                    'competency_categories': list(self.competency_categories.keys())
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
    # Nieuwe structuur met competenties als kolommen
    sample_data = {
        'Timestamp': ['2024-01-15 10:00', '2024-01-15 10:30', '2024-01-15 11:00'],
        'Wie ben jij?': ['Jan Jansen', 'Maria Pietersen', 'Peter de Vries'],
        'Voor welke collega vul je dit formulier in?': ['Maria Pietersen', 'Jan Jansen', 'Jan Jansen'],
        '🔹 **PROBLEEMANALYSE** [Begrijpt de kern]': ['Vaak', 'Zeer vaak', 'Soms'],
        '🔹 **KWALITEITSZORG** [Levert hoge kwaliteit]': ['Zeer vaak', 'Vaak', 'Vaak'],
        '🔹 **KLANTGERICHTHEID** [Communiceert effectief]': ['Soms', 'Vaak', 'Zeer vaak'],
        '🔹 **TEAMSPELER** [Toont inzet]': ['Vaak', 'Zeer vaak', 'Vaak'],
        '🔹 **LEIDERSCHAP** [Behandelt met respect]': ['Zeer vaak', 'Vaak', 'Soms']
    }
    
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
        return processor.validate_excel_structure(df)
    except Exception as e:
        return False, [str(e)]

if __name__ == "__main__":
    # Test de module met sample data
    print("🧪 Testing Data Processor Module v2.0...")
    
    # Creëer sample data
    sample_df = create_sample_excel_structure()
    print(f"✅ Sample data gecreëerd: {len(sample_df)} rijen")
    print(f"   Kolommen: {list(sample_df.columns)[:3]}...")
    
    # Test processor
    processor = ExcelProcessor()
    
    # Test validatie
    is_valid, errors = processor.validate_excel_structure(sample_df)
    print(f"\n✅ Validatie: {'Geslaagd' if is_valid else 'Gefaald'}")
    if errors:
        for error in errors:
            print(f"   ❌ {error}")
    
    # Test conversie
    try:
        long_df = processor.convert_wide_to_long(sample_df)
        print(f"\n✅ Wide naar long conversie: {len(long_df)} feedback entries")
        
        # Test score berekening
        team_avg = processor.calculate_team_averages(long_df)
        print(f"✅ Team gemiddelden berekend: {len(team_avg)} competenties")
        
        persons = processor.get_available_persons(long_df)
        print(f"✅ Personen gevonden: {len(persons)} - {', '.join(persons)}")
        
        if persons:
            person_scores = processor.calculate_competency_scores(long_df, persons[0])
            print(f"✅ Individuele scores berekend voor: {persons[0]}")
            print(f"   Competenties: {list(person_scores['scores'].keys())}")
            
    except Exception as e:
        print(f"❌ Fout bij testen: {str(e)}")
    
    print("\n🎉 Data Processor Module v2.0 test voltooid!")
