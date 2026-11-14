// Nombre de requêtes API en cours (alimenté par les intercepteurs axios de
// ApiManager). Sert à savoir quand l'écran a fini de charger ses données,
// par exemple après un changement d'enfant.
type Listener = (pending: number) => void;

const store = {pending: 0};
const listeners = new Set<Listener>();

const notify = () => listeners.forEach(listener => listener(store.pending));

export const getPendingRequests = () => store.pending;

export const requestStarted = () => {
    store.pending += 1;
    notify();
};

export const requestEnded = () => {
    store.pending = Math.max(0, store.pending - 1);
    notify();
};

export const subscribePendingRequests = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
