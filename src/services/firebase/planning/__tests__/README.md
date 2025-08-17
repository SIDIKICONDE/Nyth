# Tests du Système de Planification

## Vue d'ensemble

Cette suite de tests couvre l'ensemble du système de planification de l'application, incluant :
- Services Firebase (événements, tâches, objectifs, équipes, projets)
- Intégration du calendrier natif
- Service de notifications
- Analytics et rapports
- Outils IA pour la planification

## Structure des tests

```
__tests__/
├── setup.ts                    # Configuration et mocks globaux
├── planningService.test.ts     # Tests du service principal
├── tasksService.test.ts        # Tests de gestion des tâches
├── eventsService.test.ts       # Tests de gestion des événements
└── README.md                   # Documentation
```

## Exécution des tests

### Tous les tests
```bash
npm test
```

### Tests spécifiques au système de planification
```bash
npm test -- --selectProjects="Planning Services"
```

### Tests avec couverture de code
```bash
npm test -- --coverage
```

### Tests en mode watch
```bash
npm test -- --watch
```

### Tests d'un fichier spécifique
```bash
npm test -- tasksService.test.ts
```

## Couverture de code

Les seuils de couverture minimaux sont :
- **Branches** : 80%
- **Functions** : 80%
- **Lines** : 85%
- **Statements** : 85%

Pour générer un rapport de couverture détaillé :
```bash
npm test -- --coverage --coverageReporters=html
open coverage/lcov-report/index.html
```

## Mocks et helpers

### Création de données de test

Le fichier `setup.ts` fournit des helpers pour créer des données mockées :

```typescript
import { createMockTask, createMockEvent, createMockGoal } from './setup';

const task = createMockTask({
  title: 'Custom Task',
  priority: 'high'
});
```

### Mocks Firebase

Tous les services Firebase sont automatiquement mockés :
- Firestore (collection, doc, query, etc.)
- Auth (currentUser, signIn, etc.)
- Storage (upload, download, delete)

## Patterns de test

### Test d'un service asynchrone

```typescript
it('devrait créer une tâche', async () => {
  const mockTask = createMockTask();
  const mockDocRef = { id: 'new-task-id' };
  
  (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
  
  const result = await tasksService.createTask(mockTask);
  
  expect(addDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining(mockTask)
  );
  expect(result).toBe('new-task-id');
});
```

### Test de gestion d'erreur

```typescript
it('devrait gérer les erreurs', async () => {
  const error = new Error('Firestore error');
  (addDoc as jest.Mock).mockRejectedValue(error);
  
  await expect(tasksService.createTask(mockTask))
    .rejects.toThrow('Firestore error');
});
```

### Test de subscription

```typescript
it('devrait s\'abonner aux changements', () => {
  const callback = jest.fn();
  const unsubscribe = jest.fn();
  
  (onSnapshot as jest.Mock).mockImplementation((query, cb) => {
    cb(mockSnapshot);
    return unsubscribe;
  });
  
  const result = service.subscribeToTasks(userId, callback);
  
  expect(callback).toHaveBeenCalledWith(expectedData);
  expect(result).toBe(unsubscribe);
});
```

## Cas de test couverts

### Service de tâches (TasksService)
- ✅ Création de tâches avec validation
- ✅ Récupération par utilisateur/projet/statut
- ✅ Mise à jour avec conversion de dates
- ✅ Suppression sécurisée
- ✅ Gestion des sous-tâches
- ✅ Subscription temps réel

### Service d'événements (EventsService)
- ✅ Création d'événements avec rappels
- ✅ Filtrage par dates
- ✅ Événements récurrents
- ✅ Synchronisation calendrier
- ✅ Notifications automatiques

### Intégration calendrier
- ✅ Permissions iOS/Android
- ✅ Synchronisation bidirectionnelle
- ✅ Gestion des rappels
- ✅ Événements récurrents
- ✅ Suppression sécurisée

### Service principal (PlanningService)
- ✅ Pattern Singleton
- ✅ Orchestration des sous-services
- ✅ Gestion unifiée des erreurs
- ✅ Cache et optimisations

## Debugging

### Activer les logs détaillés
```typescript
// Dans le test
jest.spyOn(console, 'log').mockImplementation();
// Après le test
expect(console.log).toHaveBeenCalledWith(expect.stringContaining('debug'));
```

### Inspecter les appels de mock
```typescript
console.log((addDoc as jest.Mock).mock.calls);
```

### Tester avec de vraies dates
```typescript
// Désactiver le mock de Date temporairement
const RealDate = Date;
global.Date = RealDate;
// ... test ...
// Réactiver le mock
global.Date = MockDate;
```

## CI/CD

Les tests sont automatiquement exécutés dans le pipeline CI avec :
- Validation de la couverture minimale
- Génération de rapports JUnit
- Upload des résultats vers SonarQube

## Maintenance

### Ajout de nouveaux tests

1. Créer le fichier dans `__tests__/`
2. Importer `./setup` pour les mocks
3. Suivre les patterns existants
4. Vérifier la couverture

### Mise à jour des mocks

Les mocks globaux sont dans `setup.ts`. Pour ajouter un nouveau mock :

```typescript
jest.mock('@nouveau/module', () => ({
  fonction: jest.fn(),
}));
```

## Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro)
- [Firebase Test Lab](https://firebase.google.com/docs/test-lab)

## Contact

Pour toute question sur les tests, contactez l'équipe de développement.