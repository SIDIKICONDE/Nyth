/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";

// For cost control, you can set the maximum number of containers that can be
// running at any given time. This setting is recommended to prevent
// out-of-control billing growth due to function invocations.
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Exports des proxies sécurisés (obligent un Firebase ID token)
export { mistralProxy } from "./mistralProxy";
export { openaiProxy } from "./openaiProxy";
export { embeddingsProxy } from "./embeddingsProxy";
export { recalculateAnalytics } from "./analytics";

// Exports des fonctions d'abonnement (onCall, authentifiées)
export {
  getManagedAPIKey,
  saveSubscription,
  getSubscription,
  cancelSubscription,
  trackAPIUsage,
} from "./subscriptionFunctions";
