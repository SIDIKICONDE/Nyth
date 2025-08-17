# Mémoire unifiée

Hook React pour gérer la mémoire persistante unifiée de l'application.

## Installation

```typescript
import { useUnifiedMemory } from "../hooks/useUnifiedMemory";
```

## Usage basique

```typescript
const MyComponent = () => {
  const { memories, isLoading, refreshMemory, addMemory, deleteMemory, stats } =
    useUnifiedMemory();

  useEffect(() => {
    refreshMemory();
  }, [refreshMemory]);

  return (
    <View>
      {memories.map((entry) => (
        <Text key={entry.id}>{entry.content}</Text>
      ))}
    </View>
  );
};
```

## API

### Propriétés retournées

| Propriété       | Type                                | Description         |
| --------------- | ----------------------------------- | ------------------- |
| `memories`      | `MemoryEntry[]`                     | Entrées mémoire     |
| `isLoading`     | `boolean`                           | État de chargement  |
| `refreshMemory` | `() => Promise<void>`               | Recharge la mémoire |
| `addMemory`     | `(entry) => Promise<string>`        | Ajoute une entrée   |
| `deleteMemory`  | `(id: string) => Promise<void>`     | Supprime une entrée |
| `stats`         | `{ totalEntries; byCategory; ... }` | Statistiques        |

### Types

```typescript
interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  category: "preference" | "rule" | "context" | "correction" | "fact";
  importance: "high" | "medium" | "low";
  timestamp: string;
  userId: string;
  citationRequired: boolean;
  tags?: string[];
}
```

## Exemples

### Ajouter une préférence

```typescript
await addMemory({
  title: "Préférence de ton",
  content: "Utilisateur préfère un ton décontracté",
  category: "preference",
  importance: "medium",
  citationRequired: true,
});
```

### Obtenir les statistiques

```typescript
console.log(`Total: ${stats?.totalEntries}`);
console.log(`Par catégorie:`, stats?.byCategory);
```

### Supprimer une entrée

```typescript
await deleteMemory(entry.id);
```

## Intégration MessageHandler

Le hook est automatiquement utilisé dans `MessageHandler.tsx` pour :

- Détecter les patterns de mémorisation
- Sauvegarder automatiquement les informations importantes
- Inclure la mémoire dans le contexte IA

## Stockage

- Stockage unique unifié via `MemoryManager`
- Limite et tri gérés par le service unifié
