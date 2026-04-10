"""
Pipeline de données — Élections Municipales 2026
=================================================
Produit un fichier JSON (bureaux_vote_final.json) à injecter dans
la carte interactive (carte_elections_2026.html).

Sources attendues (toutes sur data.gouv.fr) :
  - resultats_t1_bureaux.csv    : Ministère de l'Intérieur — T1 par BV
  - resultats_t2_bureaux.csv    : Ministère de l'Intérieur — T2 par BV (optionnel)
  - listes_candidates_t1.csv    : Ministère de l'Intérieur — listes T1
  - sortants_rne.csv            : RNE — élus sortants (maires + conseillers)
  - insee_csp_communes.csv      : INSEE RP2022 — CSP par commune
  - coords_communes.csv         : (optionnel) lat/lon par code INSEE

Utilisation :
  pip install pandas tqdm requests
  python pipeline_elections_2026.py --data-dir ./data --output ./output
"""

import argparse
import json
import logging
import os
import re
import sys
from pathlib import Path

import pandas as pd
import numpy as np

# ─────────────────────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# Correspondance colonnes INSEE → label CSP lisible
CSP_LABELS = {
    "CS1_1": "Agriculteurs",
    "CS1_2": "Artisans/Commerçants",
    "CS1_3": "Cadres",
    "CS1_4": "Prof. intermédiaires",
    "CS1_5": "Employés",
    "CS1_6": "Ouvriers",
    "CS1_7": "Retraités",
    "CS1_8": "Sans activité",
}

# Colonnes numériques du fichier T1
NUMERIC_T1 = [
    "Inscrits", "Abstentions", "Votants", "Blancs", "Nuls", "Exprimés", "Voix",
    "% Abs/Ins", "% Vot/Ins", "% Blancs/Vot", "% Nuls/Vot",
    "% Exp/Ins", "% Exp/Vot", "% Voix/Ins", "% Voix/Exp",
]

# Coordonnées approx. des communes (fallback si pas de fichier coords)
COORDS_FALLBACK = {
    "13055": (43.2965,  5.3698),  "75056": (48.8606,  2.3792),
    "69123": (45.7640,  4.8357),  "31555": (43.6047,  1.4442),
    "06088": (43.7102,  7.2620),  "44109": (47.2184, -1.5536),
    "67482": (48.5734,  7.7521),  "59350": (50.6292,  3.0573),
    "76540": (49.4432,  1.0993),  "33063": (44.8378, -0.5792),
    "01053": (46.2058,  5.2259),  "48095": (44.5195,  3.5009),
    "63113": (45.7772,  3.0870),  "84031": (44.0522,  5.0480),
    "29232": (47.9965, -4.0980),
}

# ─────────────────────────────────────────────────────────────
#  ÉTAPE 0 — TÉLÉCHARGEMENT AUTOMATIQUE (optionnel)
# ─────────────────────────────────────────────────────────────

DATAGOUV_FILES = {
    "resultats_t1_bureaux.csv": (
        "https://www.data.gouv.fr/api/1/datasets/r/bc9bca84-beb4-4525-b79a-23ecca48d86e",
        "Résultats T1 par bureau de vote (France entière) — ~33 Mo"
    ),
    "resultats_t2_bureaux.csv": (
        "https://www.data.gouv.fr/api/1/datasets/r/PLACEHOLDER_T2_BV",
        "Résultats T2 par bureau de vote — à mettre à jour après le 22 mars"
    ),
    "listes_candidates_t1.csv": (
        "https://www.data.gouv.fr/api/1/datasets/r/1428132c-ad5e-437e-a928-7c2a254e40eb",
        "Listes candidates T1 — ~35 Mo"
    ),
    "sortants_rne.csv": (
        "https://www.data.gouv.fr/api/1/datasets/r/PLACEHOLDER_RNE",
        "Élus sortants RNE — maires et conseillers municipaux"
    ),
}

