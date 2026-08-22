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
import * as Notifications from 'expo-notifications';

const messagingInstance = getMessaging(getApp());

// Comment la notif doit se comporter si elle arrive pendant que l'app est ouverte
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Canal obligatoire sur Android 8+ pour que la notif s'affiche correctement
export async function setupNotificationChannel() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }
}

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

        console.log('Statut d\'autorisation:', authStatus);
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
            return fcmToken;
        }
        console.log('Aucun token reçu');
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération du token FCM :', error);
        return null;
    }
}

// 3. Écouter les notifications
export function notificationListener() {
    const unsubscribe = onMessage(messagingInstance, async (remoteMessage) => {
        console.log('Notification reçue en premier plan :', remoteMessage);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: remoteMessage.notification?.title ?? 'Nouvelle notification',
                body: remoteMessage.notification?.body ?? '',
                data: remoteMessage.data, // pour retrouver le payload au clic
                sound: true,
            },
            trigger: null, // null = affichage immédiat
        });
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

export function notificationResponseListener() {
    return Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('Notification locale tapée en foreground :', data);
        // ex: router.push(`/enfant/${data.childId}`)
    });
}
