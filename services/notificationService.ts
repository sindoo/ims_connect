// notificationService.ts
import { getApp } from '@react-native-firebase/app';
import {
    getMessaging,
    getToken,
    onMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import WsNotificationService from "./WSNotificationService";
import { NOTIFICATION_NAGIVATION } from "../constants/notification";
import { store } from '../redux/store';
import { changeChild } from '../redux/features/child/childSlice';
import {
    setAllAppointmentList,
    setAppointmentDetailsInRedux,
    setPresetAppointmentList
} from '../redux/features/appointment/appointmentSlice';
import { setDataNotification, setAlertMessageHeader } from '../redux/features/alertmessage/alertMessageSlide';
import AppointmentService from '../services/AppointmentService';

// ✅ Configuration de l'affichage des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ✅ Variables de gestion
let isNavigating = false;
let pendingNotificationData: any = null;
let isAppReady = false;
let pendingNavigationCallback: (() => void) | null = null;

// ✅ Marquer l'app comme prête
export const markAppReady = (ready: boolean) => {
    console.log('📱 markAppReady:', ready);
    isAppReady = ready;
    if (ready && pendingNavigationCallback) {
        console.log('✅ Exécution de la navigation en attente');
        const callback = pendingNavigationCallback;
        pendingNavigationCallback = null;
        setTimeout(callback, 300);
    }
};

// ✅ Setup des canaux de notification
export async function setupNotificationChannel() {
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
            });
        } catch (error) {
            console.log('Erreur setup channel:', error);
        }
    }
}

// ✅ Demande de permission
export async function requestUserPermission() {
    if (Platform.OS === 'web') return false;

    try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Permission Android refusée');
                return false;
            }
        }

        const { status: expoStatus } = await Notifications.getPermissionsAsync();
        if (expoStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        }
        return true;
    } catch (error) {
        console.log('Erreur permission:', error);
        return false;
    }
}

// ✅ Récupération du token FCM
export async function getFcmToken() {
    if (!isAppReady) {
        console.log('⏳ App pas prête, impossible de récupérer le token FCM');
        return null;
    }

    try {
        const app = getApp();
        const messaging = getMessaging(app);
        const token = await getToken(messaging);
        if (token) {
            console.log('FCM Token récupéré');
            return token;
        }
        return null;
    } catch (error) {
        console.log('Erreur token FCM:', error);
        return null;
    }
}

/**
 * Gère le changement d'enfant sélectionné
 */
const handleChangeChild = (childId: number) => {
    const state = store.getState();
    const { children } = state.child;

    if (children.length > 0 && childId) {
        const findChild = children.find(
            (child: any) => child?.person?.id === childId,
        );
        if (findChild) {
            store.dispatch(changeChild(findChild));
            return findChild;
        }
    }
    return null;
};

/**
 * Gère la navigation pour les notifications de rendez-vous
 */
