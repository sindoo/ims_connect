import { getApp } from '@react-native-firebase/app';
import {
    getMessaging,
    requestPermission,
    AuthorizationStatus,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    RemoteMessage,
} from '@react-native-firebase/messaging';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import WsNotificationService from "./WSNotificationService";
import { NOTIFICATION_NAGIVATION } from "../constants/notification";

const messagingInstance = getMessaging(getApp());

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function setupNotificationChannel() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }
}

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
    }
    catch (e) {
        console.warn('Firebase Messaging non disponible sur cet environnement :', e);
        return false;
    }
}

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

// --- Navigation depuis une notification ---

let pendingNotificationData: Record<string, any> | null = null;

async function navigateFromNotificationData(data: Record<string, any> | undefined) {
    try {
        const rawJsonData = data?.json;
        if (!rawJsonData) return;

        const notificationId: string = typeof rawJsonData === 'object'
            ? JSON.stringify(rawJsonData)
            : String(rawJsonData);

        const notificationData = await WsNotificationService.getUserNotificationById(notificationId);

        const notificationNav: any = NOTIFICATION_NAGIVATION.find(
            (notification: any) => notification.tag === notificationData?.common?.tag,
        );

        if (notificationNav?.value) {
            router.push({
                pathname: notificationNav.value,
                params: { data: JSON.stringify(notificationData) },
            });
        }
        else {
            console.log('Aucune route trouvée pour ce tag :', notificationData?.common?.tag);
        }
    }
    catch (error) {
        console.log(error);
    }
}

// Appelée depuis AppNav une fois l'utilisateur authentifié et le Stack protégé monté
export async function handlePendingNotificationIfAny() {
    const pending = pendingNotificationData;
    pendingNotificationData = null; // consommée une seule fois
    if (pending) {
        await navigateFromNotificationData(pending);
    }
}

export async function handleNotificationRemote(remoteMessage: RemoteMessage | null) {
    await navigateFromNotificationData(remoteMessage?.data);
}

// --- Listeners ---

export function notificationListener() {
    const unsubscribe = onMessage(messagingInstance, async (remoteMessage) => {
        console.log('Notification reçue en premier plan :', remoteMessage);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: remoteMessage.notification?.title ?? 'Nouvelle notification',
                body: remoteMessage.notification?.body ?? '',
                data: remoteMessage.data,
                sound: true,
                ...(Platform.OS === 'android' && { channelId: 'default' }),
            },
            trigger: null,
        });
    });

    // App tap depuis l'arrière-plan
    onNotificationOpenedApp(messagingInstance, async (remoteMessage) => {
        try {
            console.log('App ouverte depuis l\'arrière-plan via notification :');
            await handleNotificationRemote(remoteMessage);
        } catch (error) {
            console.log(error);
        }
    });

    // App relancée depuis l'état fermé (killed) — on met en attente, AppNav consommera
    getInitialNotification(messagingInstance).then((remoteMessage) => {
        if (remoteMessage) {
            console.log('App ouverte depuis l\'état fermé via notification :');
            pendingNotificationData = remoteMessage.data ?? null;
        }
    });

    return unsubscribe;
}

// Clic sur une notif locale affichée pendant que l'app est au premier plan
export function notificationResponseListener() {
    return Notifications.addNotificationResponseReceivedListener(async (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification locale tapée en foreground :', data);
        await navigateFromNotificationData(data as Record<string, any>);
    });
}
