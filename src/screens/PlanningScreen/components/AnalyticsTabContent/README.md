# AnalyticsTabContent - Architecture Refactorisée

## 📁 Structure des fichiers

```
AnalyticsTabContent/
├── index.ts                    # Point d'entrée principal
├── AnalyticsTabContent.tsx     # Composant principal refactorisé
├── types.ts                    # Types et interfaces
├── constants.ts                # Constantes et configurations
├── README.md                   # Documentation
├── components/                 # Composants UI
│   ├── index.ts
│   ├── AnalyticsHeader.tsx     # En-tête avec bouton refresh
│   ├── PeriodSelector.tsx      # Sélecteur de période
│   ├── DebugSection.tsx        # Section de débogage (dev only)
│   ├── MetricCard.tsx          # Carte de métrique individuelle
│   ├── AnalyticsContent.tsx    # Contenu principal (événements/objectifs)
│   ├── EmptyState.tsx          # État vide
│   └── LoadingState.tsx        # État de chargement
└── hooks/                      # Hooks personnalisés
    ├── useAnalyticsData.ts     # Gestion des données analytics
    └── useAnalyticsActions.ts  # Actions (refresh, test, etc.)
```

## 🔧 Composants

### **AnalyticsTabContent.tsx**

- Composant principal orchestrateur
- Utilise les hooks personnalisés pour la logique
- Assemble tous les sous-composants

### **Composants UI**

#### **AnalyticsHeader**

- Affiche le titre "📊 Analytics"
- Bouton de refresh des données
- Désactivé pendant le chargement

#### **PeriodSelector**

- Sélection de période (semaine, mois, trimestre, année)
- Interface avec boutons et icônes
- Gère l'état actif visuellement

#### **DebugSection** (DEV ONLY)

- Informations de débogage détaillées
- Statut d'authentification et connexion Firebase
- Boutons de test (Log, Chargement, Firebase)
- Affichage des événements récents

#### **MetricCard**

- Carte de métrique réutilisable
- Support des icônes et couleurs personnalisées
- Affichage valeur + titre + sous-titre

#### **AnalyticsContent**

- Section principale avec métriques
- Événements et objectifs
- Alertes pour événements en retard

#### **EmptyState**

- Affiché quand aucune donnée disponible
- Cartes de suggestions pour commencer

#### **LoadingState**

- Indicateur de chargement avec spinner
- Messages contextuels (chargement vs calcul)

## 🎣 Hooks Personnalisés

### **useAnalyticsData**

- Gestion de l'état des données analytics
- Calculs des métriques locales
- Interface avec usePlanning
- Logs de débogage automatiques

**Retourne :**

```typescript
{
  // State
  selectedPeriod,
    setSelectedPeriod,
    analytics,
    isCalculating,
    debugInfo,
    localAnalytics,
    // Data
    events,
    goals,
    isLoading,
    error,
    user,
    // Actions
    refreshData,
    createEvent;
}
```

### **useAnalyticsActions**

- Actions utilisateur (refresh, test, création)
- Gestion des alertes et messages
- Tests de connectivité Firebase

**Retourne :**

```typescript
{
  handleRefreshData;
}
```

## 📊 Types

### **PeriodType**

```typescript
type PeriodType = "week" | "month" | "quarter" | "year";
```

### **LocalAnalytics**

```typescript
interface LocalAnalytics {
  totalEvents: number;
  eventsCompleted: number;
  eventsInProgress: number;
  eventsPlanned: number;
  eventsOverdue: number;
  completionRate: number;
  totalGoals: number;
  goalsCompleted: number;
  goalsActive: number;
  goalCompletionRate: number;
  periodEvents: any[];
  allEvents: number;
}
```

### **DebugInfo**

```typescript
interface DebugInfo {
  userId?: string;
  userEmail?: string;
  isUserAuthenticated: boolean;
  eventsCount: number;
  goalsCount: number;
  isLoading: boolean;
  error: string | null;
  events: Array<EventSummary>;
  goals: Array<GoalSummary>;
  hasFirebaseConnection: boolean;
  timestamp: string;
}
```

## 🚀 Avantages de la Refactorisation

### **Maintenabilité**

- Code modulaire et réutilisable
- Séparation claire des responsabilités
- Tests unitaires plus faciles

### **Performance**

- Hooks optimisés avec useMemo et useCallback
- Re-renders minimisés par composant
- Chargement conditionnel des fonctionnalités

### **Développement**

- Ajout de nouvelles fonctionnalités facilité
- Debug amélioré avec section dédiée
- Types TypeScript stricts

### **Réutilisabilité**

- MetricCard réutilisable ailleurs
- Hooks personnalisés exportables
- Composants UI indépendants

## 🔍 Outils de Diagnostic

La section debug (visible en mode développement) offre :

1. **Informations utilisateur** : Email, authentification, ID
2. **État des données** : Nombre d'événements/objectifs, erreurs
3. **Connexion Firebase** : Statut, dernière mise à jour
4. **Tests interactifs** :
   - Log complet des informations
   - Test de chargement des données
   - Test de connexion Firebase directe

## 📝 Utilisation

```typescript
import { AnalyticsTabContent } from "./AnalyticsTabContent";

// Dans votre écran Planning
<AnalyticsTabContent />;
```

Le composant est entièrement autonome et gère son propre état via les hooks personnalisés.
