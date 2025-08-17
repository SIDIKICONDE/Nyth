# Profile Analytics Module

Ce module contient tous les composants et la logique pour afficher les analytics du profil utilisateur.

## Structure

```
profile-analytics/
├── components/         # Composants React
│   ├── StatsCards.tsx      # Cartes de statistiques (temps moyen, productivité, etc.)
│   ├── WeekActivityChart.tsx    # Graphique d'activité sur 7 jours
│   ├── HourlyDistribution.tsx   # Distribution horaire des activités
│   └── InsightsSection.tsx      # Section insights (jour le plus actif, streak, etc.)
├── hooks/             # Hooks personnalisés
│   └── useProfileAnalytics.ts   # Hook principal pour calculer les analytics
├── types/             # Types TypeScript
│   └── analytics.ts             # Types pour les données analytics
├── utils/             # Fonctions utilitaires
│   └── analytics.ts             # Fonctions helper (formatDuration, createLinePath)
└── index.ts           # Exports du module
```

## Utilisation

```tsx
import ProfileAnalytics from './ProfileAnalytics';

// Dans votre composant
<ProfileAnalytics />
```

Le composant principal `ProfileAnalytics` utilise automatiquement tous les sous-composants et hooks nécessaires.

## Composants

### StatsCards
Affiche les cartes de statistiques principales :
- Activité de la semaine avec tendance
- Productivité (enregistrements par script)
- Temps moyen par enregistrement
- Heure de pointe

### WeekActivityChart
Graphique SVG montrant l'activité des 7 derniers jours avec :
- Grille et échelle
- Courbe d'activité
- Points de données
- Zone sous la courbe avec gradient

### HourlyDistribution
Graphique en barres montrant la distribution des activités par heure (24h).

### InsightsSection
Section d'insights avec :
- Jour le plus actif
- Temps total de la semaine
- Série actuelle (streak)

## Hooks

### useProfileAnalytics
Hook principal qui calcule toutes les métriques analytics à partir des données de scripts et d'enregistrements.

## Types

Les types principaux sont :
- `Analytics` : Type principal contenant toutes les métriques
- `DayActivity` : Activité par jour
- `HourlyActivity` : Activité par heure 