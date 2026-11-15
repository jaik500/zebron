/**
 * ZEBRON COURSE SEED
 * Course: Mathématiques fondamentales
 * Language: French
 * Audience: Programming, Data Science and AI learners
 *
 * Dry run:
 * node scripts/mathematics-foundations/seed-mathematiques-fondamentales.mjs
 *
 * Apply:
 * node scripts/mathematics-foundations/seed-mathematiques-fondamentales.mjs --apply
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const COURSE_ID = "mathematiques-fondamentales";

const APPLY = process.argv.includes("--apply");
const OVERWRITE = process.argv.includes("--overwrite");

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

// ================================================
// LESSON BLOCK HELPERS
// ================================================

const text = (value) => ({
  type: "text",
  text: value.trim(),
});

const check = (question, options, answer, explanation) => ({
  type: "check",
  question,
  options,
  answer,
  explanation,
});

const lesson = (
  id,
  title,
  minutes,
  content,
  question,
  options,
  answer,
  explanation
) => ({
  id,
  title,
  minutes,
  blocks: [
    text(content),
    check(question, options, answer, explanation),
  ],
});

const moduleData = (id, title, lessons) => ({
  id,
  title,
  lessons,
});

// ================================================
// COURSE MODULES
// ================================================

const MODULES = [

  // MODULE 1
  moduleData(
    "introduction-mathematiques",
    "Introduction aux mathématiques",
    [

      lesson(
        "nombres-et-symboles",
        "Comprendre les nombres et les symboles",
        10,
        `
Les mathématiques permettent de représenter des quantités,
de comparer des valeurs et de résoudre des problèmes.

Les principaux ensembles de nombres comprennent :

- Les nombres naturels : 0, 1, 2, 3...
- Les nombres entiers : ..., -2, -1, 0, 1, 2...
- Les nombres décimaux : 2,5 ; 3,75 ; 10,25.
- Les nombres rationnels : les nombres représentés sous
  forme de fraction.

Les symboles mathématiques les plus courants sont :

+ : addition
- : soustraction
× : multiplication
÷ : division
= : égalité
≠ : différence
> : supérieur à
< : inférieur à

En informatique, les nombres représentent les utilisateurs,
les transactions, les scores et les quantités de données.
        `,
        "Quel symbole représente une égalité ?",
        ["+", "=", "×", ">"],
        1,
        "Le symbole = indique que deux expressions ont la même valeur."
      ),

      lesson(
        "operations-fondamentales",
        "Les quatre opérations fondamentales",
        12,
        `
Les quatre opérations fondamentales sont :

1. Addition : 8 + 4 = 12
2. Soustraction : 15 - 6 = 9
3. Multiplication : 4 × 3 = 12
4. Division : 20 ÷ 5 = 4

Exemple pratique :

Une plateforme possède 6 cours.
Chaque cours contient 5 leçons.

Nombre total de leçons :

6 × 5 = 30

Les opérations mathématiques sont utilisées dans les
statistiques, les algorithmes et les applications d'IA.
        `,
        "Une plateforme possède 4 cours de 6 leçons chacun. Combien y a-t-il de leçons ?",
        ["10", "18", "24", "30"],
        2,
        "4 × 6 = 24 leçons."
      ),

      lesson(
        "ordre-des-operations",
        "L'ordre des opérations",
        12,
        `
Lorsque plusieurs opérations apparaissent dans une expression,
il faut respecter un ordre précis.

L'ordre habituel est :

1. Parenthèses.
2. Exposants et puissances.
3. Multiplication et division.
4. Addition et soustraction.

Exemple :

5 + 2 × 3

On commence par la multiplication :

2 × 3 = 6

Puis l'addition :

5 + 6 = 11

Avec des parenthèses :

(5 + 2) × 3 = 21

Les langages de programmation appliquent également
des règles de priorité entre les opérateurs.
        `,
        "Quel est le résultat de 5 + 2 × 3 ?",
        ["21", "11", "15", "13"],
        1,
        "La multiplication est prioritaire : 5 + 6 = 11."
      ),

    ]
  ),

  // MODULE 2
  moduleData(
    "arithmetique",
    "Arithmétique fondamentale",
    [

      lesson(
        "addition-soustraction",
        "Addition et soustraction",
        10,
        `
L'addition permet de réunir plusieurs quantités.

Exemple :

125 + 75 = 200

La soustraction permet de calculer une différence.

Exemple :

200 - 45 = 155

Une soustraction peut être vérifiée par une addition :

155 + 45 = 200

Application :

Une plateforme possède 200 places.
45 places sont déjà occupées.

200 - 45 = 155 places disponibles.
        `,
        "Combien vaut 250 + 175 ?",
        ["375", "425", "450", "325"],
        1,
        "250 + 175 = 425."
      ),

      lesson(
        "multiplication-division",
        "Multiplication et division",
        12,
        `
La multiplication représente une addition répétée.

12 × 8 = 96

La division permet de partager une quantité.

96 ÷ 12 = 8

Une division peut également avoir un reste.

17 ÷ 5 = 3 reste 2

En programmation, l'opérateur modulo (%) permet
de récupérer le reste d'une division.

Exemple Python :

17 % 5 = 2

Le modulo permet notamment de vérifier si un nombre
est pair ou impair.
        `,
        "Quel est le reste de 23 ÷ 5 ?",
        ["2", "3", "4", "5"],
        1,
        "5 × 4 = 20, et 23 - 20 = 3."
      ),

      lesson(
        "calcul-mental",
        "Techniques de calcul mental",
        10,
        `
Le calcul mental permet d'effectuer rapidement des opérations.

Exemple :

48 + 27

On décompose :

48 + 20 + 7

68 + 7 = 75

Multiplier par 10 :

34 × 10 = 340

On peut aussi utiliser le double et la moitié.

Exemple :

25 × 16

25 × 8 = 200

200 × 2 = 400

Ces techniques sont utiles pour estimer des coûts,
des temps de traitement et des quantités.
        `,
        "Combien vaut 48 + 27 ?",
        ["65", "75", "85", "95"],
        1,
        "48 + 20 = 68, puis 68 + 7 = 75."
      ),

    ]
  ),

  // MODULE 3
  moduleData(
    "fractions-decimaux",
    "Fractions et nombres décimaux",
    [

      lesson(
        "comprendre-fractions",
        "Comprendre les fractions",
        12,
        `
Une fraction représente une partie d'un tout.

Elle possède deux éléments :

- Le numérateur : le nombre situé au-dessus.
- Le dénominateur : le nombre situé en dessous.

Exemple :

3/4

Le numérateur est 3.
Le dénominateur est 4.

Les fractions équivalentes représentent la même quantité.

1/2 = 2/4 = 3/6

Application :

Si 3 personnes sur 4 terminent une formation,
la proportion est de 3/4.
        `,
        "Dans la fraction 5/8, quel est le dénominateur ?",
        ["5", "8", "13", "3"],
        1,
        "Le dénominateur est le nombre situé sous la barre."
      ),

      lesson(
        "operations-fractions",
        "Opérations sur les fractions",
        12,
        `
Addition avec le même dénominateur :

2/7 + 3/7 = 5/7

Soustraction :

5/8 - 2/8 = 3/8

Multiplication :

2/3 × 3/4 = 6/12 = 1/2

Division :

2/3 ÷ 4/5

On multiplie par l'inverse de la deuxième fraction :

2/3 × 5/4 = 10/12 = 5/6

Simplifie toujours une fraction lorsque cela est possible.
        `,
        "Combien vaut 2/5 + 1/5 ?",
        ["1/5", "2/10", "3/5", "3/10"],
        2,
        "2/5 + 1/5 = 3/5."
      ),

      lesson(
        "nombres-decimaux",
        "Comprendre les nombres décimaux",
        10,
        `
Un nombre décimal possède une partie entière et une partie
fractionnaire.

Exemple :

12,75

12 représente la partie entière.
75 représente les centièmes.

Conversions :

1/2 = 0,5
1/4 = 0,25
3/4 = 0,75

Addition :

12,50 + 7,25 = 19,75

En programmation Python, on utilise un point comme
séparateur décimal :

12.75
        `,
        "Quelle est la représentation décimale de 1/4 ?",
        ["0,10", "0,20", "0,25", "0,50"],
        2,
        "1 divisé par 4 donne 0,25."
      ),

    ]
  ),

  // MODULE 4
  moduleData(
    "pourcentages-proportions",
    "Pourcentages et proportions",
    [

      lesson(
        "calcul-pourcentages",
        "Calculer les pourcentages",
        12,
        `
Un pourcentage représente une proportion sur 100.

50 % signifie 50 sur 100.

50/100 = 0,5

Pour calculer 20 % de 200 :

200 × 20/100 = 40

Exemple :

Une formation contient 40 leçons.
Un apprenant termine 30 leçons.

Son taux de progression est :

30/40 × 100 = 75 %

Les pourcentages sont utilisés pour analyser les taux
de réussite, les taux d'erreur et les performances.
        `,
        "Combien représentent 25 % de 200 ?",
        ["25", "40", "50", "75"],
        2,
        "200 × 25/100 = 50."
      ),

      lesson(
        "ratios-proportions",
        "Ratios et proportions",
        12,
        `
Un ratio compare deux quantités.

Exemple :

10 garçons et 15 filles.

Le ratio garçons/filles est :

10:15

En simplifiant :

2:3

Une proportion exprime une relation entre deux rapports.

Exemple :

2/4 = 4/8

Application :

Une application reçoit 100 demandes.
60 sont acceptées et 40 sont refusées.

Le ratio est :

60:40 = 3:2
        `,
        "Quel est le ratio simplifié de 12 à 18 ?",
        ["2:3", "3:2", "4:5", "6:9"],
        0,
        "12 et 18 sont divisibles par 6 : 2:3."
      ),

      lesson(
        "applications-pourcentages",
        "Applications pratiques des pourcentages",
        10,
        `
Les pourcentages apparaissent dans de nombreuses situations.

Réduction :

Un produit coûte 80 euros.
Une réduction de 25 % est appliquée.

Réduction :

80 × 0,25 = 20 euros

Prix final :

80 - 20 = 60 euros

Croissance :

Une application possède 100 utilisateurs.
Le nombre augmente de 20 %.

100 × 1,20 = 120 utilisateurs.

Taux d'erreur :

20 opérations échouent sur 1 000.

20/1000 × 100 = 2 %
        `,
        "Un prix de 100 euros diminue de 20 %. Quel est le nouveau prix ?",
        ["20 euros", "70 euros", "80 euros", "120 euros"],
        2,
        "100 - 20 % de 100 = 80 euros."
      ),

    ]
  ),

];

// END OF SECTION 1
// ================================================
// MODULE 5 — NOMBRES RELATIFS
// ================================================

MODULES.push(
  moduleData(
    "nombres-relatifs",
    "Nombres relatifs",
    [
      lesson(
        "nombres-positifs-negatifs",
        "Nombres positifs et négatifs",
        10,
        `
Les nombres relatifs comprennent les nombres positifs,
les nombres négatifs et zéro.

Exemples :

- Positifs : 1, 5, 12
- Négatifs : -1, -5, -12
- Zéro : 0

Sur une droite numérique :

- Les nombres positifs se trouvent à droite de zéro.
- Les nombres négatifs se trouvent à gauche de zéro.

Exemple pratique :

Un compte possède un solde de 50 euros.
Une dépense de 70 euros est effectuée.

50 - 70 = -20

Le solde devient négatif : -20 euros.

En informatique, les nombres négatifs peuvent représenter
des températures, des variations ou des soldes.
        `,
        "Quel nombre est inférieur à zéro ?",
        ["5", "0", "-3", "12"],
        2,
        "-3 est un nombre négatif, donc inférieur à zéro."
      ),

      lesson(
        "operations-nombres-relatifs",
        "Opérations avec les nombres relatifs",
        12,
        `
Addition :

(+5) + (+3) = +8

(-5) + (-3) = -8

Pour des signes différents :

(-5) + (+8) = +3

Soustraction :

5 - 8 = -3

Multiplication :

(-4) × (+3) = -12

(-4) × (-3) = +12

Règle importante :

- Même signe pour une multiplication : résultat positif.
- Signes différents : résultat négatif.
        `,
        "Quel est le résultat de (-4) × (-5) ?",
        ["-20", "-9", "20", "9"],
        2,
        "Le produit de deux nombres négatifs est positif : 20."
      ),

      lesson(
        "valeur-absolue",
        "Valeur absolue et distance",
        10,
        `
La valeur absolue représente la distance entre un nombre
et zéro sur la droite numérique.

Elle est toujours positive ou égale à zéro.

Exemples :

|5| = 5

|-5| = 5

|0| = 0

La distance entre -3 et 4 est de 7 unités.

En programmation, la fonction abs() permet de calculer
la valeur absolue.

Exemple Python :

abs(-15)

Résultat :

15
        `,
        "Quelle est la valeur absolue de -12 ?",
        ["-12", "0", "12", "24"],
        2,
        "La distance entre -12 et zéro est de 12."
      ),
    ]
  )
);

// ================================================
// MODULE 6 — ALGÈBRE FONDAMENTALE
// ================================================

MODULES.push(
  moduleData(
    "algebre-fondamentale",
    "Algèbre fondamentale",
    [
      lesson(
        "variables-expressions",
        "Variables et expressions algébriques",
        12,
        `
L'algèbre utilise des lettres pour représenter des nombres
inconnus ou variables.

Exemple :

x + 5

La lettre x représente une valeur qui peut changer.

Si x = 3 :

x + 5 = 3 + 5 = 8

Une expression algébrique peut contenir :

- Des variables.
- Des nombres.
- Des opérations mathématiques.

Exemple :

3x + 2

Si x = 4 :

3 × 4 + 2 = 14

En programmation, les variables jouent un rôle similaire.
Elles permettent de stocker des valeurs réutilisables.
        `,
        "Si x = 6, combien vaut x + 4 ?",
        ["8", "10", "12", "24"],
        1,
        "On remplace x par 6 : 6 + 4 = 10."
      ),

      lesson(
        "equations-simples",
        "Résoudre des équations simples",
        12,
        `
Une équation est une égalité qui contient une inconnue.

Exemple :

x + 5 = 12

Pour trouver x, on soustrait 5 des deux côtés :

x = 12 - 5

x = 7

Autre exemple :

3x = 15

On divise les deux côtés par 3 :

x = 5

L'objectif est d'isoler l'inconnue tout en conservant
l'égalité.

Les équations sont utiles pour résoudre des problèmes
de calcul et construire des modèles mathématiques.
        `,
        "Quelle est la valeur de x dans x + 8 = 15 ?",
        ["5", "6", "7", "8"],
        2,
        "x = 15 - 8 = 7."
      ),

      lesson(
        "formules-algebriques",
        "Utiliser des formules algébriques",
        12,
        `
Une formule représente une relation mathématique.

Exemple : calcul de la distance.

Distance = vitesse × temps

Si un véhicule roule à 60 km/h pendant 2 heures :

Distance = 60 × 2

Distance = 120 km

Autre exemple : aire d'un rectangle.

Aire = longueur × largeur

Si la longueur est 8 cm et la largeur 4 cm :

Aire = 8 × 4 = 32 cm²

Les formules permettent de transformer des données
en résultats calculés.

En informatique, elles sont souvent traduites en expressions
dans le code.
        `,
        "Un rectangle mesure 10 cm de longueur et 3 cm de largeur. Quelle est son aire ?",
        ["13 cm²", "26 cm²", "30 cm²", "60 cm²"],
        2,
        "Aire = longueur × largeur = 10 × 3 = 30 cm²."
      ),
    ]
  )
);

// ================================================
// MODULE 7 — GÉOMÉTRIE ET MESURES
// ================================================

MODULES.push(
  moduleData(
    "geometrie-mesures",
    "Géométrie et mesures",
    [
      lesson(
        "formes-geometriques",
        "Formes géométriques fondamentales",
        10,
        `
La géométrie étudie les formes, les dimensions et les espaces.

Quelques formes importantes :

Carré :
Quatre côtés de même longueur.

Rectangle :
Quatre angles droits et des côtés opposés égaux.

Triangle :
Trois côtés et trois angles.

Cercle :
Ensemble des points situés à une distance fixe
d'un centre.

Ces formes sont utilisées en architecture, en conception
d'interfaces et en représentation graphique.
        `,
        "Combien de côtés possède un triangle ?",
        ["2", "3", "4", "5"],
        1,
        "Un triangle possède trois côtés."
      ),

      lesson(
        "perimetre-aire",
        "Périmètre et aire",
        12,
        `
Le périmètre représente la longueur totale du contour
d'une forme.

Pour un rectangle :

P = 2 × (longueur + largeur)

Exemple :

Longueur = 8 cm
Largeur = 3 cm

P = 2 × (8 + 3)

P = 22 cm

L'aire représente la surface occupée.

A = longueur × largeur

A = 8 × 3 = 24 cm²

Attention :

Le périmètre s'exprime en unités de longueur.
L'aire s'exprime en unités carrées.
        `,
        "Quel est le périmètre d'un rectangle de 6 cm sur 4 cm ?",
        ["10 cm", "20 cm", "24 cm", "48 cm"],
        1,
        "P = 2 × (6 + 4) = 20 cm."
      ),

      lesson(
        "unites-mesure",
        "Unités de mesure et conversions",
        10,
        `
Les unités permettent de mesurer des quantités.

Longueur :

1 kilomètre = 1 000 mètres

1 mètre = 100 centimètres

Masse :

1 kilogramme = 1 000 grammes

Temps :

1 heure = 60 minutes

1 minute = 60 secondes

Volume :

1 litre = 1 000 millilitres

En informatique, les unités sont également essentielles :

- Octet (B)
- Kilooctet (KB)
- Mégaoctet (MB)
- Gigaoctet (GB)

Il faut toujours vérifier l'unité utilisée avant
d'effectuer une comparaison ou un calcul.
        `,
        "Combien de centimètres y a-t-il dans 2 mètres ?",
        ["20", "100", "200", "2 000"],
        2,
        "1 mètre = 100 centimètres. Donc 2 mètres = 200 centimètres."
      ),
    ]
  )
);

// ================================================
// MODULE 8 — STATISTIQUES FONDAMENTALES
// ================================================

MODULES.push(
  moduleData(
    "statistiques-fondamentales",
    "Statistiques fondamentales",
    [
      lesson(
        "donnees-statistiques",
        "Comprendre les données statistiques",
        12,
        `
Les statistiques permettent de collecter, organiser,
résumer et interpréter des données.

Exemple :

Voici les notes de cinq apprenants :

10, 12, 14, 16, 18

Ces valeurs constituent un ensemble de données.

Les statistiques permettent de répondre à des questions :

- Quelle est la note moyenne ?
- Quelle est la valeur la plus fréquente ?
- Quelle est la valeur centrale ?
- Les résultats sont-ils très dispersés ?

Les statistiques sont essentielles en science des données
et en intelligence artificielle.
        `,
        "Quel ensemble représente des données statistiques ?",
        [
          "Une seule opinion",
          "Une collection de valeurs observées",
          "Une formule sans données",
          "Un titre de document"
        ],
        1,
        "Les statistiques analysent des collections de données observées."
      ),

      lesson(
        "moyenne-mediane-mode",
        "Moyenne, médiane et mode",
        14,
        `
La moyenne est obtenue en additionnant les valeurs
puis en divisant par leur nombre.

Exemple :

4, 6, 8

Moyenne = (4 + 6 + 8) / 3

Moyenne = 6

La médiane est la valeur centrale lorsque les données
sont classées.

Exemple :

2, 5, 8, 10, 15

Médiane = 8

Le mode est la valeur la plus fréquente.

Exemple :

2, 3, 3, 4, 5

Mode = 3

Ces trois mesures décrivent les données de façons différentes.
        `,
        "Quelle est la moyenne de 4, 6 et 8 ?",
        ["4", "5", "6", "8"],
        2,
        "(4 + 6 + 8) / 3 = 18 / 3 = 6."
      ),

      lesson(
        "dispersion-donnees",
        "Étendue et dispersion des données",
        12,
        `
La dispersion indique à quel point les données
sont éloignées les unes des autres.

L'étendue est la différence entre la valeur maximale
et la valeur minimale.

Exemple :

Données : 5, 8, 10, 12, 15

Maximum = 15
Minimum = 5

Étendue = 15 - 5 = 10

Une petite étendue indique que les valeurs sont relativement
proches.

Une grande étendue indique une plus grande variation.

D'autres mesures de dispersion existent, notamment
la variance et l'écart-type.

Ces mesures sont utilisées pour comprendre la variabilité
des données dans les projets d'intelligence artificielle.
        `,
        "Quelle est l'étendue des valeurs 3, 7, 9 et 15 ?",
        ["9", "10", "12", "15"],
        2,
        "Étendue = maximum - minimum = 15 - 3 = 12."
      ),
    ]
  )
);

// END OF SECTION 2

// ================================================
// MODULE 9 — PROBABILITÉS
// ================================================

MODULES.push(
  moduleData(
    "probabilites",
    "Probabilités",
    [
      lesson(
        "introduction-probabilites",
        "Introduction aux probabilités",
        12,
        `
Les probabilités permettent de mesurer la possibilité
qu'un événement se produise.

Une probabilité est comprise entre 0 et 1.

- 0 signifie que l'événement est impossible.
- 1 signifie que l'événement est certain.
- 0,5 représente une chance sur deux.

On peut également exprimer une probabilité en pourcentage.

Exemple :

Lorsqu'on lance une pièce équilibrée, il existe deux
résultats possibles : pile ou face.

La probabilité d'obtenir pile est :

P(pile) = 1 / 2 = 0,5 = 50 %

Les probabilités sont utilisées dans les prévisions,
les simulations et les systèmes d'intelligence artificielle.
        `,
        "Quelle est la probabilité d'obtenir pile avec une pièce équilibrée ?",
        ["0 %", "25 %", "50 %", "100 %"],
        2,
        "Une pièce équilibrée possède deux résultats équiprobables. La probabilité est donc de 1/2, soit 50 %."
      ),

      lesson(
        "evenements-aleatoires",
        "Événements aléatoires et résultats possibles",
        12,
        `
Une expérience aléatoire est une expérience dont le résultat
ne peut pas être connu avec certitude à l'avance.

Exemple : lancer un dé à six faces.

Les résultats possibles sont :

1, 2, 3, 4, 5 et 6.

Obtenir un nombre pair correspond à trois résultats possibles :

2, 4 et 6.

La probabilité d'obtenir un nombre pair est :

P(nombre pair) = 3 / 6 = 1 / 2 = 50 %

Pour calculer une probabilité simple, on utilise :

Probabilité = nombre de résultats favorables
              / nombre de résultats possibles

Cette formule suppose que les résultats sont équiprobables.
        `,
        "Quelle est la probabilité d'obtenir un 6 avec un dé équilibré à six faces ?",
        ["1/2", "1/3", "1/6", "6/6"],
        2,
        "Un seul résultat sur les six possibles correspond au nombre 6. La probabilité est donc 1/6."
      ),

      lesson(
        "probabilites-applications",
        "Applications des probabilités",
        12,
        `
Les probabilités sont utilisées dans de nombreux domaines.

En informatique :

Elles peuvent aider à simuler des événements aléatoires.

En science des données :

Elles permettent d'étudier l'incertitude et les tendances
dans les données.

En intelligence artificielle :

Les modèles peuvent produire des probabilités associées
à différentes prédictions.

Exemple :

Un modèle de classification analyse une image et produit :

- Chat : 0,85
- Chien : 0,10
- Oiseau : 0,05

Ces valeurs représentent les probabilités estimées
par le modèle pour chaque catégorie.

La probabilité la plus élevée correspond ici à la catégorie
« chat ».

Attention : une probabilité élevée ne garantit pas
que la prédiction est correcte.
        `,
        "Un modèle attribue 0,80 de probabilité à la catégorie « chat ». Que représente cette valeur ?",
        [
          "Une certitude absolue",
          "Une probabilité estimée de 80 %",
          "Une erreur de 80 %",
          "Le nombre d'images analysées"
        ],
        1,
        "0,80 correspond à 80 %. Il s'agit d'une probabilité estimée, et non d'une certitude."
      ),
    ]
  )
);

// ================================================
// MODULE 10 — MATHÉMATIQUES POUR L'INFORMATIQUE ET L'IA
// ================================================

MODULES.push(
  moduleData(
    "mathematiques-informatique-ia",
    "Mathématiques pour l'informatique et l'IA",
    [
      lesson(
        "systemes-numeriques",
        "Systèmes numériques et nombres binaires",
        14,
        `
Les ordinateurs représentent et traitent les informations
à l'aide de nombres.

Le système décimal utilise dix chiffres :

0, 1, 2, 3, 4, 5, 6, 7, 8 et 9.

Le système binaire utilise seulement deux chiffres :

0 et 1.

Chaque chiffre binaire est appelé un bit.

Exemple :

Le nombre décimal 5 s'écrit 101 en binaire.

En effet :

101 en base 2 = (1 × 4) + (0 × 2) + (1 × 1)

101 en base 2 = 5 en base 10.

Les systèmes binaires sont fondamentaux pour comprendre
le fonctionnement des ordinateurs et le stockage des données.
        `,
        "Quels chiffres sont utilisés dans le système binaire ?",
        [
          "0 et 1",
          "0 à 9",
          "1 à 5",
          "A et B"
        ],
        0,
        "Le système binaire utilise uniquement les chiffres 0 et 1."
      ),

      lesson(
        "logique-booleenne",
        "Logique booléenne et opérations logiques",
        14,
        `
La logique booléenne travaille avec deux valeurs :

- Vrai (True)
- Faux (False)

Elle est utilisée dans les programmes informatiques,
les circuits électroniques et les systèmes de décision.

Trois opérations fondamentales :

ET (AND) :

Le résultat est vrai uniquement si les deux conditions
sont vraies.

OU (OR) :

Le résultat est vrai si au moins une condition est vraie.

NON (NOT) :

Cette opération inverse une valeur logique.

Exemple :

Condition A : l'utilisateur est connecté.
Condition B : l'utilisateur possède le rôle administrateur.

Accès autorisé = A ET B.

Les opérations logiques permettent de construire
des conditions et des règles dans les applications.
        `,
        "Quel est le résultat de Vrai ET Faux ?",
        ["Vrai", "Faux", "Indéterminé", "1"],
        1,
        "L'opération ET exige que les deux valeurs soient vraies. Le résultat est donc Faux."
      ),

      lesson(
        "vecteurs-et-matrices",
        "Introduction aux vecteurs et aux matrices",
        15,
        `
Un vecteur est une collection ordonnée de nombres.

Exemple :

v = [2, 4, 6]

Ce vecteur contient trois valeurs.

Une matrice est un tableau de nombres organisé en lignes
et en colonnes.

Exemple :

A =

1  2
3  4

Cette matrice possède deux lignes et deux colonnes.

Les vecteurs et les matrices sont très importants
en intelligence artificielle.

Ils permettent notamment de représenter :

- Des caractéristiques d'un objet.
- Des données numériques.
- Des images.
- Des paramètres d'un modèle.

Les opérations sur les vecteurs et les matrices
constituent une base de l'algèbre linéaire.
        `,
        "Combien de valeurs contient le vecteur [3, 5, 7, 9] ?",
        ["2", "3", "4", "5"],
        2,
        "Le vecteur contient quatre valeurs : 3, 5, 7 et 9."
      ),
    ]
  )
);

// ================================================
// MODULE 11 — PROJET PRATIQUE ET ÉVALUATION
// ================================================

MODULES.push(
  moduleData(
    "projet-pratique-evaluation",
    "Projet pratique et évaluation",
    [
      lesson(
        "analyser-donnees-simples",
        "Analyser un petit ensemble de données",
        15,
        `
Vous allez utiliser les notions de statistiques
pour analyser un petit ensemble de données.

Considérons les nombres suivants :

10, 12, 14, 14, 20

Étape 1 : calculer la moyenne.

Moyenne = (10 + 12 + 14 + 14 + 20) / 5

Moyenne = 70 / 5 = 14

Étape 2 : déterminer la médiane.

Les données sont déjà classées.

La valeur centrale est 14.

Étape 3 : déterminer le mode.

La valeur 14 apparaît deux fois.

Le mode est donc 14.

Étape 4 : calculer l'étendue.

Étendue = 20 - 10 = 10.

Vous venez d'utiliser quatre notions importantes
pour résumer un ensemble de données.
        `,
        "Quelle est la moyenne des valeurs 10, 12, 14, 14 et 20 ?",
        ["12", "13", "14", "15"],
        2,
        "La somme est 70. En divisant par 5 valeurs, on obtient une moyenne de 14."
      ),

      lesson(
        "maths-et-programmation",
        "Traduire un problème mathématique en programme",
        15,
        `
Les mathématiques peuvent être traduites en instructions
dans un langage de programmation.

Considérons le calcul de la moyenne de trois notes :

Note 1 = 12
Note 2 = 15
Note 3 = 18

La formule mathématique est :

Moyenne = (12 + 15 + 18) / 3

En Python :

notes = [12, 15, 18]

moyenne = sum(notes) / len(notes)

print(moyenne)

Résultat :

15.0

Explication :

- sum(notes) additionne les valeurs.
- len(notes) retourne le nombre de valeurs.
- La division calcule la moyenne.

Cette approche permet de transformer une formule
mathématique en solution informatique.
        `,
        "Quelle fonction Python permet d'obtenir le nombre d'éléments d'une liste ?",
        ["sum()", "len()", "print()", "input()"],
        1,
        "len() retourne le nombre d'éléments contenus dans une liste."
      ),

      lesson(
        "evaluation-finale",
        "Évaluation finale : fondamentaux mathématiques",
        20,
        `
Cette dernière leçon permet de réviser les notions
abordées dans le cours.

Avant de terminer, assurez-vous de comprendre :

1. Les opérations arithmétiques fondamentales.
2. Les fractions, les décimaux et les pourcentages.
3. Les nombres positifs et négatifs.
4. Les variables et les équations simples.
5. Le périmètre et l'aire.
6. La moyenne, la médiane et le mode.
7. Les probabilités.
8. Les nombres binaires.
9. La logique booléenne.
10. Les vecteurs et les matrices.

Ces connaissances constituent une base utile
pour poursuivre votre apprentissage en programmation,
en science des données et en intelligence artificielle.

Prenez le temps de revoir les leçons dont les concepts
ne sont pas encore parfaitement maîtrisés.
        `,
        "Quelle notion mathématique permet de représenter une collection ordonnée de nombres ?",
        ["Une équation", "Un vecteur", "Un pourcentage", "Un périmètre"],
        1,
        "Un vecteur représente une collection ordonnée de valeurs numériques."
      ),
    ]
  )
);

// ================================================
// COURSE METADATA
// ================================================

const COURSE = {
  id: COURSE_ID,
  title: "Mathématiques fondamentales",
  subtitle: "Les bases mathématiques pour la programmation, la science des données et l'intelligence artificielle",
  description: `
Ce cours présente les concepts mathématiques essentiels
pour les personnes qui souhaitent se préparer à la programmation,
à la science des données et à l'intelligence artificielle.

Vous apprendrez les bases de l'arithmétique, de l'algèbre,
de la géométrie, des statistiques et des probabilités.

Vous découvrirez également comment les mathématiques
sont utilisées en informatique, notamment avec les nombres
binaires, la logique booléenne, les vecteurs et les matrices.

Le cours est conçu pour les débutants et comprend
des explications, des exemples pratiques et des vérifications
des connaissances.
  `.trim(),

  level: "beginner",
  status: "draft",
  language: "fr",
  topic: "Mathematics",
  cover: "teal",

  program: "Enterprise AI & Solutions Architecture",
  programOrder: 2,

  estimatedMinutes: MODULES.reduce(
    (total, currentModule) =>
      total + currentModule.lessons.reduce(
        (moduleTotal, currentLesson) =>
          moduleTotal + currentLesson.minutes,
        0
      ),
    0
  ),

  modules: MODULES.map((currentModule, moduleIndex) => ({
    id: currentModule.id,
    title: currentModule.title,
    order: moduleIndex + 1,
    lessons: currentModule.lessons.map(
      (currentLesson, lessonIndex) => ({
        id: currentLesson.id,
        title: currentLesson.title,
        order: lessonIndex + 1,
        duration: currentLesson.minutes,
      })
    ),
  })),

  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

// ================================================
// VALIDATION
// ================================================

const allLessons = MODULES.flatMap(
  (currentModule) => currentModule.lessons
);

const totalLessons = allLessons.length;

const totalQuickChecks = allLessons.reduce(
  (total, currentLesson) =>
    total +
    currentLesson.blocks.filter(
      (block) => block.type === "check"
    ).length,
  0
);

if (MODULES.length !== 11) {
  throw new Error(
    `Expected 11 modules, found ${MODULES.length}.`
  );
}

if (totalLessons !== 33) {
  throw new Error(
    `Expected 33 lessons, found ${totalLessons}.`
  );
}

if (totalQuickChecks !== 33) {
  throw new Error(
    `Expected 33 Quick Checks, found ${totalQuickChecks}.`
  );
}

if (allLessons.some(
  (currentLesson) =>
    !currentLesson.id ||
    !currentLesson.title ||
    !Array.isArray(currentLesson.blocks)
)) {
  throw new Error("One or more lessons have invalid data.");
}

console.log("\nCourse validation successful.");
console.log(`Modules: ${MODULES.length}`);
console.log(`Lessons: ${totalLessons}`);
console.log(`Quick Checks: ${totalQuickChecks}`);
console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);

// ================================================
// FIRESTORE SEEDING
// ================================================

async function seedCourse() {
  const courseRef = db.collection("courses").doc(COURSE_ID);

  const existingCourse = await courseRef.get();

  if (existingCourse.exists && !OVERWRITE) {
    console.log(
      `\nCourse "${COURSE_ID}" already exists.`
    );

    console.log(
      "No changes were made. Use --overwrite to replace the seeded course."
    );

    return;
  }

  if (!APPLY) {
    console.log("\nDRY RUN — no Firestore writes performed.");

    console.log("\nCourse details:");
    console.log(JSON.stringify({
      id: COURSE.id,
      title: COURSE.title,
      status: COURSE.status,
      language: COURSE.language,
      modules: MODULES.length,
      lessons: totalLessons,
      quickChecks: totalQuickChecks,
      estimatedMinutes: COURSE.estimatedMinutes,
    }, null, 2));

    console.log("\nTo write this course to Firebase, run:");
    console.log(
      "node scripts/seed-mathematiques-fondamentales.mjs --apply"
    );

    return;
  }

  const batch = db.batch();

  // Save the course document.
  batch.set(courseRef, COURSE);

  // Save each lesson in its own Firestore document.
  for (const currentModule of MODULES) {
    for (const currentLesson of currentModule.lessons) {
      const lessonRef = courseRef
        .collection("lessons")
        .doc(currentLesson.id);

      batch.set(lessonRef, {
        id: currentLesson.id,
        courseId: COURSE_ID,
        moduleId: currentModule.id,
        moduleTitle: currentModule.title,
        title: currentLesson.title,
        order: currentModule.lessons.indexOf(currentLesson) + 1,
        duration: currentLesson.minutes,
        blocks: currentLesson.blocks,
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();

  console.log("\nCourse successfully saved to Firestore.");
  console.log(`Course ID: ${COURSE_ID}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Lessons: ${totalLessons}`);
  console.log(`Quick Checks: ${totalQuickChecks}`);
  console.log(`Estimated minutes: ${COURSE.estimatedMinutes}`);
}

// ================================================
// EXECUTE
// ================================================

seedCourse()
  .then(() => {
    console.log("\nSeeding process completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  });

// END OF SECTION 3