def fetch_commune_coords(dest: Path) -> bool:
    """
    Télécharge les centroïdes de toutes les communes françaises via l'API officielle
    geo.api.gouv.fr et les écrit dans dest (coords_communes.csv).
    Retourne True si succès.
    """
    try:
        import requests
    except ImportError:
        log.warning("requests non installé — impossible de télécharger les coordonnées.")
        return False

    url = "https://geo.api.gouv.fr/communes?fields=code,centre&format=json&geometry=centre"
    log.info(f"  ↓ Téléchargement des centroïdes communes depuis geo.api.gouv.fr…")
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        communes = r.json()
        rows = []
        for c in communes:
            code = str(c.get("code", "")).zfill(5)
            centre = c.get("centre", {})
            coords_list = centre.get("coordinates", [None, None])
            if coords_list and coords_list[0] is not None:
                rows.append({"COG": code, "lat": coords_list[1], "lon": coords_list[0]})
        if not rows:
            log.error("  ✗ Aucune coordonnée récupérée depuis l'API.")
            return False
        import csv
        with open(dest, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["COG", "lat", "lon"], delimiter=";")
            writer.writeheader()
            writer.writerows(rows)
        log.info(f"  ✓ {len(rows)} communes écrites dans {dest.name}")
        return True
    except Exception as e:
        log.error(f"  ✗ Échec récupération coordonnées : {e}")
        return False


def download_files(data_dir: Path) -> None:
    """Télécharge les fichiers sources depuis data.gouv.fr si absents."""
    try:
        import requests
        from tqdm import tqdm
    except ImportError:
        log.warning("requests / tqdm non installés — téléchargement auto désactivé.")
        return

    for filename, (url, desc) in DATAGOUV_FILES.items():
        dest = data_dir / filename
        if dest.exists():
            log.info(f"  ✓ {filename} déjà présent")
            continue
        if "PLACEHOLDER" in url:
            log.warning(f"  ⚠ URL non renseignée pour {filename} — à télécharger manuellement")
            continue
        log.info(f"  ↓ {filename} — {desc}")
        try:
            r = requests.get(url, stream=True, timeout=60)
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            with open(dest, "wb") as f, tqdm(total=total, unit="B", unit_scale=True, desc=filename) as bar:
                for chunk in r.iter_content(chunk_size=65536):
                    f.write(chunk)
                    bar.update(len(chunk))
        except Exception as e:
            log.error(f"  ✗ Échec téléchargement {filename} : {e}")


# ─────────────────────────────────────────────────────────────
#  ÉTAPE 1 — CHARGEMENT & NETTOYAGE DES SOURCES
# ─────────────────────────────────────────────────────────────

def load_csv(path: Path, sep: str = ";") -> pd.DataFrame:
    """Charge un CSV avec gestion d'encodage et de séparateur décimal."""
    for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            df = pd.read_csv(path, sep=sep, dtype=str, encoding=enc, low_memory=False)
            log.info(f"  Chargé  {path.name:<40} {len(df):>7} lignes  ({enc})")
            return df
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Impossible de lire {path}")


def clean_numeric(df: pd.DataFrame, cols: list) -> pd.DataFrame:
    """Convertit les colonnes numériques (gère virgule décimale française)."""
    for c in cols:
        if c in df.columns:
            df[c] = (
                df[c].astype(str)
                    .str.replace(" ", "", regex=False)
                    .str.replace(",", ".", regex=False)
            )
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)
    return df


def normalize_cog(series: pd.Series) -> pd.Series:
    """Normalise le code INSEE commune sur 5 caractères."""
    return series.astype(str).str.strip().str.zfill(5)


