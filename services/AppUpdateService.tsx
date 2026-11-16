import {Platform} from 'react-native';
import * as Application from 'expo-application';
import {
    fetchAndActivate,
    getRemoteConfig,
    getValue,
} from '@react-native-firebase/remote-config';

// Identifiants des stores, utilisés pour interroger l'API Apple (iOS) et
// pour construire le lien de la fiche Play Store (Android). À garder
// synchronisés avec "ios.bundleIdentifier" et "android.package" dans
// app.json si jamais ils changent.
const IOS_BUNDLE_ID = 'com.appstore.IMS';
const ANDROID_PACKAGE = 'ims.connect.app';
const ANDROID_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

// Clé Firebase Remote Config à créer manuellement dans la console Firebase
// (Remote Config > Ajouter un paramètre), et à mettre à jour à chaque
// publication d'une nouvelle version sur le Play Store : il n'existe pas,
// côté Google, d'équivalent public à l'iTunes Lookup API d'Apple.
const REMOTE_CONFIG_ANDROID_VERSION_KEY = 'android_latest_version';

// Le SDK Remote Config garde en cache la valeur récupérée pendant
// "minimumFetchIntervalMillis" : un fetchAndActivate() pendant cette fenêtre
// renvoie la valeur en cache, même si elle vient de changer côté console
// Firebase. La valeur par défaut du SDK (12 h) retardait d'autant l'annonce
// d'une mise à jour. On la ramène à 1 h en production (0 en développement) :
// au plus une requête par heure et par téléphone, très en dessous des limites
// de Firebase.
const ANDROID_MIN_FETCH_INTERVAL_MS = __DEV__ ? 0 : 60 * 60 * 1000;

type StoreInfo = {latestVersion: string; storeUrl: string};

// Compare deux versions "x.y.z" (nombre de segments variable toléré) et
// renvoie true si "remoteVersion" est strictement plus récente que
// "installedVersion". Comparaison segment par segment plutôt que
// comparaison de chaînes, pour que "0.0.9" soit bien vu comme plus ancien
// que "0.0.10" (une comparaison de chaînes classerait "0.0.9" après
// "0.0.10", ce qui serait faux).
const isVersionNewer = (remoteVersion: string, installedVersion: string) => {
    const remoteParts = remoteVersion.split('.').map(Number);
    const installedParts = installedVersion.split('.').map(Number);
    const length = Math.max(remoteParts.length, installedParts.length);

    for (let i = 0; i < length; i++) {
        const remoteSegment = remoteParts[i] || 0;
        const installedSegment = installedParts[i] || 0;
        if (remoteSegment > installedSegment) return true;
        if (remoteSegment < installedSegment) return false;
    }
    return false;
};

// Interroge l'iTunes Lookup API (officielle, gratuite, sans clé requise)
// pour connaître la dernière version publiée sur l'App Store, à partir du
// bundle identifier de l'app. "trackViewUrl" est directement le lien vers
// la fiche App Store, pratique pour rediriger l'utilisateur d'un tap.
const getIosStoreInfo = async (): Promise<StoreInfo | null> => {
    const response = await fetch(
        `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&country=fr`,
    );
    const json = await response.json();
    const result = json?.results?.[0];
    if (!result?.version) return null;

    return {latestVersion: result.version, storeUrl: result.trackViewUrl};
};

// Lit la dernière version connue pour Android depuis Firebase Remote
// Config. API modulaire (v22+, même famille que getApp/getMessaging
// utilisés dans _layout.tsx) : "settings" et "defaultConfig" se fixent par
// affectation directe sur l'instance, pas via des fonctions setConfigSettings
// /setDefaults (celles-ci n'existent plus). "defaultConfig" fixe la valeur
// de repli sur la version installée elle-même : si le fetch échoue (pas de
// réseau, paramètre pas encore créé côté console Firebase...), on
// considère par défaut qu'il n'y a PAS de mise à jour, plutôt que
// d'afficher à tort le bandeau à tous les utilisateurs.
const getAndroidStoreInfo = async (
    installedVersion: string,
): Promise<StoreInfo | null> => {
    const remoteConfigInstance = getRemoteConfig();
    remoteConfigInstance.settings = {
        minimumFetchIntervalMillis: ANDROID_MIN_FETCH_INTERVAL_MS,
    };
    remoteConfigInstance.defaultConfig = {
        [REMOTE_CONFIG_ANDROID_VERSION_KEY]: installedVersion,
    };

    await fetchAndActivate(remoteConfigInstance);

    const latestVersion = getValue(
        remoteConfigInstance,
        REMOTE_CONFIG_ANDROID_VERSION_KEY,
    ).asString();
    if (!latestVersion) return null;

    return {latestVersion, storeUrl: ANDROID_STORE_URL};
};

// Point d'entrée : compare la version installée sur le téléphone à la
// dernière version publiée sur le store correspondant à la plateforme, et
// renvoie les infos nécessaires à l'affichage du bandeau (latestVersion +
// storeUrl), ou null si aucune mise à jour n'est disponible, si la
// plateforme n'est ni iOS ni Android (ex : web), ou en cas d'erreur
// réseau/API. On échoue toujours silencieusement ici : une simple
// vérification de version ne doit jamais bloquer ni planter l'app.
export const checkForAppUpdate = async (): Promise<StoreInfo | null> => {
    const installedVersion = Application.nativeApplicationVersion;
    if (!installedVersion) return null;

    try {
        const storeInfo =
            Platform.OS === 'ios'
                ? await getIosStoreInfo()
                : Platform.OS === 'android'
                    ? await getAndroidStoreInfo(installedVersion)
                    : null;

        if (!storeInfo) return null;

        return isVersionNewer(storeInfo.latestVersion, installedVersion)
            ? storeInfo
            : null;
    } catch (error) {
        console.log('[AppUpdateService] Erreur vérification de version:', error);
        return null;
    }
};

const AppUpdateService = {
    checkForAppUpdate,
};

export default AppUpdateService;
