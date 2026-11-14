import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

// État de connexion de l'app. Deux sources :
// - NetInfo (natif) : détecte instantanément la perte du Wi-Fi / des données
//   mobiles, ou un réseau sans accès à Internet ;
// - les appels API : une requête sans réponse alors que le téléphone est
//   connecté signifie que le serveur est injoignable.
// La première réponse du serveur (même une erreur 4xx/5xx) repasse l'app en ligne.
export type OfflineReason = 'network' | 'server';
type Listener = (isOffline: boolean, reason: OfflineReason) => void;

let offline = false;
let reason: OfflineReason = 'network';
// null = inconnu (NetInfo pas encore initialisé)
let deviceConnected: boolean | null = null;
const listeners = new Set<Listener>();

export const isOffline = () => offline;
export const getOfflineReason = () => reason;

export const setOffline = (value: boolean, newReason: OfflineReason = reason) => {
    if (offline === value && reason === newReason) return;
    offline = value;
    reason = newReason;
    listeners.forEach(listener => listener(offline, reason));
};

// Requête sans réponse : coupure réseau si le téléphone n'est pas connecté
// (ou si on ne le sait pas encore), sinon serveur injoignable.
export const reportRequestWithoutResponse = () => {
    setOffline(true, deviceConnected === true ? 'server' : 'network');

    // On ne parle de "serveur injoignable" que si NetInfo confirme qu'Internet
    // est accessible (ex. 4G affichée mais sans forfait data = pas d'Internet).
    NetInfo.fetch()
        .then((state: NetInfoState) => {
            if (!offline) return;
            const internetConfirmed = state.isConnected === true && state.isInternetReachable === true;
            setOffline(true, internetConfirmed ? 'server' : 'network');
        })
        .catch(() => {});
};

export const subscribeConnectivity = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

// Branche NetInfo. `checkServer` interroge le serveur : sa réponse (ou son
// absence) tranche, via l'intercepteur axios, entre en ligne et hors ligne.
//
// - isConnected === false : aucun réseau (Wi-Fi et données coupés) -> certain,
//   le bandeau s'affiche tout de suite.
// - isInternetReachable === false : NetInfo n'a pas pu joindre Internet, mais
//   ce test est peu fiable lors d'un changement de réseau (Wi-Fi -> 4G) : on
//   ne l'affiche que si le serveur ne répond pas non plus.
// - réseau disponible alors qu'on était hors ligne : on vérifie le serveur
//   avant de masquer le bandeau.
export const startNetworkMonitoring = (checkServer: () => void) =>
    NetInfo.addEventListener((state: NetInfoState) => {
        if (state.isConnected === false) {
            deviceConnected = false;
            setOffline(true, 'network');
            return;
        }

        if (state.isInternetReachable === false) {
            // Un échec du serveur sera alors attribué au réseau, pas au serveur
            deviceConnected = false;
            checkServer();
            return;
        }

        const wasConnected = deviceConnected;
        deviceConnected = state.isConnected === true ? true : deviceConnected;
        if (offline || wasConnected === false) {
            checkServer();
        }
    });

// Erreur réseau : la requête est partie mais aucune réponse n'est revenue.
// Exclut les requêtes annulées volontairement et les identifiants manquants
// (requête jamais envoyée, voir ApiManager).
export const isNetworkError = (error: any): boolean => {
    if (!error || error?.isMissingParam) return false;
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
        return false;
    }
    if (error?.response) return false;
    return (
        error?.code === 'ERR_NETWORK'
        || error?.code === 'ECONNABORTED'
        || error?.code === 'ETIMEDOUT'
        || error?.message === 'Network Error'
        || !!error?.request
    );
};
