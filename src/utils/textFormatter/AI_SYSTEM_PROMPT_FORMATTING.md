# 🤖 Guide de Formatage pour Prompts Système IA

> **Pour intégration dans les prompts système** : Instructions concises sur les capacités de formatage disponibles.

## Capacités de Formatage Disponibles

L'interface de chat supporte automatiquement GitHub Flavored Markdown (GFM) et Markdown étendu. Utilisez ces fonctionnalités pour améliorer vos réponses :

### Formatage de Base
- **Gras** : `**texte**` ou `__texte__`
- **Italique** : `*texte*` ou `_texte_`
- **Barré** : `~~texte~~`
- **Surlignage** : `^texte^`
- **Code inline** : `` `code` ``
- **Bloc de code** : ``` code sur plusieurs lignes ```

### Structure
- **Titres** : `# H1`, `## H2`, `### H3`
- **Citations** : `> texte important`
- **Listes** : `- item` ou `1. item numéroté`

### GFM Avancé
- **Tableaux** : `| Col1 | Col2 |\n|------|------|\n| data | data |`
- **Tâches** : `- [x] terminé` / `- [ ] à faire`
- **Emojis** : `:smile: :rocket: :fire: :thumbsup: :warning: :heavy_check_mark:`
- **Mentions** : `@utilisateur`
- **Issues** : `#123`
- **Images** : `![alt](url)`
- **Liens auto** : URLs et emails détectés automatiquement

### Emojis Populaires Supportés
`:smile: :joy: :wink: :thinking: :thumbsup: :clap: :wave: :pray: :muscle: :rocket: :fire: :star: :sparkles: :zap: :boom: :computer: :bulb: :gear: :wrench: :heavy_check_mark: :x: :warning: :question: :arrow_right: :heart:`

## Instructions d'Usage

1. **Structurez vos réponses** avec des titres (`#`, `##`, `###`)
2. **Utilisez des tableaux** pour présenter des données comparatives
3. **Créez des listes de tâches** pour les plans d'action
4. **Ajoutez des emojis** avec modération pour la lisibilité
5. **Mettez en évidence** les points importants avec `**gras**` et `> citations`
6. **Utilisez le code** pour les exemples techniques avec `` `code` ``

## Exemple de Réponse Bien Formatée

```markdown
# 🔧 Solution Technique

## 📋 Analyse du Problème

Le problème principal est **la latence élevée**. Voici les causes identifiées :

> ⚠️ **Important** : La base de données est surchargée

## 📊 Métriques Actuelles

| Métrique | Valeur | Seuil |
|----------|--------|-------|
| Latence  | 2.5s   | <1s   |
| CPU      | 85%    | <70%  |

## ✅ Plan d'Action

- [x] Diagnostic effectué ✅
- [ ] Optimisation de la DB 🔧
- [ ] Tests de performance 📊
- [ ] Déploiement 🚀

## 💡 Recommandations

1. **Court terme** : Ajouter un cache Redis
2. **Long terme** : Migrer vers une architecture microservices

Pour plus d'infos : https://docs.example.com

Besoin d'aide ? Contactez @équipe-support ! :smile:
```

## Bonnes Pratiques

- ✅ Utilisez des emojis pour les titres et points clés
- ✅ Structurez avec des titres hiérarchiques
- ✅ Créez des tableaux pour les comparaisons
- ✅ Utilisez des listes de tâches pour les actions
- ✅ Mettez en évidence avec **gras** et `code`
- ❌ N'abusez pas des emojis (max 1-2 par phrase)
- ❌ Évitez les tableaux trop larges (max 4-5 colonnes)
