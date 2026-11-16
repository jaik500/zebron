/**
 * Mathématiques fondamentales
 * Not part of a program
 *
 * Dry run (checks the content, writes nothing):
 *   node scripts/mathematics-foundations/seed-mathematiques-fondamentales.mjs
 * Create the course:
 *   node scripts/mathematics-foundations/seed-mathematiques-fondamentales.mjs --apply
 * Update an existing course (keeps its status, publish date and final exam):
 *   node scripts/mathematics-foundations/seed-mathematiques-fondamentales.mjs --apply --overwrite
 *
 * Lesson text uses the light Markdown lessons support: # / ## / ### headings,
 * - and 1. lists, **bold**, *italic*, `code`, ``` code blocks, > quotes and
 * | tables |. Each text block is one section in the lesson player; its first
 * heading is the section title.
 */

import { runCourseSeed } from '../lib/write-zebron-course.mjs';

const COURSE = {
  id: "mathematiques-fondamentales",
  title: "Mathématiques fondamentales",
  summary: "Les bases mathématiques pour la programmation, la science des données et l'intelligence artificielle",
  description: "Ce cours présente les concepts mathématiques essentiels pour les personnes qui souhaitent se préparer à la programmation, à la science des données et à l'intelligence artificielle.\n\nVous apprendrez les bases de l'arithmétique, de l'algèbre, de la géométrie, des statistiques et des probabilités.\n\nVous découvrirez également comment les mathématiques sont utilisées en informatique, notamment avec les nombres binaires, la logique booléenne, les vecteurs et les matrices.\n\nLe cours est conçu pour les débutants et comprend des explications, des exemples pratiques et des vérifications des connaissances.",
  topic: "Mathematics",
  program: "",
  programOrder: null,
  level: "beginner",
  cover: "teal",
  outcomes: [
    "Calculer avec les entiers, les fractions, les décimaux et les pourcentages",
    "Résoudre des équations simples et utiliser des formules",
    "Calculer des mesures géométriques comme le périmètre et l'aire",
    "Décrire des données avec la moyenne, la médiane, le mode et l'étendue",
    "Utiliser les probabilités, les vecteurs et les matrices dans des contextes d'IA",
  ],
  skills: [
    "Arithmétique",
    "Fractions et pourcentages",
    "Algèbre",
    "Géométrie",
    "Statistiques",
    "Probabilités",
    "Vecteurs et matrices",
    "Mathématiques pour l'IA",
  ],
};