const handleAppointmentNotification = async (
    notificationData: any,
    newNotificationData: any,
    routePath: string
) => {
    const state = store.getState();
    const { children, selectedChild } = state.child;
    const dispatch = store.dispatch;

    if (newNotificationData?.message?.meetingType === 'NORMAL') {
        const creneauRdvEnfantParents = newNotificationData?.message?.creneauRdvs[0]?.creneauRdvEnfantParents;
        if (creneauRdvEnfantParents?.length > 0 && creneauRdvEnfantParents[0]?.enfantId) {
            handleChangeChild(creneauRdvEnfantParents[0]?.enfantId);
        }

        // Récupération des rendez-vous pour l'enfant sélectionné
        const selectedChildState = store.getState().child.selectedChild;
        if (selectedChildState?.person?.id) {
            const appointmentReq = await AppointmentService.getAllAppointment(selectedChildState.person.id);
            dispatch(setAllAppointmentList(appointmentReq));
        }

        const appointmentDetails = await AppointmentService.getAppointmentById(newNotificationData?.message?.id);
        let pathname = '/(drawer)/(tabs)/appointment/all-appointment';
        if(appointmentDetails !== undefined && appointmentDetails !== null){
            dispatch(setAppointmentDetailsInRedux(appointmentDetails));
            pathname = '/pages/appointment';
        }
        // Navigation vers la liste des rendez-vous
        setTimeout(() => {
            router.push({
                pathname: pathname,
                params: {
                    data: JSON.stringify(appointmentDetails?.id)
                }
            });
        }, 400);
    }
    else if (newNotificationData?.message?.meetingType === 'PRESET') {
        // Trouver l'enfant correspondant à la classe
        if (newNotificationData?.message?.classeId) {
            for (let i = 0; i < children.length; i++) {
                const classroomId = children[i]?.eleves[0]?.classe?.id;
                if (newNotificationData.message.classeId === classroomId) {
                    handleChangeChild(children[i]?.person?.id);
                    break;
                }
            }
        }

        // Récupération des rendez-vous pour l'enfant sélectionné
        const selectedChildState = store.getState().child.selectedChild;
        if (selectedChildState?.person?.id) {
            const appointmentReq = await AppointmentService.getAllAppointment(selectedChildState.person.id);
            dispatch(setAllAppointmentList(appointmentReq));
            const presetAppointment = await AppointmentService.getAllPresetAppointment(selectedChildState);
            dispatch(setPresetAppointmentList(presetAppointment));
        }

        const appointmentDetails = await AppointmentService.getAppointmentById(newNotificationData?.message?.id);
        let pathname = '/(drawer)/(tabs)/appointment/preset-appointment';
        if(appointmentDetails !== undefined && appointmentDetails !== null){
            dispatch(setAppointmentDetailsInRedux(appointmentDetails));
            pathname = '/pages/appointment/preset-appointment-details';
        }
        // Navigation vers la liste des rendez-vous présélectionnés
        setTimeout(() => {
            router.push({
                pathname: pathname,
                params: {
                    data: JSON.stringify(appointmentDetails?.id)
                }
            });
        }, 400);
    }
};

/**
 * Gère la navigation pour les autres types de notifications
 */
const handleOtherNotification = async (
    notificationData: any,
    newNotificationData: any,
    routePath: string
) => {
    const state = store.getState();
    const { children } = state.child;
    const dispatch = store.dispatch;

    const tag = notificationData?.common?.tag;
    const message = newNotificationData?.message;

    switch (tag) {
        case 'alertmessage':
            if (message?.enfantId) {
                handleChangeChild(message.enfantId);
            }
            dispatch(setDataNotification(newNotificationData));
            dispatch(setAlertMessageHeader(true));
            break;

        case 'imsday':
            if (message?.enfantId) {
                handleChangeChild(message.enfantId);
            }
            break;

        case 'sondage':
            if (message?.enfantId) {
                handleChangeChild(message.enfantId);
            } else if (message?.classes) {
                const classrooms = message.classes.split(',');
                const classroomsIds = classrooms.map((classroom: string) => parseInt(classroom));

                for (let i = 0; i < children.length; i++) {
                    const classroomId = children[i]?.eleves[0]?.classe?.id;
                    if (classroomsIds.includes(classroomId)) {
                        handleChangeChild(children[i]?.person?.id);
                        break;
                    }
                }
            }
            break;

        case 'miniclubs':
            if (message?.enfantId) {
                handleChangeChild(message.enfantId);
            }
            break;

        case 'message_center':
            if (message?.enfantId) {
                handleChangeChild(message.enfantId);
            }
            break;

        case 'documents':
            if (message?.enfantId) {
                handleChangeChild(message.enfantId);
            }
            break;

        default:
            console.log(`⚠️ Tag non géré: ${tag}`);
            return;
    }

    // Navigation vers la route correspondante
    setTimeout(() => {
        router.push(routePath);
    }, 400);
};

