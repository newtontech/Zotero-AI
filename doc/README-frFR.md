# Zotero AI

Zotero AI apporte dans Zotero un espace de connaissance inspiré de Bohrium. Vous pouvez dialoguer avec un article, ses PDF liés ou un dossier entier en utilisant vos modèles LLM favoris tout en gardant les données localement.

## Fonctionnalités

- **Espace de travail local** : chat multi-tours qui suit la sélection Zotero et mémorise l’historique.
- **Réponses sensibles aux PDF** : résumés et questions prennent en compte les pièces jointes.
- **Raisonnement sur les collections** : comparer ou combiner plusieurs éléments d’un dossier avant d’interroger le modèle.
- **Fournisseurs configurables** : clés et modèles OpenAI ou DeepSeek dans les préférences.
- **Contrôle du ton** : alternez entre concis, détaillé ou créatif sans modifier vos prompts.

## Installation

### Installation rapide (0.0.1-beta précompilé)

1. Téléchargez l’XPI prêt à l’emploi (aucune compilation requise) :
   - Depuis ce dépôt : [`release/zotero-ai-0.0.1-beta.xpi`](../release/zotero-ai-0.0.1-beta.xpi)
   - Lien brut : <https://raw.githubusercontent.com/Zotero-AI/Zotero-AI/main/release/zotero-ai-0.0.1-beta.xpi>
2. Dans Zotero, ouvrez **Outils → Modules complémentaires**, cliquez sur **Installer un module depuis un fichier…** et sélectionnez l’XPI téléchargé.
3. Les mises à jour bêta automatiques utilisent `release/update-beta.json`, ce qui évite toute recompilation.

### Construire depuis les sources

1. Installer Node.js LTS et Zotero 7.
2. Installer les dépendances :
   ```sh
   npm install
   ```
3. Construire le paquet XPI :
   ```sh
   npm run build
   ```
   Le fichier généré se trouve dans `.scaffold/build`.
4. Dans Zotero, ouvrez **Outils → Modules complémentaires**, choisissez **Installer un module depuis un fichier…** et sélectionnez l’XPI.

## Configuration

Dans **Édition → Préférences → Zotero AI**, renseignez vos clés API, modèles par défaut, portée de conversation (élément, collection ou automatique) et ton de réponse. Les paramètres restent locaux et alimentent l’espace IA.

## Utilisation

- Sélectionnez un ou plusieurs éléments ou un dossier, puis ouvrez la section **Espace IA** dans le panneau des items.
- Cliquez sur **Ouvrir l’interface de chat** (ou l’entrée de menu contextuel) pour démarrer un dialogue multi-tours qui s’appuie sur la sélection et les PDF liés.
- Actualisez le contexte lorsque vous changez de sélection ou de dossier.

## Développement

- Rechargement à chaud : `npm run start`
- Vérifications de code : `npm run lint:check`
- Construction avant soumission : `npm run build`

Les contributions pour enrichir les flux IA (meilleur contexte, prompts, nouveaux fournisseurs) sont les bienvenues.