def _wide_to_long_t1(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convertit un fichier T1 en format large (colonnes "Numéro de panneau N", "Voix N"…)
    vers le format long attendu par le pipeline (une ligne par bureau × liste).
    Les colonnes de base doivent déjà être renommées avant l'appel.
    """
    id_cols = [c for c in [
        "Code du département", "Libellé du département",
        "Code de la commune", "Libellé de la commune", "Code du b/vote",
        "Inscrits", "Abstentions", "Votants", "Exprimés", "Blancs", "Nuls",
    ] if c in df.columns]

    list_nums = sorted({
        int(m.group(1))
        for c in df.columns
        for m in [re.match(r"Num[eé]ro de panneau (\d+)$", c)]
        if m
    })

    rows = []
    for n in list_nums:
        panneau_col = f"Numéro de panneau {n}"
        voix_col    = f"Voix {n}"
        nuance_col  = f"Nuance liste {n}"

        if voix_col not in df.columns:
            continue

        # Garder uniquement les bureaux où cette liste est présente
        if panneau_col in df.columns:
            mask = df[panneau_col].notna() & (df[panneau_col].astype(str).str.strip() != "")
        else:
            mask = df[voix_col].notna() & (df[voix_col].astype(str).str.strip() != "")

        if mask.sum() == 0:
            continue

        sub = df.loc[mask, id_cols].copy()
        sub["N°Liste"] = df.loc[mask, panneau_col] if panneau_col in df.columns else n
        sub["Voix"]    = df.loc[mask, voix_col]
        if nuance_col in df.columns:
            sub["Nuance Liste"] = df.loc[mask, nuance_col]

        rows.append(sub)

    return pd.concat(rows, ignore_index=True) if rows else df


def load_t1(path: Path) -> pd.DataFrame:
    df = load_csv(path)

    # Normalisation des noms de colonnes (le Ministère les change parfois légèrement)
    rename_map = {
        # Variantes connues → nom canonique
        "Code département":            "Code du département",
        "Libellé département":         "Libellé du département",
        "Code commune":                "Code de la commune",
        "Libellé commune":             "Libellé de la commune",
        "Code bureau":                 "Code du b/vote",
        "Code BV":                     "Code du b/vote",
        "NumeroListe":                 "N°Liste",
        "NuanceListe":                 "Nuance Liste",
        "Libellé Abrégé de la liste":  "Libellé Abrégé Liste",
        "Nom tête de liste":           "Nom Tête de Liste",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    # Format large (Ministère actuel) → format long
    if any(re.match(r"Num[eé]ro de panneau \d+$", c) for c in df.columns):
        df = _wide_to_long_t1(df)

    df = clean_numeric(df, NUMERIC_T1)

    # Colonnes obligatoires
    required = ["Code de la commune", "Code du b/vote", "Inscrits",
                "Abstentions", "Votants", "Exprimés", "N°Liste", "Voix"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes dans T1 : {missing}")

    df["COG"] = normalize_cog(df["Code de la commune"])
    df["N°Liste"] = pd.to_numeric(df["N°Liste"], errors="coerce").fillna(0).astype(int)
    df["Code du b/vote"] = df["Code du b/vote"].astype(str).str.strip().str.zfill(4)

    log.info(f"    → {df['COG'].nunique()} communes, {df.groupby(['COG','Code du b/vote']).ngroups} bureaux de vote")
    return df


def load_listes(path: Path) -> pd.DataFrame:
    df = load_csv(path)
    rename_map = {
        "Code commune":     "Code de la commune",
        "Code BV":          "Code du b/vote",
        "NumeroListe":      "N°Liste",
        "NuanceListe":      "Nuance Liste",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    # Format large → long (réutilise le même helper que load_t1)
    if any(re.match(r"Num[eé]ro de panneau \d+$", c) for c in df.columns):
        df = _wide_to_long_t1(df)
    df["COG"] = normalize_cog(df["Code de la commune"])
    df["N°Liste"] = pd.to_numeric(df.get("N°Liste", pd.Series(dtype=float)), errors="coerce").fillna(0).astype(int)
    return df


def load_sortants(path: Path) -> pd.DataFrame:
    df = load_csv(path)
    rename_map = {
        "Code commune":          "Code de la commune",
        "Code de la collectivité": "Code de la collectivité",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    if "Code de la commune" not in df.columns:
        # Essai avec le code collectivité (format "COM13055")
        if "Code de la collectivité" in df.columns:
            df["Code de la commune"] = df["Code de la collectivité"].str.replace("COM", "", regex=False)
    df["COG"] = normalize_cog(df.get("Code de la commune", pd.Series(dtype=str)))
    return df


def load_insee(path: Path) -> pd.DataFrame:
    df = load_csv(path)
    # Gestion des variantes de nom de colonne
    if "CODGEO" not in df.columns and "COM" in df.columns:
        df = df.rename(columns={"COM": "CODGEO"})
    df["COG"] = normalize_cog(df["CODGEO"])
    csp_cols = [c for c in df.columns if c.startswith("CS1_")]
    for c in csp_cols:
        df[c] = pd.to_numeric(df[c].astype(str).str.replace(",", "."), errors="coerce").fillna(0)
    return df


def load_coords(path: Path) -> dict:
    """Charge un CSV lat/lon par commune. Colonnes attendues: COG, lat, lon."""
    df = load_csv(path)
    df["COG"] = normalize_cog(df.get("COG", df.get("CODGEO", df.iloc[:,0])))
    df["lat"] = pd.to_numeric(df["lat"].astype(str).str.replace(",","."), errors="coerce")
    df["lon"] = pd.to_numeric(df["lon"].astype(str).str.replace(",","."), errors="coerce")
    return df.set_index("COG")[["lat","lon"]].to_dict("index")


# ─────────────────────────────────────────────────────────────
#  ÉTAPE 2 — AGRÉGATION BUREAUX DE VOTE
# ─────────────────────────────────────────────────────────────

def aggregate_bv(df_t1: pd.DataFrame) -> pd.DataFrame:
    """
    Une ligne par bureau de vote avec :
    - Métriques de participation
    - Voix de chaque liste (colonnes voix_liste_1 … voix_liste_N)
    """
    log.info("Agrégation des résultats par bureau de vote…")

    # Métriques de participation (identiques pour toutes les listes d'un même BV)
    bv_cols = ["COG", "Code du département", "Libellé de la commune", "Code du b/vote"]
    meta_cols = ["Inscrits", "Abstentions", "Votants", "Exprimés", "Blancs", "Nuls"]
    available_meta = [c for c in meta_cols if c in df_t1.columns]

    bv_meta = (
        df_t1.groupby(bv_cols)[available_meta]
        .first()
        .reset_index()
    )

    bv_meta["taux_abstention"]    = (bv_meta["Abstentions"] / bv_meta["Inscrits"].replace(0, np.nan) * 100).round(2).fillna(0)
    bv_meta["taux_participation"] = (bv_meta["Votants"]     / bv_meta["Inscrits"].replace(0, np.nan) * 100).round(2).fillna(0)
    bv_meta["taux_exprimes"]      = (bv_meta["Exprimés"]    / bv_meta["Votants"].replace(0, np.nan)  * 100).round(2).fillna(0)
    bv_meta["nb_listes"]          = df_t1.groupby(bv_cols)["N°Liste"].max().values

    # Voix par liste → pivot
    voix_pivot = (
        df_t1.pivot_table(
            index=bv_cols,
            columns="N°Liste",
            values="Voix",
            aggfunc="first",
        )
        .fillna(0)
        .astype(int)
        .reset_index()
    )
    voix_pivot.columns.name = None
    liste_cols = [c for c in voix_pivot.columns if isinstance(c, (int, np.integer))]
    voix_pivot = voix_pivot.rename(columns={c: f"voix_liste_{c}" for c in liste_cols})

    bv = bv_meta.merge(voix_pivot, on=bv_cols, how="left")

    # Colonne liste des voix (tableau JSON friendly)
    vl_cols = sorted([c for c in bv.columns if c.startswith("voix_liste_")],
                     key=lambda x: int(x.split("_")[-1]))
    bv["voix_listes"] = bv[vl_cols].values.tolist()

    log.info(f"  → {len(bv)} bureaux de vote")
    return bv


# ─────────────────────────────────────────────────────────────
#  ÉTAPE 3 — ENRICHISSEMENT PAR COMMUNE
# ─────────────────────────────────────────────────────────────

def enrich_listes(df_bv: pd.DataFrame, df_listes: pd.DataFrame) -> pd.DataFrame:
    """Ajoute le nombre de listes et les nuances par commune."""
    log.info("Enrichissement : listes candidates…")

    listes_com = (
        df_listes.groupby("COG")
        .agg(
            nb_listes_com=("N°Liste", "nunique"),
            nuances=(
                "Nuance Liste",
                lambda x: sorted(x.dropna().unique().tolist())
            ),
        )
        .reset_index()
    )

    # Si la colonne nb_listes n'est pas encore dans df_bv, on l'ajoute depuis les listes
    df_bv = df_bv.merge(listes_com, on="COG", how="left")

    # Réconciliation : utiliser nb_listes_com si disponible, sinon garder nb_listes T1
    df_bv["nb_listes"] = df_bv["nb_listes_com"].fillna(df_bv["nb_listes"]).astype(int)
    df_bv["nuances"]   = df_bv["nuances"].apply(lambda v: v if isinstance(v, list) else [])

    log.info(f"  → moy. {df_bv['nb_listes'].mean():.1f} listes/commune")
    return df_bv


def enrich_sortants(df_bv: pd.DataFrame, df_sortants: pd.DataFrame) -> pd.DataFrame:
    """Indique si le maire sortant s'est représenté (présence dans le RNE)."""
    log.info("Enrichissement : sortants RNE…")

    # Filtre sur les maires (fonction 01 = Maire)
    col_fonction = "Libellé de la fonction" if "Libellé de la fonction" in df_sortants.columns else None
    col_code_fonc = "Code de la fonction" if "Code de la fonction" in df_sortants.columns else None

    if col_fonction:
        maires = df_sortants[df_sortants[col_fonction].str.contains("Maire", na=False, case=False)]
    elif col_code_fonc:
        maires = df_sortants[df_sortants[col_code_fonc] == "01"]
    else:
        maires = df_sortants  # fallback : tous les élus sortants

    communes_avec_sortant = set(maires["COG"].unique())
    df_bv["sortant_present"] = df_bv["COG"].isin(communes_avec_sortant)

    n_avec = df_bv.drop_duplicates("COG")["sortant_present"].sum()
    n_total = df_bv["COG"].nunique()
    log.info(f"  → sortant présent dans {n_avec}/{n_total} communes ({n_avec/n_total*100:.0f}%)")
    return df_bv


def enrich_csp(df_bv: pd.DataFrame, df_insee: pd.DataFrame) -> pd.DataFrame:
    """Ajoute la CSP dominante et le profil complet par commune."""
    log.info("Enrichissement : CSP INSEE RP2022…")

    csp_cols = [c for c in df_insee.columns if c.startswith("CS1_")]
    if not csp_cols:
        log.warning("  ⚠ Aucune colonne CS1_* trouvée dans l'INSEE — CSP ignorée")
        df_bv["csp_dominante"]  = "Inconnue"
        df_bv["csp_scores"]     = [{}] * len(df_bv)
        return df_bv

    df_insee["csp_dominante"] = (
        df_insee[csp_cols]
        .apply(lambda row: row.idxmax(), axis=1)
        .map(CSP_LABELS)
        .fillna("Inconnue")
    )
    df_insee["csp_scores"] = df_insee[csp_cols].apply(
        lambda row: {CSP_LABELS.get(k, k): round(float(row[k]), 1) for k in csp_cols},
        axis=1,
    )

    df_bv = df_bv.merge(
        df_insee[["COG", "csp_dominante", "csp_scores"]],
        on="COG",
        how="left",
    )
    df_bv["csp_dominante"] = df_bv["csp_dominante"].fillna("Inconnue")
    df_bv["csp_scores"]    = df_bv["csp_scores"].apply(lambda v: v if isinstance(v, dict) else {})

    log.info(f"  → Distribution CSP : {df_bv.drop_duplicates('COG')['csp_dominante'].value_counts().to_dict()}")
    return df_bv


def enrich_coords(df_bv: pd.DataFrame, coords: dict, rng: np.random.Generator) -> pd.DataFrame:
    """
    Ajoute lat/lon par bureau de vote.
    - Utilise le fichier de coordonnées si fourni
    - Sinon fallback sur les coordonnées approximatives de la commune
    - Ajoute un bruit aléatoire pour disperser les BV d'une même commune
    """
    log.info("Enrichissement : coordonnées géographiques…")

    def get_lat(row):
        c = coords.get(row["COG"])
        if c:
            return c["lat"]
        return COORDS_FALLBACK.get(row["COG"], (46.5, 2.3))[0]

    def get_lon(row):
        c = coords.get(row["COG"])
        if c:
            return c["lon"]
        return COORDS_FALLBACK.get(row["COG"], (46.5, 2.3))[1]

    df_bv["lat_base"] = df_bv.apply(get_lat, axis=1)
    df_bv["lon_base"] = df_bv.apply(get_lon, axis=1)

    # Dispersion aléatoire reproductible, par (COG, num_bv) unique.
    # On calcule le bruit une seule fois par bureau physique pour que T1 et T2
    # du même bureau apparaissent au même endroit sur la carte.
    bv_key = df_bv["COG"].astype(str) + "_" + df_bv["Code du b/vote"].astype(str)
    unique_keys = bv_key.unique()
    noise = {
        k: (rng.uniform(-0.012, 0.012), rng.uniform(-0.018, 0.018))
        for k in unique_keys
    }
    df_bv["lat"] = (df_bv["lat_base"] + bv_key.map(lambda k: noise[k][0])).round(5)
    df_bv["lon"] = (df_bv["lon_base"] + bv_key.map(lambda k: noise[k][1])).round(5)
    df_bv = df_bv.drop(columns=["lat_base", "lon_base"])

    return df_bv


# ─────────────────────────────────────────────────────────────
#  ÉTAPE 4 — EXPORT JSON
# ─────────────────────────────────────────────────────────────

def _safe_float(v, default: float = 0.0) -> float:
    """Convertit en float en remplaçant NaN/Inf par default (évite JSON invalide)."""
    try:
        f = float(v)
        return default if (np.isnan(f) or np.isinf(f)) else f
    except (TypeError, ValueError):
        return default


def export_json(df_bv: pd.DataFrame, output_dir: Path) -> None:
    """Exporte le JSON final compatible avec la carte interactive."""
    log.info("Export JSON…")

    records = []
    for i, row in df_bv.iterrows():
        rec = {
            "bv_id":          int(i + 1),
            "tour":           int(row.get("tour", 1)),
            "code_dept":      str(row.get("Code du département", "")).strip(),
            "code_commune":   str(row["COG"]),
            "nom_commune":    str(row.get("Libellé de la commune", "")).strip(),
            "num_bv":         str(row["Code du b/vote"]).strip(),
            "inscrits":       int(row.get("Inscrits", 0)),
            "votants":        int(row.get("Votants", 0)),
            "abstentions":    int(row.get("Abstentions", 0)),
            "taux_abstention":    _safe_float(row.get("taux_abstention", 0)),
            "taux_participation": _safe_float(row.get("taux_participation", 0)),
            "exprimes":       int(row.get("Exprimés", 0)),
            "blancs_nuls":    int(row.get("Blancs", 0)) + int(row.get("Nuls", 0)),
            "nb_listes":      int(row.get("nb_listes", 0)),
            "nuances":        row.get("nuances", []),
            "sortant_present": bool(row.get("sortant_present", False)),
            "csp_dominante":  str(row.get("csp_dominante", "Inconnue")),
            "csp_scores":     row.get("csp_scores", {}),
            "voix_listes":    [int(v) for v in row.get("voix_listes", [])],
            "lat":            _safe_float(row.get("lat", 46.5), 46.5),
            "lon":            _safe_float(row.get("lon",  2.3),  2.3),
        }
        records.append(rec)

    output_dir.mkdir(parents=True, exist_ok=True)

    # JSON principal (carte interactive)
    out_json = output_dir / "bureaux_vote_final.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))
    log.info(f"  → {out_json}  ({out_json.stat().st_size / 1024:.0f} Ko)")

    # CSV de synthèse par commune et par tour
    commune_agg = (
        df_bv.groupby(["tour", "COG", "Libellé de la commune"])
        .agg(
            nb_bv         =("Code du b/vote", "count"),
            inscrits      =("Inscrits", "sum"),
            votants       =("Votants", "sum"),
            abstentions   =("Abstentions", "sum"),
            exprimes      =("Exprimés", "sum"),
            nb_listes     =("nb_listes", "first"),
            sortant       =("sortant_present", "first"),
            csp_dominante =("csp_dominante", "first"),
        )
        .reset_index()
    )
    commune_agg["taux_abstention"] = (commune_agg["abstentions"] / commune_agg["inscrits"] * 100).round(2)
    out_csv = output_dir / "communes_syntese.csv"
    commune_agg.to_csv(out_csv, sep=";", index=False, encoding="utf-8-sig")
    log.info(f"  → {out_csv}  ({out_csv.stat().st_size / 1024:.0f} Ko)")

    # Statistiques de corrélation
    log.info("\n══ STATISTIQUES CLÉS ══")
    log.info(f"  Communes traitées  : {df_bv['COG'].nunique()}")
    log.info(f"  Bureaux de vote    : {len(df_bv)}")
    log.info(f"  Inscrits total     : {df_bv['Inscrits'].sum():,.0f}")
    log.info(f"  Abstention moyenne : {df_bv['taux_abstention'].mean():.2f}%")
    log.info(f"  Min abstention BV  : {df_bv['taux_abstention'].min():.2f}%")
    log.info(f"  Max abstention BV  : {df_bv['taux_abstention'].max():.2f}%")

    # Corrélation abstention × nb listes
    com = df_bv.drop_duplicates("COG")
    r = com["taux_abstention"].corr(com["nb_listes"])
    log.info(f"  Corrélation abstention/nb_listes : r = {r:.3f}")

    # Abstention par CSP
    log.info("  Abstention par CSP dominante :")
    for csp, grp in com.groupby("csp_dominante")["taux_abstention"]:
        log.info(f"    {csp:<28} {grp.mean():.2f}%")

    # Impact du sortant
    avec = com[com["sortant_present"]]["taux_abstention"].mean()
    sans = com[~com["sortant_present"]]["taux_abstention"].mean()
    log.info(f"  Abstention sortant présent : {avec:.2f}%  |  absent : {sans:.2f}%  |  Δ = {sans-avec:+.2f} pts")


# ─────────────────────────────────────────────────────────────
#  POINT D'ENTRÉE
# ─────────────────────────────────────────────────────────────

def main(data_dir: str, output_dir: str, download: bool = False, seed: int = 42) -> None:
    data_dir   = Path(data_dir)
    output_dir = Path(output_dir)
    rng        = np.random.default_rng(seed)

    log.info("══ Élections Municipales 2026 — Pipeline de données ══")

    # 0. Téléchargement auto
    if download:
        log.info("\n[0] Téléchargement des fichiers sources…")
        download_files(data_dir)

    # 1. Chargement
    log.info("\n[1] Chargement des sources…")

    # listes_candidates_t1.csv contient les résultats T1 par bureau (format large Ministère)
    path_t1       = data_dir / "listes_candidates_t1.csv"
    path_t2       = data_dir / "resultats_t2_bureaux.csv"   # optionnel
    path_listes   = data_dir / "listes_candidates_t1.csv"
    path_sortants = data_dir / "sortants_rne.csv"
    path_insee    = data_dir / "insee_csp_communes.csv"
    path_coords   = data_dir / "coords_communes.csv"   # optionnel

    for p in [path_t1, path_listes, path_sortants, path_insee]:
        if not p.exists():
            log.error(f"Fichier manquant : {p}")
            log.error("Téléchargez-le depuis data.gouv.fr ou lancez avec --download")
            sys.exit(1)

    df_t1       = load_t1(path_t1)
    df_listes   = load_listes(path_listes)
    df_sortants = load_sortants(path_sortants)
    df_insee    = load_insee(path_insee)

    coords = {}
    if not path_coords.exists():
        log.info("  coords_communes.csv absent → tentative de récupération automatique…")
        fetch_commune_coords(path_coords)
    if path_coords.exists():
        coords = load_coords(path_coords)
        log.info(f"  Coordonnées chargées pour {len(coords)} communes")
    else:
        log.warning("  Coordonnées indisponibles → positions approximatives (centre France)")

    # 2. Agrégation BV
    log.info("\n[2] Agrégation par bureau de vote…")
    df_bv_t1 = aggregate_bv(df_t1)
    df_bv_t1["tour"] = 1
    df_bv_t1 = enrich_listes(df_bv_t1, df_listes)

    if path_t2.exists():
        log.info("  Chargement T2…")
        df_t2 = load_t1(path_t2)   # même format que T1
        df_bv_t2 = aggregate_bv(df_t2)
        df_bv_t2["tour"] = 2
        df_bv_t2 = enrich_listes(df_bv_t2, df_t2)   # nuances issues du fichier T2 lui-même
        df_bv = pd.concat([df_bv_t1, df_bv_t2], ignore_index=True)
        log.info(f"  T1 : {len(df_bv_t1)} BV  |  T2 : {len(df_bv_t2)} BV  |  Total : {len(df_bv)} BV")
    else:
        log.warning(f"  {path_t2.name} absent — seul le T1 sera traité")
        df_bv = df_bv_t1

    # 3. Enrichissement
    log.info("\n[3] Enrichissement…")
    df_bv = enrich_sortants(df_bv, df_sortants)
    df_bv = enrich_csp(df_bv, df_insee)
    df_bv = enrich_coords(df_bv, coords, rng)

    # 4. Export
    log.info("\n[4] Export…")
    export_json(df_bv, output_dir)

    log.info("\n✅ Pipeline terminé avec succès.")
    log.info(f"   → Injectez {output_dir}/bureaux_vote_final.json dans la carte HTML.")


# ─────────────────────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Pipeline données Municipales 2026 → JSON carte interactive"
    )
    parser.add_argument(
        "--data-dir", default="./data",
        help="Dossier contenant les CSV sources (défaut : ./data)"
    )
    parser.add_argument(
        "--output", default="./output",
        help="Dossier de sortie du JSON (défaut : ./output)"
    )
    parser.add_argument(
        "--download", action="store_true",
        help="Télécharger automatiquement les fichiers depuis data.gouv.fr"
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Graine aléatoire pour la dispersion des coordonnées (défaut : 42)"
    )
    args = parser.parse_args()
    main(args.data_dir, args.output, args.download, args.seed)
