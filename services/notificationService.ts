import { getApp } from '@react-native-firebase/app';
import {
    getMessaging,
    requestPermission,
    AuthorizationStatus,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
} from '@react-native-firebase/messaging';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

const messagingInstance = getMessaging(getApp());

// 1. Demander les permissions
export async function requestUserPermission() {
    if (Platform.OS === 'web') return false;

    try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Permission de notification Android refusée');
                return false;
            }
        }

        const authStatus = await requestPermission(messagingInstance);
        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Statut d\'autorisation:', authStatus);
            await getFcmToken();
        }

        return enabled;
    } catch (e) {
        console.warn('Firebase Messaging non disponible sur cet environnement :', e);
        return false;
    }
}

// 2. Obtenir le token FCM
export async function getFcmToken() {
    try {
        const fcmToken = await getToken(messagingInstance);
        if (fcmToken) {
            console.log('Ton FCM Token Firebase :', fcmToken);
            // TODO: envoyer ce token à ton backend
            return fcmToken;
        }
        console.log('Aucun token reçu');
    } catch (error) {
        console.error('Erreur lors de la récupération du token FCM :', error);
    }
}

// 3. Écouter les notifications
export function notificationListener() {
    const unsubscribe = onMessage(messagingInstance, async (remoteMessage) => {
        console.log('Notification reçue en premier plan :', remoteMessage);
        Alert.alert(
            remoteMessage.notification?.title || 'Nouvelle notification',
            remoteMessage.notification?.body || ''
        );
    });

    onNotificationOpenedApp(messagingInstance, (remoteMessage) => {
        console.log('App ouverte depuis l\'arrière-plan via notification :', remoteMessage);
    });

    getInitialNotification(messagingInstance).then((remoteMessage) => {
        if (remoteMessage) {
            console.log('App ouverte depuis l\'état fermé via notification :', remoteMessage);
        }
    });

    return unsubscribe;
}
