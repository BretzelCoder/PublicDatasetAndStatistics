# Élections Municipales 2026 — Carte interactive

Analyse et visualisation des résultats des élections municipales françaises de mars 2026.  
Corrélation **abstention × CSP × nombre de listes × présence du sortant**, à l'échelle du bureau de vote.

## Structure du projet

```
elections-municipales-2026/
├── data/
│   ├── raw/              # Fichiers sources (non versionnés si > 10 Mo)
│   │   ├── resultats_t1_bureaux.csv      # Ministère de l'Intérieur
│   │   ├── listes_candidates_t1.csv
│   │   ├── sortants_rne.csv              # RNE — élus sortants
│   │   └── insee_csp_communes.csv        # INSEE RP2022
│   └── processed/
│       ├── bureaux_vote_final.json       # Produit par le pipeline
│       └── communes_syntese.csv
├── src/
│   └── pipeline.py       # Pipeline de traitement des données
├── viz/
│   └── carte.html        # Carte interactive (standalone)
├── docs/
│   └── sources.md        # URLs et descriptions des sources
├── .vscode/              # Config VS Code
├── requirements.txt
└── README.md
```

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/TON_USERNAME/elections-municipales-2026.git
cd elections-municipales-2026

# 2. Créer un environnement virtuel
python -m venv .venv
source .venv/bin/activate       # Linux/Mac
.venv\Scripts\activate          # Windows

# 3. Installer les dépendances
pip install -r requirements.txt
```

## Télécharger les données

Les fichiers sources volumineux ne sont pas versionnés. Téléchargez-les manuellement depuis data.gouv.fr (voir `docs/sources.md`) et placez-les dans `data/raw/`, ou laissez le pipeline les télécharger :

```bash
python src/pipeline.py --data-dir data/raw --output data/processed --download
```

## Lancer le pipeline

```bash
# Avec VS Code : Ctrl+Shift+B → "Lancer le pipeline"
# Ou en terminal :
python src/pipeline.py --data-dir data/raw --output data/processed
```

Le pipeline produit `data/processed/bureaux_vote_final.json`.

## Visualiser la carte

```bash
# Serveur local (Task VS Code ou terminal)
python -m http.server 8080

# Ouvrir dans le navigateur
open http://localhost:8080/viz/carte.html
```

Pour les données de test embarquées, ouvrir `viz/carte.html` directement dans le navigateur.

## Sources des données

| Fichier | Source | Licence |
|---------|--------|---------|
| Résultats T1/T2 BV | [data.gouv.fr — Ministère de l'Intérieur](https://www.data.gouv.fr/datasets/elections-municipales-2026-resultats-du-premier-tour) | Licence Ouverte 2.0 |
| Listes candidates | [data.gouv.fr — Ministère de l'Intérieur](https://www.data.gouv.fr/datasets/elections-municipales-2026-listes-candidates-au-premier-tour) | Licence Ouverte 2.0 |
| Élus sortants (RNE) | [data.gouv.fr — DNUM](https://www.data.gouv.fr/datasets/elections-municipales-2026-maires-et-conseillers-municipaux-sortants) | Licence Ouverte 2.0 |
| CSP par commune | [INSEE RP2022](https://www.insee.fr/fr/statistiques/7704076) | Licence Ouverte 2.0 |

## Contribuer

1. Fork le repo
2. Crée une branche : `git checkout -b feature/ma-fonctionnalite`
3. Commit : `git commit -m "feat: description"`
4. Push : `git push origin feature/ma-fonctionnalite`
5. Ouvre une Pull Request