// ✅ Navigation sécurisée depuis une notification
export async function navigateFromNotificationData(data: Record<string, any> | undefined) {
    if (isNavigating) {
        console.log('⚠️ Navigation déjà en cours');
        return;
    }

    if (!data) {
        console.log('Aucune donnée de notification');
        return;
    }

    if (!isAppReady) {
        console.log('⏳ App pas prête, notification stockée');
        pendingNotificationData = data;
        return;
    }

    try {
        isNavigating = true;
        //console.log('📨 Navigation depuis notification:', JSON.stringify(data));

        //console.log(data);
        const rawJsonData = data?.json;
        if (!rawJsonData) {
            console.log('❌ Pas d\'identifiant');
            isNavigating = false;
            return;
        }

        const notificationId = String(rawJsonData);
        const notificationDetails = await WsNotificationService.getUserNotificationById(notificationId);

        if (!notificationDetails) {
            console.log('❌ Notification non trouvée');
            isNavigating = false;
            return;
        }

        const routeConfig = NOTIFICATION_NAGIVATION.find(
            (item: any) => item.tag === notificationDetails?.common?.tag
        );

        if (!routeConfig?.value) {
            console.log('❌ Aucune route pour le tag:', notificationDetails?.common?.tag);
            isNavigating = false;
            return;
        }

        const routePath = routeConfig.value;
        const newNotificationData = {
            ...notificationDetails,
            message: JSON.parse(notificationDetails?.message),
        };

        //console.log(notificationDetails);
        // Traitement spécifique selon le type de notification
        if (notificationDetails?.common?.tag === 'rdv') {
            console.log("rdv")
            await handleAppointmentNotification(
                notificationDetails,
                newNotificationData,
                routePath
            );
        } else {
            console.log("other")
            await handleOtherNotification(
                notificationDetails,
                notificationDetails,
                routePath
            );
        }

        console.log('✅ Navigation réussie vers:', routePath);
    }
    catch (error) {
        console.log('❌ Erreur navigation:', error);
        pendingNotificationData = data;
    } finally {
        isNavigating = false;
    }
}

// ✅ Gestion des notifications initiales
export async function handleInitialNotification() {
    try {
        console.log('🔍 Vérification des notifications initiales...');

        const lastResponse = await Notifications.getLastNotificationResponse();
        if (lastResponse) {
            console.log('📨 Notification initiale détectée (expo-notifications)');
            const data = lastResponse.notification.request.content.data;

            if (isAppReady) {
                await navigateFromNotificationData(data as Record<string, any>);
            } else {
                pendingNotificationData = data;
            }
        }
    } catch (error) {
        console.log('❌ Erreur initial notification:', error);
    }
}

// ✅ Setup des listeners
export function setupNotificationListeners() {
    console.log('📱 Configuration des listeners');

    // Écouter les réponses aux notifications (expo-notifications)
    const subscription = Notifications.addNotificationResponseReceivedListener(
        async (response) => {
            console.log('👆 Notification tapée (expo-notifications)');
            const data = response.notification.request.content.data;
            await navigateFromNotificationData(data as Record<string, any>);
        }
    );

    // Écouter les notifications reçues en foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('📬 Notification reçue en foreground');
        }
    );

    // Firebase Messaging
    let firebaseCleanup = () => {};

    setTimeout(() => {
        if (isAppReady) {
            try {
                console.log('🔥 Initialisation de Firebase Messaging...');
                const app = getApp();
                const messaging = getMessaging(app);

                const unsubscribeFcm = onMessage(messaging, async (remoteMessage) => {
                    console.log('📬 FCM message reçu');
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: remoteMessage.notification?.title || 'Notification',
                            body: remoteMessage.notification?.body || '',
                            data: remoteMessage.data || {},
                            sound: true,
                            ...(Platform.OS === 'android' && { channelId: 'default' }),
                        },
                        trigger: null,
                    });
                });

                firebaseCleanup = unsubscribeFcm;
                console.log('✅ Firebase Messaging initialisé');
            } catch (error) {
                console.log('ℹ️ Firebase Messaging non disponible:', error);
            }
        }
    }, 1000);

    return {
        unsubscribe: () => {
            subscription.remove();
            foregroundSubscription.remove();
            firebaseCleanup();
        }
    };
}
