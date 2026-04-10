# Sources des données

## Ministère de l'Intérieur

### Résultats T1 (15 mars 2026)
- **Page** : https://www.data.gouv.fr/datasets/elections-municipales-2026-resultats-du-premier-tour
- **Fichier BV téléchargé** : `bc9bca84-beb4-4525-b79a-23ecca48d86e` → `data/raw/resultats_t1_bureaux.csv` (~34 Mo)
  - Titre data.gouv.fr : « Municipales 2026 - Candidats Elus - Tour 1 »
  - Contient les résultats par bureau de vote avec `Code du b/vote`, `Inscrits`, `Abstentions`, `N°Liste`, `Nuance Liste`, `Voix`
- **Fichier communes** : `4feeef01-24f7-4d5a-914f-8aa806f31ec2` (non téléchargé, agrégation par commune)
- **Colonnes clés** : `Code du département`, `Code de la commune`, `Code du b/vote`, `Inscrits`, `Abstentions`, `N°Liste`, `Nuance Liste`, `Voix`

### Résultats T2 (22 mars 2026)
- **Page** : https://www.data.gouv.fr/datasets/elections-municipales-2026-resultats-du-second-tour
- **Fichier BV téléchargé** : `ac97f1d2-64b3-453e-90e6-485913aabd04` → `data/raw/resultats_t2_bureaux.csv` (~10 Mo)
  - Titre data.gouv.fr : « Municipales 2026 - Résultats - Bureau de vote »
- **Autres fichiers disponibles** (non téléchargés) :
  - `6ff67a28` — Résultats communes
  - `ddd5a822` — Candidats Élus France entière Tour 2

### Listes candidates T1
- **Page** : https://www.data.gouv.fr/datasets/elections-municipales-2026-listes-candidates-au-premier-tour
- **Fichier téléchargé** : `1428132c-ad5e-437e-a928-7c2a254e40eb` → `data/raw/listes_candidates_t1.csv` (~36 Mo)
  - Titre data.gouv.fr : « Municipales 2026 - Résultats - BV par communes »
  - Utilisé comme fichier de listes candidates par le pipeline
- **Colonnes clés** : `Code de la commune`, `N°Liste`, `Nuance Liste`, `Nom Tête de Liste`

### Élus sortants (RNE)
- **Page** : https://www.data.gouv.fr/datasets/elections-municipales-2026-maires-et-conseillers-municipaux-sortants
- **Fichier maires téléchargé** : `c5026511-0a7f-4d79-9c2f-5c61376d2c0b` → `data/raw/sortants_rne.csv` (~3,9 Mo)
  - Nom d'origine : `mun2026-maires-sortants-20260227.csv` (extrait RNE au 27/02/2026)
  - Le pipeline filtre sur `Libellé de la fonction` contenant « Maire » (code fonction 01)
- **Fichier conseillers** : `bfb340ee-5068-4706-b07c-1ab7b0e2fd5b` (~56,9 Mo, non téléchargé — non requis par le pipeline)
- **Colonnes clés** : `Code de la commune`, `Libellé de la fonction` (Maire = fonction 01)

## INSEE

### Recensement de la Population 2022 — CSP
- **Page utilisée** : https://www.insee.fr/fr/statistiques/8581696 (Évolution et structure de la population en 2022 — base communale)
- **Note** : La page indiquée dans les sources initiales (`/7704076`) pointe vers les données IRIS 2020 ; la page correcte pour les données communales 2022 est `/8581696`.
- **Fichier source téléchargé** : `base-cc-evol-struct-pop-2022_csv.zip` (46 Mo) → extrait et retraité
- **Fichier produit** : `data/raw/insee_csp_communes.csv` (~3,6 Mo, 34 903 communes)
- **Colonnes** : `CODGEO`, `CS1_1` à `CS1_8`
- **Jointure** : sur `CODGEO` = code INSEE commune 5 chars

#### ⚠ Note sur la nomenclature CSP

Le fichier RP2022 utilise la nouvelle nomenclature **PCS 2020** (colonnes `C22_POP15P_STAT_GSEC*`) pour les données 2022, incompatible avec le format `CS1_1`–`CS1_8` attendu par le pipeline.

Le fichier `data/raw/insee_csp_communes.csv` a été construit à partir des **colonnes de comparaison 2016** (`C16_POP15P_CS1` à `C16_POP15P_CS8`) présentes dans la base RP2022, renommées en `CS1_1`–`CS1_8`. Il s'agit donc de données **2016** (population 15 ans et plus par catégorie socioprofessionnelle, 8 groupes PCS 2003).

Pour utiliser les données CSP 2022 natives, il faudrait adapter le pipeline pour lire les colonnes GSEC :
- `C22_POP15P_STAT_GSEC11_21` … `C22_POP15P_STAT_GSEC40`

### Coordonnées communes (optionnel)
- **Source** : Base Adresse Nationale (BAN)
- **URL** : https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/
- **Alternative** : https://www.data.gouv.fr/datasets/communes-de-france-base-des-codes-postaux/
- **Fichier attendu** : `data/raw/coords_communes.csv` (non téléchargé — le pipeline utilise un fallback sur 15 grandes villes)

## Résumé des fichiers téléchargés

| Fichier | Taille | Source (ID data.gouv.fr / URL) | Date |
|---------|--------|-------------------------------|------|
| `resultats_t1_bureaux.csv` | 34 Mo | `bc9bca84` | 09/04/2026 |
| `listes_candidates_t1.csv` | 36 Mo | `1428132c` | 09/04/2026 |
| `resultats_t2_bureaux.csv` | 10 Mo | `ac97f1d2` | 09/04/2026 |
| `sortants_rne.csv` | 3,9 Mo | `c5026511` | 09/04/2026 |
| `insee_csp_communes.csv` | 3,6 Mo | base-cc-evol-struct-pop-2022 (INSEE `/8581696`) | 09/04/2026 |

## Notes techniques

- Le **code INSEE commune** (COG) est sur **5 caractères** : ex. `13055`, `75056`
- Le Ministère de l'Intérieur utilise parfois le code à 3 chiffres seul (ex. `055`) — le pipeline normalise automatiquement
- Les fichiers du Ministère utilisent `;` comme séparateur et `,` comme décimale
- Encodage : `utf-8-sig` (avec BOM) ou `latin-1` selon les années
- Le fichier `insee_csp_communes.csv` est encodé en `utf-8-sig` avec `;` comme séparateur
