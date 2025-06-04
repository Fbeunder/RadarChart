import pandas as pd
from io import BytesIO

# Mapping from textual answers to numeric scores
ANSWER_MAP = {
    "Zeer vaak": 4,
    "Vaak": 3,
    "Soms": 2,
    "Zelden": 1,
    "Weet ik niet": None,
}

# Mapping from long column names in the Excel file to competency areas
# Update these mappings with the exact column headers from the questionnaire
COLUMN_TO_COMPETENCY = {
    "🔹 PROBLEEMANALYSE - Vraag 1": "PROBLEEMANALYSE",
    "🔹 KWALITEITSZORG - Vraag 1": "KWALITEITSZORG",
    "🔹 KLANTGERICHTHEID met boodschap overbrengen": "KLANTGERICHTHEID",
    "🔹 KLANTGERICHTHEID met behoefte ophalen": "KLANTGERICHTHEID",
    "🔹 PROJECTMANAGEMENT - Vraag 1": "PROJECTMANAGEMENT",
    "🔹 TEAMSPELER - Vraag 1": "TEAMSPELER",
    "🔹 COLLEGIALE ONTWIKKELING - Vraag 1": "COLLEGIALE ONTWIKKELING",
    "🔹 LEIDERSCHAP EN INTEGRITEIT - Vraag 1": "LEIDERSCHAP EN INTEGRITEIT",
    "🔹 INNOVATIE EN COMMERCIE - Vraag 1": "INNOVATIE EN COMMERCIE",
}

COMPETENCIES = [
    "PROBLEEMANALYSE",
    "KWALITEITSZORG",
    "KLANTGERICHTHEID",
    "PROJECTMANAGEMENT",
    "TEAMSPELER",
    "COLLEGIALE ONTWIKKELING",
    "LEIDERSCHAP EN INTEGRITEIT",
    "INNOVATIE EN COMMERCIE",
]


def read_excel(file_stream: BytesIO) -> pd.DataFrame:
    """Read uploaded Excel file into a pandas DataFrame."""
    df = pd.read_excel(file_stream)
    return df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """Map textual answers to scores and rename columns by competency."""
    df = df.copy()

    # Convert textual answers to numeric scores
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].map(ANSWER_MAP).where(df[col].map(ANSWER_MAP).notna(), df[col])

    # Rename question columns to competency names
    rename_map = {col: COLUMN_TO_COMPETENCY[col] for col in df.columns if col in COLUMN_TO_COMPETENCY}
    df = df.rename(columns=rename_map)

    return df


def calculate_individual_scores(df: pd.DataFrame, person_column: str) -> dict:
    """Calculate mean scores per competency for each person."""
    results = {}
    persons = df[person_column].dropna().unique()

    for person in persons:
        person_df = df[df[person_column] == person]
        scores = {}
        for comp in COMPETENCIES:
            if comp in person_df.columns:
                scores[comp] = person_df[comp].astype(float).mean()
        results[person] = scores
    return results


def calculate_overall_average(individual_scores: dict) -> dict:
    """Calculate overall mean score per competency across individuals."""
    totals = {comp: [] for comp in COMPETENCIES}
    for scores in individual_scores.values():
        for comp, score in scores.items():
            totals.setdefault(comp, []).append(score)
    averages = {comp: (pd.Series(values).mean() if values else None) for comp, values in totals.items()}
    return averages