const MODULES = [
  {
    id: "introduction-mathematiques",
    title: "Introduction aux mathématiques",
    lessons: [
      {
        id: "nombres-et-symboles",
        title: "Comprendre les nombres et les symboles",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Comprendre les nombres et les symboles

Les mathématiques sont un langage pour représenter des quantités, les comparer et résoudre des problèmes. Ce langage repose sur des nombres et des symboles précis.

## Les grandes familles de nombres

| Famille | Exemples | Utilisation |
| --- | --- | --- |
| **Entiers naturels** | 0, 1, 2, 3, 150 | Compter des objets |
| **Entiers relatifs** | −4, 0, 7 | Températures, soldes bancaires |
| **Nombres décimaux** | 2,5 ; 0,75 ; 12,40 | Prix, mesures |
| **Fractions** | 1/2, 3/4 | Parts d'un tout |
| **Nombres réels** | π ≈ 3,14159 ; √2 ≈ 1,414 | Géométrie, sciences |

Chaque famille contient la précédente : tout entier naturel est aussi un entier relatif, tout entier est aussi un décimal, etc.

## Les symboles essentiels

| Symbole | Signification | Exemple |
| --- | --- | --- |
| \`+\` | addition | 3 + 4 = 7 |
| \`−\` | soustraction | 10 − 6 = 4 |
| \`×\` | multiplication | 5 × 3 = 15 |
| \`÷\` ou \`/\` | division | 12 ÷ 4 = 3 |
| \`=\` | égal à | 2 + 2 = 4 |
| \`≠\` | différent de | 5 ≠ 6 |
| \`<\` | inférieur à | 3 < 8 |
| \`>\` | supérieur à | 9 > 2 |
| \`≤\` / \`≥\` | inférieur ou égal / supérieur ou égal | x ≥ 18 |
| \`≈\` | environ égal à | π ≈ 3,14 |

Astuce pour \`<\` et \`>\` : la pointe est toujours tournée vers le plus petit nombre.

## Notation française et notation informatique

En français, on écrit les décimaux avec une **virgule** (3,5) et on sépare les milliers par une **espace** (1 000 000). En programmation et dans la plupart des logiciels anglophones, on utilise un **point** (3.5) et la multiplication s'écrit \`*\`. Vous rencontrerez les deux notations dans ce programme.

## Pourquoi c'est utile pour l'IA

Les modèles d'IA manipulent uniquement des nombres : un texte, une image ou un son sont convertis en listes de nombres. Comprendre les nombres et les symboles est donc la première étape pour comprendre comment fonctionnent ces systèmes.

## À retenir

- Les nombres se répartissent en familles emboîtées : naturels, relatifs, décimaux, réels.
- Chaque symbole a un sens précis ; \`<\` pointe vers le plus petit nombre.
- Le français utilise la virgule décimale, la programmation utilise le point.`,
          },
          {
            type: 'check',
            question: "Quelle affirmation est correcte ?",
            options: [
              "0,5 > 0,75",
              "3 ≠ 3",
              "−7 < 2",
              "−7 > 2",
            ],
            answer: 2,
            explanation: "Un nombre négatif est toujours plus petit qu'un nombre positif, donc −7 < 2.",
          },
        ],
      },
      {
        id: "operations-fondamentales",
        title: "Les quatre opérations fondamentales",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Les quatre opérations fondamentales

Toutes les mathématiques reposent sur quatre opérations. Chacune a un vocabulaire et des propriétés à connaître.

## Le vocabulaire

| Opération | Exemple | Le résultat s'appelle |
| --- | --- | --- |
| Addition | 8 + 4 = 12 | une **somme** |
| Soustraction | 15 − 6 = 9 | une **différence** |
| Multiplication | 7 × 3 = 21 | un **produit** |
| Division | 20 ÷ 5 = 4 | un **quotient** |

## Les propriétés utiles

**Commutativité** : l'ordre ne change pas le résultat pour l'addition et la multiplication.

\`\`\`text
4 + 9 = 9 + 4 = 13
6 × 5 = 5 × 6 = 30
\`\`\`

Ce n'est **pas** vrai pour la soustraction et la division : 10 − 3 ≠ 3 − 10.

**Associativité** : on peut regrouper différemment.

\`\`\`text
(2 + 3) + 5 = 2 + (3 + 5) = 10
\`\`\`

**Distributivité** : la multiplication se distribue sur l'addition.

\`\`\`text
4 × (10 + 3) = 4 × 10 + 4 × 3 = 40 + 12 = 52
\`\`\`

C'est la base de nombreuses techniques de calcul mental.

## Les éléments neutres et le zéro

- Ajouter 0 ne change rien : 7 + 0 = 7.
- Multiplier par 1 ne change rien : 7 × 1 = 7.
- Multiplier par 0 donne toujours 0 : 7 × 0 = 0.
- **On ne peut pas diviser par 0.** 7 ÷ 0 n'a pas de sens. En programmation, cela provoque une erreur (\`ZeroDivisionError\` en Python).

## Les opérations sont liées

- La soustraction est l'inverse de l'addition : si 8 + 4 = 12, alors 12 − 4 = 8.
- La division est l'inverse de la multiplication : si 7 × 3 = 21, alors 21 ÷ 3 = 7.

On peut donc vérifier un calcul avec l'opération inverse.

## À retenir

- Somme, différence, produit et quotient sont les résultats des quatre opérations.
- Addition et multiplication sont commutatives ; soustraction et division ne le sont pas.
- La distributivité simplifie les calculs ; la division par zéro est impossible.`,
          },
          {
            type: 'check',
            question: "Comment utiliser la distributivité pour calculer 6 × 102 ?",
            options: [
              "6 + 100 × 2 = 206",
              "6 × 100 + 6 × 2 = 612",
              "(6 + 100) × 2 = 212",
              "6 × 100 + 2 = 602",
            ],
            answer: 1,
            explanation: "On distribue la multiplication : 6 × (100 + 2) = 6 × 100 + 6 × 2 = 600 + 12 = 612.",
          },
        ],
      },
      {
        id: "ordre-des-operations",
        title: "L'ordre des opérations",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# L'ordre des opérations

Quand une expression contient plusieurs opérations, l'ordre dans lequel on les effectue change le résultat. Une convention universelle fixe cet ordre.

## La règle

1. **Parenthèses** (et crochets) d'abord.
2. **Puissances** (par exemple 3² = 9).
3. **Multiplications et divisions**, de gauche à droite.
4. **Additions et soustractions**, de gauche à droite.

## Exemples

\`\`\`text
3 + 4 × 2
= 3 + 8          (la multiplication d'abord)
= 11
\`\`\`

\`\`\`text
(3 + 4) × 2
= 7 × 2          (les parenthèses d'abord)
= 14
\`\`\`

\`\`\`text
20 − 12 ÷ 4 + 2²
= 20 − 12 ÷ 4 + 4    (puissance)
= 20 − 3 + 4         (division)
= 21                 (de gauche à droite)
\`\`\`

## Le piège de « gauche à droite »

Multiplications et divisions ont la **même priorité** : on les fait dans l'ordre où elles apparaissent.

\`\`\`text
24 ÷ 4 × 2 = 6 × 2 = 12      (et non 24 ÷ 8 = 3)
\`\`\`

Il en va de même pour additions et soustractions :

\`\`\`text
10 − 4 + 3 = 6 + 3 = 9       (et non 10 − 7 = 3)
\`\`\`

## En programmation

Les langages de programmation appliquent les mêmes règles :

\`\`\`python
print(3 + 4 * 2)      # 11
print((3 + 4) * 2)    # 14
print(2 ** 3)         # 8 : en Python, ** est la puissance
\`\`\`

En cas de doute, **ajoutez des parenthèses** : elles rendent l'intention claire pour les lecteurs comme pour l'ordinateur.

## À retenir

- Ordre : parenthèses, puissances, multiplications et divisions, additions et soustractions.
- À priorité égale, on calcule de gauche à droite.
- Les parenthèses rendent les calculs lisibles et sans ambiguïté.`,
          },
          {
            type: 'check',
            question: "Quel est le résultat de 18 − 6 ÷ 3 × 2 ?",
            options: [
              "22",
              "8",
              "4",
              "14",
            ],
            answer: 3,
            explanation: "On fait d'abord 6 ÷ 3 = 2, puis 2 × 2 = 4 (de gauche à droite), enfin 18 − 4 = 14.",
          },
        ],
      },
    ],
  },
  {
    id: "arithmetique",
    title: "Arithmétique fondamentale",
    lessons: [
      {
        id: "addition-soustraction",
        title: "Addition et soustraction",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Addition et soustraction

L'addition réunit des quantités ; la soustraction calcule ce qui reste ou l'écart entre deux valeurs.

## L'addition posée

Pour additionner de grands nombres, on aligne les chiffres par rang (unités sous les unités, dizaines sous les dizaines) et on reporte les retenues :

\`\`\`text
   1 1
   4 7 8
 + 3 6 5
 -------
   8 4 3
\`\`\`

8 + 5 = 13 : on écrit 3 et on retient 1. Puis 7 + 6 + 1 = 14 : on écrit 4, on retient 1. Enfin 4 + 3 + 1 = 8.

## La soustraction posée

\`\`\`text
   7 0 2
 − 2 4 8
 -------
   4 5 4
\`\`\`

Quand le chiffre du haut est plus petit, on « emprunte » une dizaine au rang suivant.

## Vérifier avec l'opération inverse

\`\`\`text
702 − 248 = 454   car   454 + 248 = 702
\`\`\`

## Soustraction et écart

La soustraction sert souvent à mesurer un **écart** :

- Le budget prévu était de 5 000 €, la dépense réelle de 4 350 € : l'écart est 5 000 − 4 350 = 650 €.
- Un serveur répondait en 320 ms, il répond maintenant en 275 ms : il a gagné 45 ms.

## Les nombres décimaux

On aligne les **virgules** :

\`\`\`text
  12,50
+  3,75
-------
  16,25
\`\`\`

## Estimer avant de calculer

Arrondir permet de vérifier qu'un résultat est plausible : 478 + 365 ≈ 500 + 350 = 850. Le résultat exact (843) est proche : il est vraisemblable.

## À retenir

- Alignez les chiffres par rang (ou les virgules) et gérez les retenues.
- Vérifiez une soustraction par une addition.
- Estimez par arrondi pour repérer les erreurs grossières.`,
          },
          {
            type: 'check',
            question: "Une équipe avait un budget de 8 200 € et a dépensé 7 465 €. Quel montant reste-t-il ?",
            options: [
              "1 735 €",
              "835 €",
              "735 €",
              "635 €",
            ],
            answer: 2,
            explanation: "8 200 − 7 465 = 735. Vérification : 7 465 + 735 = 8 200.",
          },
        ],
      },
      {
        id: "multiplication-division",
        title: "Multiplication et division",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Multiplication et division

La multiplication est une addition répétée ; la division partage une quantité en parts égales ou cherche combien de fois une valeur en contient une autre.

## La multiplication

\`\`\`text
12 × 8 = 12 + 12 + 12 + 12 + 12 + 12 + 12 + 12 = 96
\`\`\`

Pour les grands nombres, on décompose :

\`\`\`text
23 × 14 = 23 × 10 + 23 × 4 = 230 + 92 = 322
\`\`\`

## La division

\`\`\`text
84 ÷ 4 = 21      car 21 × 4 = 84
\`\`\`

Quand la division ne « tombe pas juste », il y a un **reste** :

\`\`\`text
47 ÷ 5 = 9 reste 2      car 9 × 5 + 2 = 47
\`\`\`

- 47 est le **dividende**, 5 le **diviseur**, 9 le **quotient**, 2 le **reste**.
- Le reste est toujours plus petit que le diviseur.

## Division entière et reste en programmation

\`\`\`python
print(47 // 5)    # 9 : quotient entier
print(47 % 5)     # 2 : reste (modulo)
print(47 / 5)     # 9.4 : division décimale
\`\`\`

Le modulo est très utilisé : savoir si un nombre est pair (\`n % 2 == 0\`), répartir des éléments en groupes, ou faire tourner un compteur.

## Multiplier et diviser par 10, 100, 1 000

- Multiplier par 10 décale la virgule d'un rang vers la droite : 3,7 × 10 = 37.
- Diviser par 100 la décale de deux rangs vers la gauche : 450 ÷ 100 = 4,5.

## Exemple pratique

Une entreprise de 230 employés organise des formations par groupes de 12. Combien de groupes faut-il ?

\`\`\`text
230 ÷ 12 = 19 reste 2
\`\`\`

Il faut **20 groupes** : 19 groupes complets et un groupe de 2 personnes.

## À retenir

- La multiplication est une addition répétée ; décomposer facilite le calcul.
- Dividende = quotient × diviseur + reste, avec un reste plus petit que le diviseur.
- En Python : \`//\` pour le quotient entier, \`%\` pour le reste.`,
          },
          {
            type: 'check',
            question: "Combien vaut 53 % 6 en Python (le reste de la division de 53 par 6) ?",
            options: [
              "8",
              "3",
              "5",
              "6",
            ],
            answer: 2,
            explanation: "53 = 8 × 6 + 5, donc le quotient entier est 8 et le reste est 5.",
          },
        ],
      },
      {
        id: "calcul-mental",
        title: "Techniques de calcul mental",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Techniques de calcul mental

Le calcul mental permet d'obtenir rapidement un résultat ou de vérifier qu'une valeur affichée par un logiciel est plausible.

## Décomposer

\`\`\`text
48 + 27 = 48 + 20 + 7 = 68 + 7 = 75
\`\`\`

## Compenser

Arrondir un nombre, puis corriger :

\`\`\`text
48 + 27 = 50 + 27 − 2 = 77 − 2 = 75
63 − 19 = 63 − 20 + 1 = 44
\`\`\`

## Multiplier astucieusement

| Astuce | Exemple |
| --- | --- |
| × 5 = × 10 puis ÷ 2 | 46 × 5 = 460 ÷ 2 = 230 |
| × 9 = × 10 puis − le nombre | 34 × 9 = 340 − 34 = 306 |
| × 11 (deux chiffres) : on insère la somme des chiffres | 43 × 11 = 4 (4+3) 3 = 473 |
| × 25 = × 100 puis ÷ 4 | 36 × 25 = 3 600 ÷ 4 = 900 |
| Distributivité | 7 × 98 = 7 × 100 − 7 × 2 = 686 |

## Pourcentages de tête

- 10 % : on divise par 10. 10 % de 340 = 34.
- 5 % : la moitié de 10 %. 5 % de 340 = 17.
- 25 % : le quart. 25 % de 340 = 85.
- 15 % = 10 % + 5 % = 34 + 17 = 51.

## Estimer

Arrondir aux valeurs simples donne un ordre de grandeur :

\`\`\`text
392 × 51 ≈ 400 × 50 = 20 000      (valeur exacte : 19 992)
\`\`\`

L'estimation sert de garde-fou : si un tableur affiche 1 999 200, une erreur de saisie est probable.

## Pourquoi c'est utile en informatique

Avant de faire confiance à un résultat (coût d'une infrastructure, nombre de tokens, durée d'un traitement), un calcul approximatif permet de repérer immédiatement une erreur d'un facteur 10 ou 100.

## À retenir

- Décomposer et compenser simplifient additions et soustractions.
- Des astuces rendent les multiplications par 5, 9, 11 ou 25 rapides.
- L'estimation par arrondi permet de vérifier la vraisemblance d'un résultat.`,
          },
          {
            type: 'check',
            question: "Quelle est la méthode la plus rapide pour calculer 64 × 5 de tête ?",
            options: [
              "Additionner 64 cinq fois de suite",
              "Calculer 64 × 10 = 640, puis diviser par 2 : 320",
              "Calculer 64 + 5 puis multiplier par 10",
              "Calculer 60 × 5 et ignorer le 4",
            ],
            answer: 1,
            explanation: "Multiplier par 5 revient à multiplier par 10 puis diviser par 2 : 640 ÷ 2 = 320.",
          },
        ],
      },
    ],
  },
  {
    id: "fractions-decimaux",
    title: "Fractions et nombres décimaux",
    lessons: [
      {
        id: "comprendre-fractions",
        title: "Comprendre les fractions",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Comprendre les fractions

Une fraction représente une **partie d'un tout**.

\`\`\`text
3      ← numérateur : le nombre de parts prises
—
4      ← dénominateur : le nombre de parts égales du tout
\`\`\`

3/4 signifie : on partage le tout en 4 parts égales et on en prend 3.

## Fractions et division

Une fraction est aussi une division : 3/4 = 3 ÷ 4 = 0,75.

## Fractions équivalentes

On obtient une fraction égale en multipliant ou en divisant le numérateur **et** le dénominateur par le même nombre :

\`\`\`text
1/2 = 2/4 = 4/8 = 50/100
\`\`\`

## Simplifier une fraction

On divise le numérateur et le dénominateur par leur plus grand diviseur commun :

\`\`\`text
18/24 : 18 et 24 sont divisibles par 6
18 ÷ 6 = 3   et   24 ÷ 6 = 4
donc 18/24 = 3/4
\`\`\`

Une fraction est **irréductible** quand on ne peut plus la simplifier.

## Comparer des fractions

- Même dénominateur : on compare les numérateurs. 5/8 > 3/8.
- Dénominateurs différents : on les ramène au même dénominateur.

\`\`\`text
2/3 et 3/4 → 8/12 et 9/12 → donc 3/4 > 2/3
\`\`\`

On peut aussi convertir en décimaux : 2/3 ≈ 0,667 et 3/4 = 0,75.

## Fractions supérieures à 1

7/4 = 1 + 3/4 = 1,75. Le numérateur est plus grand que le dénominateur, la fraction dépasse le tout.

## Exemples concrets

- 3 projets terminés sur 5 : 3/5 = 60 % des projets.
- Un modèle a classé correctement 45 tickets sur 50 : 45/50 = 9/10 = 0,9, soit une précision de 90 %.

## À retenir

- Numérateur = parts prises ; dénominateur = parts du tout.
- On simplifie en divisant haut et bas par le même nombre.
- Pour comparer, on met au même dénominateur ou on convertit en décimal.`,
          },
          {
            type: 'check',
            question: "Quelle est la forme simplifiée de 15/20 ?",
            options: [
              "3/4",
              "5/10",
              "1/5",
              "2/3",
            ],
            answer: 0,
            explanation: "15 et 20 sont divisibles par 5 : 15 ÷ 5 = 3 et 20 ÷ 5 = 4, donc 15/20 = 3/4.",
          },
        ],
      },
      {
        id: "operations-fractions",
        title: "Opérations sur les fractions",
        minutes: 5,
        blocks: [
          {
            type: 'text',
            text: `# Opérations sur les fractions

## Addition et soustraction

**Même dénominateur** : on additionne (ou soustrait) les numérateurs et on garde le dénominateur.

\`\`\`text
2/7 + 3/7 = 5/7
5/8 − 2/8 = 3/8
\`\`\`

**Dénominateurs différents** : on met d'abord au même dénominateur.

\`\`\`text
1/3 + 1/4
= 4/12 + 3/12      (12 est un multiple de 3 et de 4)
= 7/12
\`\`\`

Erreur fréquente : additionner les dénominateurs. 1/3 + 1/4 n'est **pas** 2/7.

## Multiplication

On multiplie les numérateurs entre eux et les dénominateurs entre eux :

\`\`\`text
2/3 × 4/5 = (2 × 4) / (3 × 5) = 8/15
\`\`\`

Prendre une fraction **d'une quantité** est une multiplication :

\`\`\`text
3/4 de 120 = 3/4 × 120 = 360/4 = 90
\`\`\`

## Division

Diviser par une fraction revient à multiplier par son **inverse** (on retourne la fraction) :

\`\`\`text
2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6
\`\`\`

## Simplifier le résultat

Simplifiez toujours le résultat final : 10/12 = 5/6.

## Exemple pratique

Une équipe consacre 1/2 de son temps au développement, 1/5 aux tests et le reste à la documentation. Quelle part reste pour la documentation ?

\`\`\`text
1/2 + 1/5 = 5/10 + 2/10 = 7/10
1 − 7/10 = 3/10
\`\`\`

La documentation représente 3/10 du temps, soit 30 %.

## À retenir

- Addition et soustraction : même dénominateur d'abord, puis on combine les numérateurs.
- Multiplication : numérateurs ensemble, dénominateurs ensemble.
- Division : on multiplie par l'inverse ; on simplifie le résultat.`,
          },
          {
            type: 'check',
            question: "Combien vaut 1/2 + 1/3 ?",
            options: [
              "1/6",
              "5/6",
              "2/5",
              "2/6",
            ],
            answer: 1,
            explanation: "On met au même dénominateur 6 : 3/6 + 2/6 = 5/6. On n'additionne jamais les dénominateurs.",
          },
        ],
      },
      {
        id: "nombres-decimaux",
        title: "Comprendre les nombres décimaux",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Comprendre les nombres décimaux

Un nombre décimal possède une **partie entière** et une **partie décimale**, séparées par une virgule.

\`\`\`text
12,75
12  → partie entière
75  → partie décimale : 7 dixièmes et 5 centièmes
\`\`\`

## Les rangs

| Centaines | Dizaines | Unités | , | Dixièmes | Centièmes | Millièmes |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | 4 | 5 | , | 2 | 7 | 1 |

345,271 = 300 + 40 + 5 + 2/10 + 7/100 + 1/1 000.

## Décimaux et fractions

\`\`\`text
0,5   = 1/2
0,25  = 1/4
0,75  = 3/4
0,1   = 1/10
0,333… ≈ 1/3   (le 3 se répète à l'infini)
\`\`\`

## Comparer des décimaux

On compare rang par rang, en partant de la gauche. Ajouter des zéros à droite ne change pas la valeur : 0,5 = 0,50.

\`\`\`text
0,5 et 0,45 → 0,50 et 0,45 → 0,5 > 0,45
\`\`\`

Erreur fréquente : croire que 0,45 > 0,5 parce que « 45 > 5 ».

## Arrondir

Pour arrondir au dixième, on regarde le chiffre des centièmes : s'il vaut 5 ou plus, on arrondit au-dessus.

\`\`\`text
12,74 → 12,7
12,75 → 12,8
3,14159 arrondi au centième → 3,14
\`\`\`

## Décimaux en informatique

Les ordinateurs représentent la plupart des décimaux de façon approchée :

\`\`\`python
print(0.1 + 0.2)          # 0.30000000000000004
print(round(0.1 + 0.2, 2))  # 0.3
\`\`\`

C'est pourquoi on évite de stocker de l'argent sous forme de nombres décimaux « flottants » : on utilise des centimes entiers ou un type décimal exact.

## À retenir

- Chaque chiffre après la virgule a un rang : dixièmes, centièmes, millièmes.
- Pour comparer, on aligne les rangs ; 0,5 = 0,50 > 0,45.
- On arrondit en regardant le chiffre suivant ; les ordinateurs font des approximations.`,
          },
          {
            type: 'check',
            question: "Quel nombre est le plus grand ?",
            options: [
              "0,6",
              "0,5",
              "0,58",
              "0,099",
            ],
            answer: 0,
            explanation: "En alignant les rangs : 0,600 > 0,580 > 0,500 > 0,099.",
          },
        ],
      },
    ],
  },
  {
    id: "pourcentages-proportions",
    title: "Pourcentages et proportions",
    lessons: [
      {
        id: "calcul-pourcentages",
        title: "Calculer les pourcentages",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Calculer les pourcentages

Un pourcentage exprime une proportion **sur 100**. « 35 % » signifie 35 sur 100, soit 35/100 = 0,35.

## Trois conversions à connaître

| Pourcentage | Fraction | Décimal |
| --- | --- | --- |
| 50 % | 1/2 | 0,5 |
| 25 % | 1/4 | 0,25 |
| 10 % | 1/10 | 0,1 |
| 75 % | 3/4 | 0,75 |
| 5 % | 1/20 | 0,05 |

## Calculer un pourcentage d'une quantité

On multiplie la quantité par le pourcentage exprimé en décimal :

\`\`\`text
20 % de 450 = 0,20 × 450 = 90
\`\`\`

## Trouver quel pourcentage représente une valeur

\`\`\`text
Pourcentage = (partie ÷ total) × 100

18 apprenants sur 24 ont réussi : 18 ÷ 24 × 100 = 75 %
\`\`\`

## Retrouver le total

Si 30 % d'une quantité vaut 60, la quantité totale est :

\`\`\`text
60 ÷ 0,30 = 200
\`\`\`

## Points de pourcentage

Quand un taux passe de 40 % à 50 %, il augmente de **10 points de pourcentage**, mais de **25 %** en valeur relative (10 ÷ 40 = 0,25). Ne confondez pas les deux dans un rapport.

## En Python

\`\`\`python
reussis = 18
total = 24
taux = reussis / total * 100
print(f"{taux:.1f} %")    # 75.0 %
\`\`\`

## À retenir

- Un pourcentage est une proportion sur 100 : 35 % = 0,35.
- Valeur = total × pourcentage ; pourcentage = partie ÷ total × 100.
- Distinguez une variation en points de pourcentage d'une variation relative.`,
          },
          {
            type: 'check',
            question: "Sur 80 tickets, 12 sont urgents. Quel pourcentage cela représente-t-il ?",
            options: [
              "15 %",
              "8 %",
              "12 %",
              "20 %",
            ],
            answer: 0,
            explanation: "12 ÷ 80 = 0,15, soit 0,15 × 100 = 15 %.",
          },
        ],
      },
      {
        id: "ratios-proportions",
        title: "Ratios et proportions",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Ratios et proportions

Un **ratio** compare deux quantités ; une **proportion** affirme que deux ratios sont égaux.

## Les ratios

Une classe compte 10 garçons et 15 filles. Le ratio garçons/filles est :

\`\`\`text
10 : 15 = 2 : 3      (on simplifie en divisant par 5)
\`\`\`

Pour 2 garçons, il y a 3 filles. Le ratio garçons/total est 10 : 25 = 2 : 5.

## Les proportions et la règle de trois

Si 4 licences coûtent 300 €, combien coûtent 10 licences ?

\`\`\`text
4 licences  → 300 €
1 licence   → 300 ÷ 4 = 75 €
10 licences → 75 × 10 = 750 €
\`\`\`

C'est la **règle de trois** : on passe par l'unité, puis on multiplie.

On peut aussi écrire l'égalité des rapports et faire un **produit en croix** :

\`\`\`text
4 / 300 = 10 / x   →   x = 300 × 10 ÷ 4 = 750
\`\`\`

## Proportionnalité

Deux grandeurs sont **proportionnelles** quand on passe de l'une à l'autre en multipliant toujours par le même nombre (le coefficient de proportionnalité).

| Heures | 1 | 2 | 5 | 8 |
| --- | --- | --- | --- | --- |
| Coût (€) | 40 | 80 | 200 | 320 |

Le coefficient est 40 : coût = 40 × heures.

Attention : toutes les situations ne sont pas proportionnelles. Un abonnement avec des frais fixes de 20 € plus 40 € par heure ne l'est pas.

## Échelles

Sur un plan à l'échelle 1 : 100, 1 cm représente 100 cm, soit 1 m. Un mur de 4,5 cm sur le plan mesure 4,5 m.

## En IA et en données

- Le **ratio d'entraînement/test** (par exemple 80 : 20) indique comment on partage un jeu de données.
- Un jeu de données déséquilibré, avec un ratio de 1 : 99 entre fraudes et transactions normales, demande des précautions particulières.

## À retenir

- Un ratio compare deux quantités et se simplifie comme une fraction.
- La règle de trois résout les problèmes de proportionnalité.
- Vérifiez qu'une situation est vraiment proportionnelle avant de l'appliquer.`,
          },
          {
            type: 'check',
            question: "6 cafés coûtent 15 €. Combien coûtent 10 cafés au même prix unitaire ?",
            options: [
              "21 €",
              "30 €",
              "19 €",
              "25 €",
            ],
            answer: 3,
            explanation: "Un café coûte 15 ÷ 6 = 2,50 €, donc 10 cafés coûtent 2,50 × 10 = 25 €.",
          },
        ],
      },
      {
        id: "applications-pourcentages",
        title: "Applications pratiques des pourcentages",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Applications pratiques des pourcentages

## Réductions

Un produit coûte 80 € et bénéficie d'une réduction de 25 % :

\`\`\`text
Réduction : 0,25 × 80 = 20 €
Prix final : 80 − 20 = 60 €
Raccourci : 80 × (1 − 0,25) = 80 × 0,75 = 60 €
\`\`\`

## Augmentations

Un salaire de 2 400 € augmente de 3 % :

\`\`\`text
2 400 × 1,03 = 2 472 €
\`\`\`

Multiplier par **1 + taux** augmente ; multiplier par **1 − taux** diminue.

## Taux de variation

\`\`\`text
Variation (%) = (nouvelle valeur − ancienne valeur) ÷ ancienne valeur × 100

Les inscriptions passent de 1 200 à 1 500 :
(1 500 − 1 200) ÷ 1 200 × 100 = 25 % d'augmentation
\`\`\`

## Hausses et baisses successives

Une hausse de 10 % suivie d'une baisse de 10 % ne ramène **pas** au point de départ :

\`\`\`text
100 × 1,10 = 110
110 × 0,90 = 99
\`\`\`

On perd 1 %, car la baisse s'applique à une valeur plus grande.

## Taxes

Un prix hors taxes de 150 € avec une TVA de 20 % :

\`\`\`text
Prix TTC = 150 × 1,20 = 180 €
Prix HT à partir du TTC : 180 ÷ 1,20 = 150 €
\`\`\`

Erreur fréquente : retirer 20 % de 180 € (ce qui donne 144 €, faux).

## Dans les tableaux de bord

- Taux de réussite d'un cours, taux de disponibilité d'un service (99,9 %), précision d'un modèle d'IA.
- 99,9 % de disponibilité laisse environ 8,8 heures d'indisponibilité par an ; 99,99 % en laisse environ 53 minutes.

## À retenir

- Multipliez par (1 + taux) pour augmenter et (1 − taux) pour diminuer.
- La variation se calcule par rapport à la valeur de départ.
- Des pourcentages successifs ne s'additionnent pas simplement.`,
          },
          {
            type: 'check',
            question: "Un prix de 200 € augmente de 20 % puis baisse de 20 %. Quel est le prix final ?",
            options: [
              "240 €",
              "192 €",
              "200 €",
              "160 €",
            ],
            answer: 1,
            explanation: "200 × 1,20 = 240, puis 240 × 0,80 = 192. La baisse s'applique à une valeur plus grande.",
          },
        ],
      },
    ],
  },
  {
    id: "nombres-relatifs",
    title: "Nombres relatifs",
    lessons: [
      {
        id: "nombres-positifs-negatifs",
        title: "Nombres positifs et négatifs",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Nombres positifs et négatifs

Les **nombres relatifs** comprennent les nombres positifs, les nombres négatifs et zéro.

## La droite numérique

\`\`\`text
 −5  −4  −3  −2  −1   0   +1  +2  +3  +4  +5
 ←———————————————————|———————————————————→
     plus petits             plus grands
\`\`\`

Plus un nombre est à droite, plus il est grand. Ainsi −1 > −4, même si 4 > 1.

## Où les rencontre-t-on ?

| Situation | Exemple |
| --- | --- |
| Températures | −8 °C en hiver |
| Comptes bancaires | Un solde de −150 € (découvert) |
| Altitudes | La mer Morte est à environ −430 m |
| Variations | Une baisse de −12 % du trafic |
| Fuseaux horaires | UTC−5 pour New York en hiver |

## Opposés

Deux nombres sont **opposés** s'ils sont à la même distance de 0 de part et d'autre : 7 et −7. Leur somme vaut 0.

## Comparer

- Tout nombre positif est plus grand que tout nombre négatif : 2 > −50.
- Entre deux négatifs, le plus grand est celui qui est le plus proche de zéro : −3 > −9.

## Ordonner

Ranger dans l'ordre croissant : 4 ; −2 ; 0 ; −7 ; 1.

\`\`\`text
−7 < −2 < 0 < 1 < 4
\`\`\`

## En informatique

- Les variations (croissance d'un indicateur, écart à une cible) sont souvent négatives.
- En apprentissage automatique, les poids d'un réseau de neurones et les « gradients » sont des nombres positifs ou négatifs.
- En Python, les index négatifs désignent les éléments en partant de la fin : \`liste[-1]\` est le dernier élément.

## À retenir

- Les relatifs regroupent positifs, négatifs et zéro.
- Sur la droite numérique, plus on va vers la droite, plus le nombre est grand.
- Entre deux négatifs, le plus grand est le plus proche de zéro.`,
          },
          {
            type: 'check',
            question: "Quel nombre est le plus grand ?",
            options: [
              "−5",
              "−2",
              "−3,5",
              "−12",
            ],
            answer: 1,
            explanation: "Entre deux nombres négatifs, le plus grand est le plus proche de zéro : −2.",
          },
        ],
      },
      {
        id: "operations-nombres-relatifs",
        title: "Opérations avec les nombres relatifs",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Opérations avec les nombres relatifs

## Addition

**Même signe** : on additionne les distances à zéro et on garde le signe.

\`\`\`text
(+5) + (+3) = +8
(−5) + (−3) = −8
\`\`\`

**Signes différents** : on soustrait la plus petite distance de la plus grande et on garde le signe du nombre le plus éloigné de zéro.

\`\`\`text
(−5) + (+8) = +3
(+2) + (−9) = −7
\`\`\`

## Soustraction

Soustraire un nombre revient à **ajouter son opposé** :

\`\`\`text
7 − (−3) = 7 + 3 = 10
−4 − 6 = −4 + (−6) = −10
\`\`\`

Exemple concret : il fait −2 °C le matin et 5 °C l'après-midi. L'écart est 5 − (−2) = 7 °C.

## Multiplication et division : la règle des signes

| Signes | Résultat |
| --- | --- |
| (+) × (+) | + |
| (−) × (−) | + |
| (+) × (−) | − |
| (−) × (+) | − |

\`\`\`text
(−4) × (−3) = 12
(−4) × 3 = −12
(−20) ÷ 5 = −4
(−20) ÷ (−5) = 4
\`\`\`

La même règle s'applique à la division.

## Plusieurs facteurs

On compte les facteurs négatifs : un nombre **pair** de négatifs donne un résultat positif, un nombre **impair** un résultat négatif.

\`\`\`text
(−1) × (−2) × (−3) = −6     (trois négatifs : résultat négatif)
\`\`\`

## Exemple : un solde bancaire

Solde initial : 120 €. Dépenses : 45 € et 90 €. Dépôt : 30 €.

\`\`\`text
120 − 45 − 90 + 30 = 15 €
\`\`\`

## À retenir

- Même signe : on additionne et on garde le signe ; signes différents : on soustrait et on prend le signe du plus éloigné de zéro.
- Soustraire, c'est ajouter l'opposé.
- Produit ou quotient de deux nombres de même signe : positif ; de signes différents : négatif.`,
          },
          {
            type: 'check',
            question: "Combien vaut (−6) × (−4) + (−10) ?",
            options: [
              "14",
              "−14",
              "−34",
              "34",
            ],
            answer: 0,
            explanation: "(−6) × (−4) = 24 (même signe, positif), puis 24 + (−10) = 14.",
          },
        ],
      },
      {
        id: "valeur-absolue",
        title: "Valeur absolue et distance",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Valeur absolue et distance

La **valeur absolue** d'un nombre est sa distance à zéro sur la droite numérique. Elle est toujours positive ou nulle et se note avec deux barres verticales.

\`\`\`text
|5| = 5
|−5| = 5
|0| = 0
\`\`\`

## Distance entre deux nombres

La distance entre deux nombres a et b est |a − b| :

\`\`\`text
Distance entre 3 et 10  : |3 − 10| = |−7| = 7
Distance entre −4 et 6  : |−4 − 6| = |−10| = 10
\`\`\`

L'ordre n'a pas d'importance : |10 − 3| = |3 − 10| = 7.

## Exemples concrets

- **Écart de température** entre −8 °C et 12 °C : |12 − (−8)| = 20 °C.
- **Écart à une cible** : une prévision de 1 450 ventes pour 1 500 réelles donne un écart de |1 450 − 1 500| = 50 ventes.

## L'erreur absolue en IA

Pour évaluer les prédictions d'un modèle, on mesure souvent l'**erreur absolue moyenne** (MAE) : la moyenne des écarts absolus entre prédictions et valeurs réelles.

| Réel | Prédit | Erreur absolue |
| --- | --- | --- |
| 100 | 90 | 10 |
| 80 | 85 | 5 |
| 120 | 126 | 6 |

\`\`\`text
MAE = (10 + 5 + 6) ÷ 3 = 7
\`\`\`

La valeur absolue empêche les erreurs positives et négatives de s'annuler.

## En Python

\`\`\`python
print(abs(-15))          # 15
reels = [100, 80, 120]
predits = [90, 85, 126]
erreurs = [abs(r - p) for r, p in zip(reels, predits)]
print(sum(erreurs) / len(erreurs))   # 7.0
\`\`\`

## À retenir

- La valeur absolue est la distance à zéro : toujours positive ou nulle.
- La distance entre a et b vaut |a − b|.
- L'erreur absolue moyenne mesure la précision d'un modèle sans que les erreurs s'annulent.`,
          },
          {
            type: 'check',
            question: "Quelle est la distance entre −3 et 9 sur la droite numérique ?",
            options: [
              "6",
              "3",
              "−12",
              "12",
            ],
            answer: 3,
            explanation: "|−3 − 9| = |−12| = 12.",
          },
        ],
      },
    ],
  },
  {
    id: "algebre-fondamentale",
    title: "Algèbre fondamentale",
    lessons: [
      {
        id: "variables-expressions",
        title: "Variables et expressions algébriques",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Variables et expressions algébriques

L'algèbre utilise des **lettres** pour représenter des nombres inconnus ou qui peuvent varier.

## Variables

Dans l'expression \`x + 5\`, la lettre x est une **variable** : elle peut prendre différentes valeurs.

\`\`\`text
Si x = 3 : x + 5 = 8
Si x = 10 : x + 5 = 15
\`\`\`

## Expressions et conventions d'écriture

| Écriture | Signification |
| --- | --- |
| 3x | 3 × x |
| xy | x × y |
| x² | x × x |
| 2(x + 4) | 2 × (x + 4) |

## Évaluer une expression

On remplace chaque variable par sa valeur, puis on respecte l'ordre des opérations :

\`\`\`text
Expression : 4a + 2b² avec a = 3 et b = 5
= 4 × 3 + 2 × 5²
= 12 + 2 × 25
= 12 + 50
= 62
\`\`\`

## Réduire une expression

On regroupe les **termes semblables** (même lettre, même puissance) :

\`\`\`text
3x + 5 + 2x − 1 = 5x + 4
\`\`\`

## Développer

\`\`\`text
3(x + 4) = 3x + 12
2(a − 5) = 2a − 10
\`\`\`

## Modéliser une situation

Un abonnement coûte 15 € par mois plus 40 € de frais d'inscription. Le coût total après m mois est :

\`\`\`text
Coût = 15m + 40
Après 6 mois : 15 × 6 + 40 = 130 €
\`\`\`

## Variables en programmation

En programmation, une variable est un nom associé à une valeur, comme en algèbre :

\`\`\`python
mois = 6
cout = 15 * mois + 40
print(cout)   # 130
\`\`\`

## À retenir

- Une variable représente un nombre qui peut changer.
- On évalue en remplaçant, puis en respectant l'ordre des opérations.
- On réduit en regroupant les termes semblables ; les expressions modélisent des situations réelles.`,
          },
          {
            type: 'check',
            question: "Combien vaut 2x² + 3x lorsque x = 4 ?",
            options: [
              "76",
              "28",
              "44",
              "56",
            ],
            answer: 2,
            explanation: "2 × 4² + 3 × 4 = 2 × 16 + 12 = 32 + 12 = 44.",
          },
        ],
      },
      {
        id: "equations-simples",
        title: "Résoudre des équations simples",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Résoudre des équations simples

Une **équation** est une égalité qui contient une inconnue. **Résoudre** l'équation, c'est trouver la valeur de l'inconnue qui rend l'égalité vraie.

## Le principe de la balance

On peut faire la même opération des **deux côtés** sans changer l'égalité : ajouter, soustraire, multiplier ou diviser (par un nombre non nul).

## Exemples

\`\`\`text
x + 5 = 12
x + 5 − 5 = 12 − 5
x = 7
\`\`\`

\`\`\`text
3x = 21
3x ÷ 3 = 21 ÷ 3
x = 7
\`\`\`

\`\`\`text
4x − 6 = 18
4x = 24          (on ajoute 6 des deux côtés)
x = 6            (on divise par 4)
\`\`\`

\`\`\`text
5x + 3 = 2x + 15
3x + 3 = 15      (on soustrait 2x des deux côtés)
3x = 12
x = 4
\`\`\`

## Toujours vérifier

On remplace x par la solution dans l'équation de départ :

\`\`\`text
5 × 4 + 3 = 23   et   2 × 4 + 15 = 23   ✔
\`\`\`

## Résoudre un problème concret

Un service coûte 40 € de frais fixes plus 15 € par mois. Après combien de mois le coût total atteint-il 175 € ?

\`\`\`text
15m + 40 = 175
15m = 135
m = 9
\`\`\`

Après **9 mois**.

## Méthode générale

1. Traduire le problème en équation.
2. Regrouper les termes avec l'inconnue d'un côté et les nombres de l'autre.
3. Isoler l'inconnue.
4. Vérifier et interpréter la réponse dans le contexte.

## À retenir

- Une équation se résout en faisant les mêmes opérations des deux côtés.
- On isole l'inconnue étape par étape, puis on vérifie la solution.
- Beaucoup de problèmes concrets se traduisent en équations simples.`,
          },
          {
            type: 'check',
            question: "Quelle est la solution de 3x + 7 = 25 ?",
            options: [
              "x = 10",
              "x = 6",
              "x = 8",
              "x = 4",
            ],
            answer: 1,
            explanation: "3x = 25 − 7 = 18, donc x = 18 ÷ 3 = 6. Vérification : 3 × 6 + 7 = 25.",
          },
        ],
      },
      {
        id: "formules-algebriques",
        title: "Utiliser des formules algébriques",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Utiliser des formules algébriques

Une **formule** exprime une relation entre plusieurs grandeurs. On l'utilise en remplaçant les grandeurs connues pour calculer l'inconnue.

## Exemples de formules

| Situation | Formule |
| --- | --- |
| Distance | d = v × t (vitesse × temps) |
| Périmètre d'un rectangle | P = 2 × (L + l) |
| Aire d'un rectangle | A = L × l |
| Prix avec taxe | P_TTC = P_HT × (1 + taux) |
| Intérêts simples | I = C × t × n |
| Conversion Celsius → Fahrenheit | F = 1,8 × C + 32 |

## Calculer avec une formule

Un train roule à 120 km/h pendant 2,5 heures :

\`\`\`text
d = v × t = 120 × 2,5 = 300 km
\`\`\`

## Transformer une formule

On peut isoler une autre grandeur avec les mêmes règles que pour une équation :

\`\`\`text
d = v × t
t = d ÷ v
v = d ÷ t
\`\`\`

Combien de temps pour parcourir 450 km à 90 km/h ?

\`\`\`text
t = 450 ÷ 90 = 5 heures
\`\`\`

## Attention aux unités

Les unités doivent être cohérentes. Une vitesse en km/h se combine avec un temps en heures, pas en minutes :

\`\`\`text
30 minutes = 0,5 heure
d = 80 km/h × 0,5 h = 40 km
\`\`\`

## Formules en informatique

Les formules sont au cœur des tableurs et des programmes :

\`\`\`python
def cout_total(prix_unitaire, quantite, taux_taxe=0.20):
    return prix_unitaire * quantite * (1 + taux_taxe)

print(cout_total(25, 4))   # 120.0
\`\`\`

En IA, on retrouve des formules partout : coût d'utilisation d'un modèle (nombre de tokens × prix par token), taux de précision, fonctions de perte.

## À retenir

- Une formule relie des grandeurs ; on remplace les valeurs connues pour calculer l'inconnue.
- On transforme une formule comme une équation pour isoler la grandeur cherchée.
- Vérifiez toujours la cohérence des unités.`,
          },
          {
            type: 'check',
            question: "Avec la formule d = v × t, combien de temps faut-il pour parcourir 360 km à 120 km/h ?",
            options: [
              "2 heures",
              "240 heures",
              "4,5 heures",
              "3 heures",
            ],
            answer: 3,
            explanation: "On isole t : t = d ÷ v = 360 ÷ 120 = 3 heures.",
          },
        ],
      },
    ],
  },
  {
    id: "geometrie-mesures",
    title: "Géométrie et mesures",
    lessons: [
      {
        id: "formes-geometriques",
        title: "Formes géométriques fondamentales",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Formes géométriques fondamentales

La géométrie étudie les formes, leurs dimensions et leurs positions dans l'espace.

## Formes planes (en deux dimensions)

| Forme | Caractéristiques |
| --- | --- |
| **Carré** | 4 côtés égaux, 4 angles droits |
| **Rectangle** | Côtés opposés égaux, 4 angles droits |
| **Triangle** | 3 côtés ; la somme des angles vaut 180° |
| **Losange** | 4 côtés égaux, angles pas forcément droits |
| **Parallélogramme** | Côtés opposés parallèles et égaux |
| **Trapèze** | Au moins deux côtés parallèles |
| **Cercle** | Tous les points à la même distance du centre (le rayon) |

## Les triangles

- **Équilatéral** : 3 côtés égaux, 3 angles de 60°.
- **Isocèle** : 2 côtés égaux.
- **Rectangle** : un angle droit (90°).

Dans un triangle rectangle, le **théorème de Pythagore** relie les côtés :

\`\`\`text
c² = a² + b²     (c est l'hypoténuse, le côté opposé à l'angle droit)

Si a = 3 et b = 4 : c² = 9 + 16 = 25, donc c = 5
\`\`\`

## Les angles

| Type | Mesure |
| --- | --- |
| Aigu | moins de 90° |
| Droit | exactement 90° |
| Obtus | entre 90° et 180° |
| Plat | 180° |

## Formes dans l'espace (trois dimensions)

Cube, pavé droit, cylindre, sphère, pyramide, cône. On les décrit par leurs faces, arêtes et sommets : un cube a 6 faces, 12 arêtes et 8 sommets.

## Pourquoi c'est utile

- Le théorème de Pythagore calcule des distances, y compris en informatique (distance entre deux points sur un écran ou dans un graphique).
- En IA, on mesure la « distance » entre des données représentées comme des points, avec la même idée généralisée à de nombreuses dimensions.

## À retenir

- Les formes planes se distinguent par leurs côtés et leurs angles.
- La somme des angles d'un triangle vaut 180°.
- Pythagore : dans un triangle rectangle, c² = a² + b².`,
          },
          {
            type: 'check',
            question: "Un triangle rectangle a des côtés de l'angle droit de 6 et 8. Quelle est la longueur de l'hypoténuse ?",
            options: [
              "12",
              "48",
              "10",
              "14",
            ],
            answer: 2,
            explanation: "c² = 6² + 8² = 36 + 64 = 100, donc c = 10.",
          },
        ],
      },
      {
        id: "perimetre-aire",
        title: "Périmètre et aire",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Périmètre et aire

Le **périmètre** est la longueur du contour d'une forme ; l'**aire** est la surface qu'elle occupe.

## Formules essentielles

| Forme | Périmètre | Aire |
| --- | --- | --- |
| Carré de côté c | 4 × c | c × c = c² |
| Rectangle L × l | 2 × (L + l) | L × l |
| Triangle de base b et hauteur h | somme des 3 côtés | (b × h) ÷ 2 |
| Cercle de rayon r | 2 × π × r | π × r² |

On utilise souvent π ≈ 3,14.

## Exemples

Un rectangle de 8 cm sur 3 cm :

\`\`\`text
Périmètre = 2 × (8 + 3) = 22 cm
Aire      = 8 × 3 = 24 cm²
\`\`\`

Un cercle de rayon 5 m :

\`\`\`text
Périmètre = 2 × 3,14 × 5 ≈ 31,4 m
Aire      = 3,14 × 5² ≈ 78,5 m²
\`\`\`

## Les unités

- Un périmètre s'exprime en unités de **longueur** : m, cm.
- Une aire s'exprime en unités **carrées** : m², cm².
- 1 m² = 100 cm × 100 cm = **10 000 cm²** (et non 100 cm²).

## Problème concret

Une salle de formation mesure 12 m sur 7,5 m. On veut poser de la moquette (35 € le m²) et une plinthe tout autour (8 € le mètre, sans compter une porte de 1 m).

\`\`\`text
Aire       = 12 × 7,5 = 90 m²      → moquette : 90 × 35 = 3 150 €
Périmètre  = 2 × (12 + 7,5) = 39 m → plinthe : (39 − 1) × 8 = 304 €
Total      = 3 454 €
\`\`\`

## Formes composées

On découpe une forme complexe en formes simples, on calcule chaque aire, puis on additionne (ou on soustrait les parties retirées).

## À retenir

- Le périmètre mesure le contour ; l'aire mesure la surface.
- Rectangle : P = 2(L + l), A = L × l ; cercle : P = 2πr, A = πr².
- Les aires s'expriment en unités carrées : 1 m² = 10 000 cm².`,
          },
          {
            type: 'check',
            question: "Quelle est l'aire d'un rectangle de 9 m sur 4 m ?",
            options: [
              "36 m²",
              "13 m²",
              "26 m",
              "72 m²",
            ],
            answer: 0,
            explanation: "Aire = longueur × largeur = 9 × 4 = 36 m². 26 m serait le périmètre.",
          },
        ],
      },
      {
        id: "unites-mesure",
        title: "Unités de mesure et conversions",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Unités de mesure et conversions

Une mesure n'a de sens qu'avec son unité. Savoir convertir évite des erreurs coûteuses.

## Le système métrique

Les préfixes indiquent des puissances de 10 :

| Préfixe | Symbole | Facteur |
| --- | --- | --- |
| kilo | k | 1 000 |
| hecto | h | 100 |
| déca | da | 10 |
| (unité) | | 1 |
| déci | d | 0,1 |
| centi | c | 0,01 |
| milli | m | 0,001 |

\`\`\`text
1 km = 1 000 m        1 m = 100 cm        1 cm = 10 mm
1 kg = 1 000 g        1 L = 1 000 mL
\`\`\`

## Convertir

Passer à une unité plus petite : on **multiplie**. Passer à une unité plus grande : on **divise**.

\`\`\`text
3,5 km = 3,5 × 1 000 = 3 500 m
2 500 g = 2 500 ÷ 1 000 = 2,5 kg
\`\`\`

## Le temps

Le temps n'est pas décimal : 1 h = 60 min, 1 min = 60 s.

\`\`\`text
1,5 h = 1 h 30 min (et non 1 h 50 min)
90 min = 1,5 h
1 jour = 86 400 s
\`\`\`

## Les unités informatiques

| Unité | Valeur |
| --- | --- |
| 1 octet (byte) | 8 bits |
| 1 Ko (kB) | 1 000 octets |
| 1 Mo (MB) | 1 000 Ko |
| 1 Go (GB) | 1 000 Mo |
| 1 To (TB) | 1 000 Go |

Certains systèmes utilisent les puissances de 2 : 1 Kio (KiB) = 1 024 octets, 1 Gio = 1 024 Mio. C'est pourquoi un disque de « 500 Go » apparaît parfois comme environ 465 Gio.

**Attention aux bits et aux octets** : un débit de 100 Mbit/s (mégabits) correspond à environ 12,5 Mo/s (mégaoctets).

## Les unités composées

Les vitesses et les débits combinent deux unités : km/h, Mo/s, requêtes par seconde, ou tokens par seconde pour un modèle d'IA.

\`\`\`text
72 km/h = 72 000 m ÷ 3 600 s = 20 m/s
\`\`\`

## À retenir

- Vers une unité plus petite, on multiplie ; vers une plus grande, on divise.
- Le temps se compte en base 60 : 1,5 h = 1 h 30.
- 1 octet = 8 bits ; distinguez Mbit/s et Mo/s.`,
          },
          {
            type: 'check',
            question: "Combien de minutes y a-t-il dans 2,25 heures ?",
            options: [
              "125 minutes",
              "225 minutes",
              "145 minutes",
              "135 minutes",
            ],
            answer: 3,
            explanation: "2,25 × 60 = 135 minutes, soit 2 h 15 min. Le temps ne se convertit pas en base 10.",
          },
        ],
      },
    ],
  },
  {
    id: "statistiques-fondamentales",
    title: "Statistiques fondamentales",
    lessons: [
      {
        id: "donnees-statistiques",
        title: "Comprendre les données statistiques",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Comprendre les données statistiques

Les **statistiques** consistent à collecter, organiser, résumer et interpréter des données pour en tirer des conclusions.

## Vocabulaire

| Terme | Signification | Exemple |
| --- | --- | --- |
| **Population** | L'ensemble étudié | Tous les apprenants de la plateforme |
| **Échantillon** | La partie effectivement observée | 500 apprenants interrogés |
| **Individu** | Un élément observé | Un apprenant |
| **Variable** | La caractéristique mesurée | Note, pays, temps passé |

## Types de données

- **Qualitatives** (catégories) : pays, niveau (débutant, avancé), catégorie de ticket.
- **Quantitatives** (nombres) :
  - **discrètes** : valeurs que l'on compte (nombre de leçons terminées) ;
  - **continues** : valeurs mesurées (durée, taille, température).

## Organiser les données

Un **tableau d'effectifs** compte combien de fois chaque valeur apparaît :

| Niveau | Effectif | Fréquence |
| --- | --- | --- |
| Débutant | 120 | 120 ÷ 300 = 40 % |
| Intermédiaire | 105 | 35 % |
| Avancé | 75 | 25 % |
| **Total** | **300** | **100 %** |

## Représenter les données

- **Diagramme en barres** : comparer des catégories.
- **Histogramme** : répartition d'une variable continue.
- **Courbe** : évolution dans le temps.
- **Nuage de points** : relation entre deux variables.

## Données de qualité

Les conclusions ne valent que si les données sont fiables :

- L'échantillon doit être **représentatif** de la population.
- Les valeurs manquantes ou aberrantes doivent être repérées.
- La manière de collecter peut introduire des **biais** (par exemple, seuls les apprenants satisfaits répondent au questionnaire).

En IA, un modèle entraîné sur des données biaisées reproduit ces biais : c'est l'un des risques majeurs des systèmes d'apprentissage automatique.

## À retenir

- On étudie un échantillon pour connaître une population.
- Les données sont qualitatives ou quantitatives (discrètes ou continues).
- Des données représentatives et sans biais sont indispensables, en statistiques comme en IA.`,
          },
          {
            type: 'check',
            question: "« Le temps passé sur une leçon, en minutes » est une variable de quel type ?",
            options: [
              "Ce n'est pas une variable",
              "Qualitative",
              "Quantitative continue",
              "Quantitative discrète uniquement",
            ],
            answer: 2,
            explanation: "Le temps est une grandeur mesurée qui peut prendre n'importe quelle valeur : c'est une variable quantitative continue.",
          },
        ],
      },
      {
        id: "moyenne-mediane-mode",
        title: "Moyenne, médiane et mode",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Moyenne, médiane et mode

Ces trois indicateurs résument une série de données par une valeur « centrale ».

## La moyenne

On additionne les valeurs et on divise par leur nombre.

\`\`\`text
Notes : 12, 15, 9, 18, 16
Moyenne = (12 + 15 + 9 + 18 + 16) ÷ 5 = 70 ÷ 5 = 14
\`\`\`

## La médiane

On **range** les valeurs dans l'ordre et on prend celle du milieu.

\`\`\`text
9, 12, 15, 16, 18 → médiane = 15
\`\`\`

Avec un nombre pair de valeurs, la médiane est la moyenne des deux valeurs centrales :

\`\`\`text
9, 12, 15, 16 → médiane = (12 + 15) ÷ 2 = 13,5
\`\`\`

## Le mode

La valeur la plus fréquente.

\`\`\`text
3, 5, 5, 7, 5, 9 → mode = 5
\`\`\`

Le mode s'utilise aussi pour les catégories : la catégorie de ticket la plus fréquente.

## Moyenne ou médiane ?

La moyenne est sensible aux **valeurs extrêmes** :

\`\`\`text
Salaires (k€) : 30, 32, 35, 38, 250
Moyenne = 77      Médiane = 35
\`\`\`

Un seul salaire très élevé fait grimper la moyenne, alors que la médiane reste représentative. C'est pourquoi on parle souvent de « salaire médian » ou de temps de réponse médian d'un service.

## En Python

\`\`\`python
from statistics import mean, median, mode

notes = [12, 15, 9, 18, 16, 15]
print(mean(notes))     # 14.1666...
print(median(notes))   # 15.0
print(mode(notes))     # 15
\`\`\`

## À retenir

- Moyenne : somme ÷ nombre de valeurs.
- Médiane : la valeur centrale une fois les données rangées.
- Mode : la valeur la plus fréquente. Préférez la médiane quand il y a des valeurs extrêmes.`,
          },
          {
            type: 'check',
            question: "Quelle est la médiane de la série 4, 10, 7, 1, 8 ?",
            options: [
              "6",
              "7",
              "8",
              "10",
            ],
            answer: 1,
            explanation: "Rangée : 1, 4, 7, 8, 10. La valeur du milieu est 7.",
          },
        ],
      },
      {
        id: "dispersion-donnees",
        title: "Étendue et dispersion des données",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Étendue et dispersion des données

Deux séries peuvent avoir la même moyenne et être très différentes. La **dispersion** mesure à quel point les valeurs s'écartent les unes des autres.

\`\`\`text
Série A : 50, 50, 50, 50, 50     moyenne 50
Série B : 10, 30, 50, 70, 90     moyenne 50
\`\`\`

La série B est beaucoup plus dispersée.

## L'étendue

\`\`\`text
Étendue = valeur maximale − valeur minimale
Série B : 90 − 10 = 80
\`\`\`

Simple, mais très sensible à une seule valeur extrême.

## Les quartiles

On range les données et on les coupe en quatre parts égales :

- **Q1** : 25 % des valeurs sont en dessous.
- **Q2** : la médiane (50 %).
- **Q3** : 75 % des valeurs sont en dessous.

L'**écart interquartile** (Q3 − Q1) mesure la dispersion des 50 % de valeurs centrales, sans être influencé par les extrêmes.

## La variance et l'écart type

L'**écart type** mesure l'écart moyen des valeurs par rapport à la moyenne.

\`\`\`text
Série : 2, 4, 4, 4, 5, 5, 7, 9      moyenne = 5
Écarts à la moyenne : −3, −1, −1, −1, 0, 0, 2, 4
Carrés : 9, 1, 1, 1, 0, 0, 4, 16 → somme = 32
Variance = 32 ÷ 8 = 4
Écart type = √4 = 2
\`\`\`

Un petit écart type indique des valeurs proches de la moyenne ; un grand écart type, des valeurs dispersées.

## Les valeurs aberrantes

Une valeur très éloignée des autres peut signaler une erreur de saisie ou un événement réel inhabituel (une panne, une fraude). Il faut l'examiner avant de la supprimer.

## En pratique

- Temps de réponse d'un service : une moyenne de 200 ms avec un grand écart type signifie que certains utilisateurs attendent beaucoup plus longtemps.
- On surveille souvent le **95ᵉ centile** : la valeur sous laquelle se trouvent 95 % des mesures.

\`\`\`python
from statistics import pstdev
print(pstdev([2, 4, 4, 4, 5, 5, 7, 9]))   # 2.0
\`\`\`

## À retenir

- La dispersion décrit l'étalement des données autour du centre.
- Étendue = max − min ; l'écart interquartile résiste aux valeurs extrêmes.
- L'écart type mesure l'écart typique par rapport à la moyenne.`,
          },
          {
            type: 'check',
            question: "Quelle est l'étendue de la série 12, 45, 7, 30, 19 ?",
            options: [
              "38",
              "26",
              "45",
              "113",
            ],
            answer: 0,
            explanation: "Étendue = maximum − minimum = 45 − 7 = 38.",
          },
        ],
      },
    ],
  },
  {
    id: "probabilites",
    title: "Probabilités",
    lessons: [
      {
        id: "introduction-probabilites",
        title: "Introduction aux probabilités",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Introduction aux probabilités

Une **probabilité** mesure la chance qu'un événement se produise. C'est un nombre entre **0** (impossible) et **1** (certain), souvent exprimé en pourcentage.

\`\`\`text
0      0,25      0,5      0,75      1
impossible  peu probable  une chance sur deux  probable  certain
\`\`\`

## Calculer une probabilité simple

Quand tous les résultats sont **également probables** :

\`\`\`text
P(événement) = nombre de cas favorables ÷ nombre de cas possibles
\`\`\`

Lancer un dé à six faces :

\`\`\`text
P(obtenir 4)             = 1/6 ≈ 0,167
P(obtenir un nombre pair) = 3/6 = 0,5
P(obtenir 7)             = 0/6 = 0
\`\`\`

## L'événement contraire

La probabilité qu'un événement **ne se produise pas** :

\`\`\`text
P(non A) = 1 − P(A)
P(ne pas obtenir 6) = 1 − 1/6 = 5/6
\`\`\`

## Probabilités et fréquences

En répétant une expérience un grand nombre de fois, la **fréquence observée** se rapproche de la probabilité. Sur 6 000 lancers de dé, on obtient environ 1 000 fois le 6.

C'est ainsi qu'on estime des probabilités à partir de données : si 30 tickets sur 1 000 sont des incidents de sécurité, on estime P(incident de sécurité) ≈ 0,03.

## Probabilités et IA

Les modèles d'IA raisonnent en probabilités :

- Un filtre anti-spam estime la probabilité qu'un e-mail soit indésirable.
- Un modèle de langage calcule la probabilité de chaque mot (token) suivant possible et en choisit un.
- Un modèle de classement peut annoncer « catégorie Matériel : 0,82 ».

Une probabilité élevée n'est **pas** une certitude : un modèle peut se tromper avec assurance.

## À retenir

- Une probabilité est comprise entre 0 et 1.
- Cas équiprobables : cas favorables ÷ cas possibles ; P(non A) = 1 − P(A).
- Les modèles d'IA produisent des probabilités, pas des certitudes.`,
          },
          {
            type: 'check',
            question: "Quelle est la probabilité d'obtenir un nombre supérieur à 4 avec un dé à six faces ?",
            options: [
              "1/3",
              "1/6",
              "2/3",
              "1/2",
            ],
            answer: 0,
            explanation: "Les cas favorables sont 5 et 6, soit 2 cas sur 6 : 2/6 = 1/3.",
          },
        ],
      },
      {
        id: "evenements-aleatoires",
        title: "Événements aléatoires et résultats possibles",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Événements aléatoires et résultats possibles

Une **expérience aléatoire** est une expérience dont on connaît les résultats possibles, mais pas celui qui va se produire.

## L'univers des possibles

L'ensemble de tous les résultats possibles s'appelle l'**univers** :

\`\`\`text
Lancer une pièce : {pile, face}
Lancer un dé     : {1, 2, 3, 4, 5, 6}
\`\`\`

Un **événement** est une partie de l'univers : « obtenir un nombre pair » = {2, 4, 6}.

## Lister les issues de plusieurs expériences

On lance deux pièces. Un **arbre** ou un tableau aide à ne rien oublier :

| Pièce 1 | Pièce 2 | Issue |
| --- | --- | --- |
| Pile | Pile | PP |
| Pile | Face | PF |
| Face | Pile | FP |
| Face | Face | FF |

\`\`\`text
P(deux faces) = 1/4
P(au moins une face) = 3/4
\`\`\`

## Événements indépendants

Deux événements sont **indépendants** quand l'un n'influence pas l'autre. On multiplie alors leurs probabilités :

\`\`\`text
P(6 au premier dé ET 6 au second) = 1/6 × 1/6 = 1/36
\`\`\`

Une pièce n'a pas de mémoire : après cinq « face », la probabilité d'obtenir face au sixième lancer reste 1/2.

## Événements incompatibles : « ou »

Deux événements **incompatibles** ne peuvent pas se produire ensemble. On additionne leurs probabilités :

\`\`\`text
P(obtenir 1 OU 2) = 1/6 + 1/6 = 1/3
\`\`\`

## Exemple appliqué

Deux serveurs indépendants ont chacun 1 % de risque de panne un jour donné.

\`\`\`text
P(les deux en panne) = 0,01 × 0,01 = 0,0001   (0,01 %)
\`\`\`

C'est pourquoi on duplique les systèmes critiques : la probabilité que tout tombe en même temps devient très faible, à condition que les pannes soient vraiment indépendantes.

## À retenir

- L'univers regroupe toutes les issues ; un événement en est une partie.
- Événements indépendants : on multiplie ; événements incompatibles : on additionne.
- Le hasard n'a pas de mémoire.`,
          },
          {
            type: 'check',
            question: "On lance deux fois une pièce équilibrée. Quelle est la probabilité d'obtenir deux fois pile ?",
            options: [
              "1/3",
              "3/4",
              "1/2",
              "1/4",
            ],
            answer: 3,
            explanation: "Les lancers sont indépendants : 1/2 × 1/2 = 1/4.",
          },
        ],
      },
      {
        id: "probabilites-applications",
        title: "Applications des probabilités",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Applications des probabilités

Les probabilités servent à prendre des décisions quand l'avenir est incertain.

## L'espérance

L'**espérance** est la valeur moyenne attendue d'une situation aléatoire, si on la répétait de nombreuses fois :

\`\`\`text
Espérance = somme de (valeur × probabilité)
\`\`\`

Une campagne marketing coûte 1 000 € et a 20 % de chances de rapporter 8 000 €, sinon rien :

\`\`\`text
Gain espéré = 0,20 × 8 000 + 0,80 × 0 − 1 000 = 600 €
\`\`\`

En moyenne, la campagne est rentable, même si elle échoue 4 fois sur 5.

## En gestion des risques

Le risque se calcule souvent comme probabilité × impact :

\`\`\`text
Une panne coûtant 50 000 € a 10 % de chances de se produire cette année.
Perte annuelle attendue = 0,10 × 50 000 = 5 000 €
\`\`\`

Une protection coûtant 2 000 € par an qui divise ce risque par deux est donc intéressante.

## En informatique

- **Fiabilité** : probabilité qu'un système soit disponible.
- **Tests A/B** : savoir si une différence de résultats entre deux versions n'est pas due au hasard.
- **Sécurité** : estimer la probabilité de deviner un mot de passe.

## En intelligence artificielle

- Les **classifieurs** donnent une probabilité pour chaque catégorie ; on fixe un **seuil** pour décider (par exemple, signaler une fraude au-dessus de 0,9).
- Les **modèles de langage** choisissent chaque token selon une distribution de probabilités ; la « température » rend ce choix plus ou moins varié.
- Les **probabilités conditionnelles** (la probabilité de A sachant B) sont au cœur de nombreux algorithmes, comme les filtres anti-spam.

## Attention aux intuitions

Un test fiable à 99 % pour détecter un événement très rare produit malgré tout beaucoup de fausses alertes : si l'événement ne concerne qu'un cas sur 10 000, la plupart des alertes concerneront des cas normaux. Il faut toujours tenir compte de la fréquence de départ.

## À retenir

- L'espérance combine valeurs et probabilités pour guider les décisions.
- Le risque attendu = probabilité × impact.
- En IA, les probabilités et les seuils de décision déterminent le comportement des modèles.`,
          },
          {
            type: 'check',
            question: "Un incident coûte 20 000 € et a 5 % de chances de se produire cette année. Quelle est la perte attendue ?",
            options: [
              "1 000 €",
              "100 €",
              "5 000 €",
              "20 000 €",
            ],
            answer: 0,
            explanation: "Perte attendue = probabilité × impact = 0,05 × 20 000 = 1 000 €.",
          },
        ],
      },
    ],
  },
  {
    id: "mathematiques-informatique-ia",
    title: "Mathématiques pour l'informatique et l'IA",
    lessons: [
      {
        id: "systemes-numeriques",
        title: "Systèmes numériques et nombres binaires",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Systèmes numériques et nombres binaires

Nous comptons en **base 10** (décimale) avec dix chiffres, de 0 à 9. Les ordinateurs utilisent la **base 2** (binaire), avec seulement 0 et 1, car leurs circuits ont deux états : éteint ou allumé.

## Lire un nombre binaire

Chaque position vaut une puissance de 2 :

| 2⁷ | 2⁶ | 2⁵ | 2⁴ | 2³ | 2² | 2¹ | 2⁰ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

\`\`\`text
1011 (binaire) = 1×8 + 0×4 + 1×2 + 1×1 = 11 (décimal)
\`\`\`

## Convertir du décimal en binaire

On divise par 2 et on note les restes, puis on les lit de bas en haut :

\`\`\`text
13 ÷ 2 = 6 reste 1
 6 ÷ 2 = 3 reste 0
 3 ÷ 2 = 1 reste 1
 1 ÷ 2 = 0 reste 1
13 = 1101 en binaire
\`\`\`

## Bits et octets

- Un **bit** est un 0 ou un 1.
- Un **octet** (byte) regroupe 8 bits et peut représenter 2⁸ = **256** valeurs (de 0 à 255).
- Avec n bits, on représente 2ⁿ valeurs différentes.

## L'hexadécimal

La **base 16** utilise 0–9 puis A–F (A = 10, …, F = 15). Un chiffre hexadécimal remplace exactement 4 bits, ce qui rend l'écriture plus compacte :

\`\`\`text
1111 1111 (binaire) = FF (hexadécimal) = 255 (décimal)
\`\`\`

On le rencontre dans les couleurs web (\`#007979\`), les adresses mémoire et les identifiants.

## En Python

\`\`\`python
print(bin(13))           # '0b1101'
print(int("1101", 2))    # 13
print(hex(255))          # '0xff'
\`\`\`

## Pourquoi c'est important

Textes, images, sons et modèles d'IA sont tous stockés sous forme binaire. La taille d'un modèle dépend du nombre de ses paramètres et du nombre de bits utilisés pour chacun (par exemple 16 bits) : réduire ce nombre (la « quantification ») rend un modèle plus léger.

## À retenir

- Le binaire n'utilise que 0 et 1 ; chaque position vaut une puissance de 2.
- 1 octet = 8 bits = 256 valeurs possibles.
- L'hexadécimal regroupe les bits par quatre pour une écriture compacte.`,
          },
          {
            type: 'check',
            question: "Quelle est la valeur décimale du nombre binaire 10110 ?",
            options: [
              "26",
              "10",
              "18",
              "22",
            ],
            answer: 3,
            explanation: "10110 = 1×16 + 0×8 + 1×4 + 1×2 + 0×1 = 22.",
          },
        ],
      },
      {
        id: "logique-booleenne",
        title: "Logique booléenne et opérations logiques",
        minutes: 7,
        blocks: [
          {
            type: 'text',
            text: `# Logique booléenne et opérations logiques

La **logique booléenne** manipule deux valeurs seulement : **vrai** (True, 1) et **faux** (False, 0). Elle est à la base des circuits électroniques et de toutes les décisions dans les programmes.

## Les trois opérateurs fondamentaux

**ET (AND)** : vrai seulement si les deux conditions sont vraies.

**OU (OR)** : vrai si au moins une condition est vraie.

**NON (NOT)** : inverse la valeur.

## Tables de vérité

| A | B | A ET B | A OU B |
| --- | --- | --- | --- |
| Vrai | Vrai | Vrai | Vrai |
| Vrai | Faux | Faux | Vrai |
| Faux | Vrai | Faux | Vrai |
| Faux | Faux | Faux | Faux |

| A | NON A |
| --- | --- |
| Vrai | Faux |
| Faux | Vrai |

## Exemples concrets

- Accès autorisé = (mot de passe correct) **ET** (code de vérification correct).
- Alerte = (processeur > 90 %) **OU** (mémoire > 95 %).
- Afficher la bannière = **NON** (utilisateur déjà abonné).

## En Python

\`\`\`python
age = 20
inscrit = True

peut_passer_examen = age >= 18 and inscrit
print(peut_passer_examen)        # True
print(not inscrit)               # False
print(age < 18 or inscrit)       # True
\`\`\`

## Combiner les opérateurs

Utilisez des parenthèses pour lever toute ambiguïté :

\`\`\`text
(est_admin OU est_proprietaire) ET compte_actif
\`\`\`

Les **lois de De Morgan** permettent de transformer des conditions :

\`\`\`text
NON (A ET B) = (NON A) OU (NON B)
NON (A OU B) = (NON A) ET (NON B)
\`\`\`

« Il n'est pas vrai que le serveur est en ligne ET à jour » équivaut à « le serveur est hors ligne OU pas à jour ».

## En IA et en données

Les filtres de recherche (\`niveau = débutant ET durée < 2 h\`), les règles métier qui encadrent un modèle et les règles d'accès aux données reposent sur la logique booléenne.

## À retenir

- ET exige que tout soit vrai ; OU qu'au moins une condition le soit ; NON inverse.
- Les tables de vérité décrivent toutes les combinaisons possibles.
- Les parenthèses et les lois de De Morgan clarifient les conditions complexes.`,
          },
          {
            type: 'check',
            question: "Avec A = Vrai et B = Faux, que vaut (A ET B) OU (NON B) ?",
            options: [
              "Impossible à déterminer",
              "Faux",
              "Vrai",
              "Vrai seulement si A est faux",
            ],
            answer: 2,
            explanation: "A ET B = Faux ; NON B = Vrai ; Faux OU Vrai = Vrai.",
          },
        ],
      },
      {
        id: "vecteurs-et-matrices",
        title: "Introduction aux vecteurs et aux matrices",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Introduction aux vecteurs et aux matrices

Les vecteurs et les matrices organisent des nombres. Ils sont le langage de base de l'intelligence artificielle.

## Les vecteurs

Un **vecteur** est une liste ordonnée de nombres :

\`\`\`text
v = [2, 4, 6]
\`\`\`

Ce vecteur a 3 **composantes** : on dit qu'il est de dimension 3.

Un vecteur peut décrire n'importe quel objet par des nombres. Un apprenant : [âge, leçons terminées, note moyenne] = [28, 14, 16,5].

## Opérations sur les vecteurs

\`\`\`text
Addition :          [1, 2, 3] + [4, 5, 6] = [5, 7, 9]
Multiplication :    3 × [1, 2, 3] = [3, 6, 9]
Produit scalaire :  [1, 2, 3] · [4, 5, 6] = 1×4 + 2×5 + 3×6 = 32
\`\`\`

Le **produit scalaire** mesure à quel point deux vecteurs « vont dans la même direction ». C'est l'idée qui permet de comparer des textes par leur sens dans les moteurs de recherche sémantique.

## Les matrices

Une **matrice** est un tableau de nombres organisé en lignes et en colonnes :

\`\`\`text
M = | 1  2  3 |
    | 4  5  6 |
\`\`\`

M est une matrice 2 × 3 (2 lignes, 3 colonnes). Un tableau de données (une ligne par apprenant, une colonne par caractéristique) est une matrice. Une image en niveaux de gris aussi : chaque case est un pixel.

## Multiplier une matrice par un vecteur

Chaque ligne de la matrice fait un produit scalaire avec le vecteur :

\`\`\`text
| 1  2  3 |   | 1 |   | 1×1 + 2×0 + 3×2 |   | 7  |
| 4  5  6 | × | 0 | = | 4×1 + 5×0 + 6×2 | = | 16 |
              | 2 |
\`\`\`

## Le lien avec l'IA

- Les mots et les documents sont transformés en vecteurs appelés **embeddings**, souvent de plusieurs centaines de dimensions.
- Une couche de réseau de neurones multiplie un vecteur d'entrée par une matrice de **poids**.
- Les cartes graphiques (GPU) sont très rapides pour ces calculs, ce qui explique leur rôle en IA.

## En Python avec NumPy

\`\`\`python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(a + b)          # [5 7 9]
print(a.dot(b))       # 32

M = np.array([[1, 2, 3], [4, 5, 6]])
print(M @ np.array([1, 0, 2]))   # [ 7 16]
\`\`\`

## À retenir

- Un vecteur est une liste ordonnée de nombres ; une matrice, un tableau de nombres.
- Le produit scalaire mesure la similarité de direction entre deux vecteurs.
- Les modèles d'IA représentent les données en vecteurs et calculent avec des matrices de poids.`,
          },
          {
            type: 'check',
            question: "Combien vaut le produit scalaire de [2, 1, 3] et [4, 0, 1] ?",
            options: [
              "11",
              "7",
              "17",
              "8",
            ],
            answer: 0,
            explanation: "2×4 + 1×0 + 3×1 = 8 + 0 + 3 = 11.",
          },
        ],
      },
    ],
  },
  {
    id: "projet-pratique-evaluation",
    title: "Projet pratique et évaluation",
    lessons: [
      {
        id: "analyser-donnees-simples",
        title: "Analyser un petit ensemble de données",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Analyser un petit ensemble de données

Vous allez appliquer les notions de statistiques à un cas réel : les temps de réponse (en minutes) d'une équipe de support pendant deux semaines.

## Les données

\`\`\`text
Semaine 1 : 12, 15, 9, 22, 14, 11, 13
Semaine 2 : 10, 11, 9, 48, 12, 10, 11
\`\`\`

## Étape 1 : les indicateurs centraux

| Indicateur | Semaine 1 | Semaine 2 |
| --- | --- | --- |
| Moyenne | 96 ÷ 7 ≈ 13,7 | 111 ÷ 7 ≈ 15,9 |
| Médiane | 13 | 11 |
| Minimum | 9 | 9 |
| Maximum | 22 | 48 |
| Étendue | 13 | 39 |

Pour la médiane, on range d'abord les valeurs. Semaine 2 : 9, 10, 10, **11**, 11, 12, 48.

## Étape 2 : interpréter

- La **moyenne** suggère que la semaine 2 était plus lente (15,9 contre 13,7).
- La **médiane** montre l'inverse : la plupart des demandes ont été traitées plus vite en semaine 2 (11 contre 13).
- L'**étendue** de la semaine 2 révèle une valeur exceptionnelle : 48 minutes.

## Étape 3 : examiner la valeur aberrante

Avant de conclure, on enquête sur la demande de 48 minutes : panne d'un outil, demande complexe, erreur de saisie ? Si c'est une erreur, on la corrige ; si c'est réel, on la garde et on la signale.

Sans cette valeur, la moyenne de la semaine 2 tombe à 63 ÷ 6 = 10,5 minutes.

## Étape 4 : communiquer

Une bonne conclusion est précise et honnête :

> La médiane du temps de réponse est passée de 13 à 11 minutes. Une demande exceptionnelle de 48 minutes, liée à une panne d'outil, a fait monter la moyenne de la semaine 2.

## Votre tour

Avec la série 25, 30, 28, 32, 27, 90, 29 :

1. Calculez la moyenne et la médiane.
2. Repérez la valeur aberrante.
3. Rédigez une conclusion en deux phrases.

## À retenir

- Calculez plusieurs indicateurs : ils peuvent raconter des histoires différentes.
- Examinez les valeurs aberrantes avant de conclure.
- Communiquez des conclusions précises qui expliquent les chiffres.`,
          },
          {
            type: 'check',
            question: "Pourquoi la médiane donne-t-elle ici une image plus juste de la semaine 2 que la moyenne ?",
            options: [
              "Elle prend en compte toutes les valeurs avec le même poids",
              "Elle ne nécessite pas de ranger les données",
              "Elle est toujours plus petite que la moyenne",
              "Elle n'est pas influencée par la valeur exceptionnelle de 48 minutes",
            ],
            answer: 3,
            explanation: "La médiane dépend de la position centrale, pas de l'amplitude des valeurs extrêmes, contrairement à la moyenne.",
          },
        ],
      },
      {
        id: "maths-et-programmation",
        title: "Traduire un problème mathématique en programme",
        minutes: 8,
        blocks: [
          {
            type: 'text',
            text: `# Traduire un problème mathématique en programme

Un programme applique des formules de façon fiable et répétable sur de grandes quantités de données. Traduire un problème en code suit une démarche simple.

## La démarche

1. **Comprendre** le problème : quelles données, quel résultat ?
2. **Écrire la formule** sur papier.
3. **Décomposer** en étapes.
4. **Coder** chaque étape.
5. **Tester** avec un exemple dont on connaît la réponse.

## Exemple 1 : la moyenne

\`\`\`python
notes = [12, 15, 9, 18, 16]
moyenne = sum(notes) / len(notes)
print(moyenne)   # 14.0
\`\`\`

## Exemple 2 : un prix avec réduction et taxe

Formule : prix final = prix × (1 − réduction) × (1 + taxe).

\`\`\`python
def prix_final(prix, reduction, taxe=0.20):
    return round(prix * (1 - reduction) * (1 + taxe), 2)

print(prix_final(80, 0.25))   # 72.0  → 80 × 0,75 × 1,20
\`\`\`

## Exemple 3 : les indicateurs d'une série

\`\`\`python
from statistics import mean, median

def resume(valeurs):
    return {
        "moyenne": round(mean(valeurs), 1),
        "mediane": median(valeurs),
        "etendue": max(valeurs) - min(valeurs),
    }

print(resume([10, 11, 9, 48, 12, 10, 11]))
# {'moyenne': 15.9, 'mediane': 11, 'etendue': 39}
\`\`\`

## Exemple 4 : gérer les cas impossibles

Les mathématiques interdisent de diviser par zéro ; le programme doit le prévoir :

\`\`\`python
def taux_reussite(reussis, total):
    if total == 0:
        raise ValueError("Le total doit être supérieur à zéro")
    return reussis / total * 100
\`\`\`

## Tester

\`\`\`python
assert prix_final(100, 0.10) == 108.0
assert taux_reussite(18, 24) == 75.0
\`\`\`

Si un test échoue, la formule ou le code contient une erreur.

## Attention à la notation

| Mathématiques | Python |
| --- | --- |
| 3,5 | \`3.5\` |
| 4 × 5 | \`4 * 5\` |
| 2³ | \`2 ** 3\` |
| √9 | \`math.sqrt(9)\` |
| Valeur absolue de −7 | \`abs(-7)\` |

## À retenir

- Formule d'abord, puis étapes, puis code, puis tests.
- Les fonctions rendent un calcul réutilisable et testable.
- Prévoyez les cas impossibles, comme la division par zéro.`,
          },
          {
            type: 'check',
            question: "Comment écrit-on 2 puissance 5 en Python ?",
            options: [
              "2 ^ 5",
              "2 ** 5",
              "pow(5, 2)",
              "2 * 5",
            ],
            answer: 1,
            explanation: "En Python, ** est l'opérateur de puissance. ^ est un opérateur logique (ou exclusif) et pow(5, 2) calcule 5².",
          },
        ],
      },
      {
        id: "evaluation-finale",
        title: "Évaluation finale : fondamentaux mathématiques",
        minutes: 6,
        blocks: [
          {
            type: 'text',
            text: `# Évaluation finale : fondamentaux mathématiques

Félicitations, vous avez parcouru l'ensemble du cours. Utilisez cette révision pour vérifier que vous savez expliquer et appliquer chaque notion.

## Ce que vous devez savoir faire

| Domaine | Compétences |
| --- | --- |
| **Calcul** | Les quatre opérations, l'ordre des opérations, le calcul mental et l'estimation |
| **Fractions et décimaux** | Simplifier, comparer, calculer, arrondir |
| **Pourcentages** | Calculer un pourcentage, une variation, une augmentation ou une réduction |
| **Proportions** | Ratios, règle de trois, échelles |
| **Nombres relatifs** | Comparer, calculer, valeur absolue et distance |
| **Algèbre** | Évaluer et réduire une expression, résoudre une équation, utiliser une formule |
| **Géométrie** | Périmètres, aires, Pythagore, conversions d'unités |
| **Statistiques** | Moyenne, médiane, mode, étendue, écart type, valeurs aberrantes |
| **Probabilités** | Calculer une probabilité, événements indépendants, espérance |
| **Informatique et IA** | Binaire, logique booléenne, vecteurs et matrices |

## Exercices de synthèse

1. Un abonnement coûte 12 € par mois plus 30 € de frais. Écrivez la formule du coût après m mois, puis trouvez m pour un coût total de 150 €. *(C = 12m + 30 ; m = 10)*
2. Un taux de réussite passe de 60 % à 72 %. Quelle est la variation en points, puis en pourcentage ? *(12 points ; +20 %)*
3. Série : 8, 9, 10, 10, 11, 40. Calculez la moyenne et la médiane, et expliquez l'écart. *(Moyenne 14,7 ; médiane 10 ; la valeur 40 tire la moyenne vers le haut)*
4. Convertissez 45 en binaire. *(101101)*
5. Calculez le produit scalaire de [1, 3] et [2, 4]. *(14)*

## Les erreurs les plus fréquentes

- Oublier l'ordre des opérations.
- Additionner les dénominateurs de deux fractions.
- Confondre points de pourcentage et variation relative.
- Utiliser la moyenne quand une valeur extrême fausse le résultat.
- Mélanger des unités incompatibles.

## La suite

Ces bases servent directement dans les cours suivants : statistiques et probabilités pour l'apprentissage automatique, vecteurs pour les embeddings et la recherche sémantique, et formules pour estimer les coûts des systèmes d'IA.

## À retenir

- Révisez chaque domaine et refaites les exercices sans regarder les solutions.
- Ces notions sont les fondations des cours d'IA qui suivent.`,
          },
          {
            type: 'check',
            question: "Un taux passe de 60 % à 72 %. Quelle est sa variation relative ?",
            options: [
              "+12 %",
              "+72 %",
              "+20 %",
              "+1,2 %",
            ],
            answer: 2,
            explanation: "La hausse est de 12 points ; rapportée à la valeur de départ : 12 ÷ 60 = 0,20, soit +20 %.",
          },
        ],
      },
    ],
  },
];

runCourseSeed({ course: COURSE, modules: MODULES, script: 'scripts/mathematics-foundations/seed-mathematiques-fondamentales.mjs' }).catch((error) => {
  console.error('\nSEED FAILED:', error);
  process.exit(1);
});
