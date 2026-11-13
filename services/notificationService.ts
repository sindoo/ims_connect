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
import { NOTIFICATION_NAGIVATION } from "../constants";
import { store } from '../redux/store';
import { updateMiniClubStatus } from '../redux/features/club/miniClubSlice';
import { changeChild } from '../redux/features/child/childSlice';
import {
    setAllAppointmentList,
    setAppointmentDetailsInRedux,
    setPresetAppointmentList
} from '../redux/features/appointment/appointmentSlice';
import { setDataNotification, setAlertMessageHeader } from '../redux/features/alertmessage/alertMessageSlide';
import AppointmentService from '../services/AppointmentService';
import { updateHeaderNotificationEveryWhere } from "./GeneralService";
import {decrementNotificationNumber} from "../redux/features/notification/notificationSlide";

// ✅ Configuration de l'affichage des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ✅ État "chargement" global : vrai entre le tap sur une notification
// (liste du téléphone) et l'affichage de la page concernée.
let notificationNavigationLoading = false;
let notificationLoadingHideTimer: ReturnType<typeof setTimeout> | null = null;
const notificationLoadingListeners = new Set<() => void>();

const setNotificationNavigationLoading = (value: boolean) => {
    if (notificationNavigationLoading === value) return;
    notificationNavigationLoading = value;
    notificationLoadingListeners.forEach(listener => listener());
};

export const subscribeNotificationLoading = (listener: () => void) => {
    notificationLoadingListeners.add(listener);
    return () => {
        notificationLoadingListeners.delete(listener);
    };
};
export const getNotificationLoading = () => notificationNavigationLoading;

const startNotificationLoading = () => {
    if (notificationLoadingHideTimer) clearTimeout(notificationLoadingHideTimer);
    setNotificationNavigationLoading(true);
    // Filet de sécurité : ne jamais laisser l'indicateur bloqué
    notificationLoadingHideTimer = setTimeout(() => setNotificationNavigationLoading(false), 15000);
};

const stopNotificationLoading = () => {
    if (notificationLoadingHideTimer) clearTimeout(notificationLoadingHideTimer);
    // Court délai : laisse la page cible se monter avant de retirer l'indicateur
    notificationLoadingHideTimer = setTimeout(() => setNotificationNavigationLoading(false), 600);
};

// ✅ Variables de gestion
let isNavigating = false;
let pendingNotificationData: any = null;
let isAppReady = false;
let pendingNavigationCallback: (() => void) | null = null;

// ✅ Instance Firebase Messaging mise en cache : évite de retraverser le
// pont natif (getApp + getMessaging) à chaque appel
let messagingInstance: ReturnType<typeof getMessaging> | null = null;
const getMessagingInstance = () => {
    if (!messagingInstance) {
        messagingInstance = getMessaging(getApp());
    }
    return messagingInstance;
};

// ✅ Fonction pour rafraîchir le compteur de notifications
const refreshNotificationCount = async () => {
    try {
        const state = store.getState();
        const { user } = state.user;
        if (user?.uuid) {
            await updateHeaderNotificationEveryWhere(user.uuid, store.dispatch);
        }
    } catch (error) {
        console.log('Erreur refresh notification count:', error);
    }
};

const refreshAppointmentPresetList = async () => {
    const state = store.getState();
    const { selectedChild } = state.child;
    const dispatch = store.dispatch;

    // ✅ Évite une exception (et le passage par le catch) quand aucun
    // enfant n'est encore sélectionné
    if (!selectedChild?.person?.id) return;

    try {
        const appointmentReq = await AppointmentService.getAllAppointment(selectedChild.person.id);
        dispatch(setAllAppointmentList(appointmentReq));
        const presetAppointment = await AppointmentService.getAllPresetAppointment(selectedChild);
        dispatch(setPresetAppointmentList(presetAppointment));
    }
    catch (error) {
        console.log('Erreur refresh appointment list:', error);
    }
}

// ✅ Fonction pour décrémenter le compteur
const decrementNotificationCounter = () => {
    try {
        store.dispatch(decrementNotificationNumber());
        console.log('📉 Compteur de notifications décrémenté');
    } catch (error) {
        console.log('Erreur décrémentation compteur:', error);
    }
};

// ✅ Affiche l'alerte (tag 'alertmessage') par-dessus l'écran courant quand
// la notification arrive app au premier plan. Retourne true si une alerte a
// été affichée (le bandeau système n'est alors pas nécessaire).
const presentAlertMessage = async (data: Record<string, any> | undefined): Promise<boolean> => {
    try {
        const state = store.getState();
        if (!data?.json || !state.user?.userToken) return false;

        const notificationId = String(data.json);
        const details = await WsNotificationService.getUserNotificationById(notificationId);
        if (details?.common?.tag !== 'alertmessage') return false;

        const message = typeof details.message === 'string' ? JSON.parse(details.message) : details.message;
        store.dispatch(setDataNotification({...details, message}));
        store.dispatch(setAlertMessageHeader(true));

        if (state.user?.user?.uuid) {
            await WsNotificationService.markNotificationAsRead(state.user.user.uuid, notificationId);
        }
        return true;
    } catch (error) {
        console.log('Erreur affichage alerte:', error);
        return false;
    }
};

// ✅ Marquer l'app comme prête
export const markAppReady = (ready: boolean) => {
    console.log('📱 markAppReady:', ready);
    isAppReady = ready;
    if (ready && pendingNavigationCallback) {
        console.log('✅ Exécution de la navigation en attente');
        const callback = pendingNavigationCallback;
        pendingNavigationCallback = null;
        // ✅ Plus de délai fixe de 300ms : le callback n'a besoin que d'être
        // exécuté après le rendu en cours, ce que résout un microtask/frame.
        requestAnimationFrame(callback);
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
        const token = await getToken(getMessagingInstance());
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
    const { children } = state.child;
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

        // ✅ Navigation immédiate : dispatch() est synchrone, il n'y a pas
        // besoin d'attendre 400ms avant de naviguer.
        router.push({
            pathname: pathname,
            params: {
                data: JSON.stringify(appointmentDetails?.id)
            }
        });
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

        // ✅ Navigation immédiate (voir remarque ci-dessus)
        router.push({
            pathname: pathname,
            params: {
                data: JSON.stringify(appointmentDetails?.id)
            }
        });
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
            }
            else if (message?.classes) {
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
            if (message?.space?.enfantId) {
                handleChangeChild(message?.space?.enfantId);
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

    // ✅ Navigation immédiate vers la route correspondante (plus de délai
    // artificiel de 400ms)
    if (tag === 'miniclubs') {
        const miniClubId = message?.classeMiniClubs?.[0]?.miniClubId;
        if (miniClubId !== undefined && miniClubId !== null) {
            router.push({
                pathname: '/pages/more/club',
                params: {
                    miniClubId,
                    registrationStatus: 0
                }
            });
        }
    }
    else if(tag === 'message_center') {
        if(message?.space) {
            const childSelectedID = message?.space?.enfantId;
            handleChangeChild(childSelectedID);

            const pathname = '/pages/message';
            router.push({
                pathname: pathname,
                params: {
                    discussionThreadId: JSON.stringify(message?.space?.id),
                }
            });
        }
    }
    else {
        router.push(routePath);
    }
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
        startNotificationLoading();

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

        // ✅ Décrémenter le compteur localement, sans appel réseau,
        // pour une mise à jour instantanée de l'affichage
        decrementNotificationCounter();

        // ✅ Marquer la notification comme lue (n'attend pas le résultat
        // pour ne pas retarder la navigation ; les erreurs sont journalisées)
        const state = store.getState();
        const markAsReadPromise = state.user?.user?.uuid
            ? WsNotificationService.markNotificationAsRead(state.user.user.uuid, notificationId)
                .catch(error => console.log('Erreur marquage comme lu:', error))
            : Promise.resolve();

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

        // Traitement spécifique selon le type de notification
        if (notificationDetails?.common?.tag === 'rdv') {
            await handleAppointmentNotification(
                notificationDetails,
                newNotificationData,
                routePath
            );
        }
        else {
            // ✅ On transmet les données parsées (newNotificationData) au lieu
            // de notificationDetails deux fois : le switch de
            // handleOtherNotification lit `newNotificationData.message`, qui
            // devait être un objet et non la chaîne JSON brute.
            await handleOtherNotification(
                notificationDetails,
                newNotificationData,
                routePath
            );
        }

        // ✅ Un seul rafraîchissement du compteur, à la fin, une fois la
        // navigation lancée (au lieu d'un appel dans chaque handler +
        // un second ici juste après)
        refreshNotificationCount();
        await markAsReadPromise;

        console.log('✅ Navigation réussie vers:', routePath);
    }
    catch (error) {
        console.log('❌ Erreur navigation:', error);
        pendingNotificationData = data;
    }
    finally {
        isNavigating = false;
        stopNotificationLoading();
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

            // ✅ La dernière réponse reste en mémoire côté natif (même après un
            // rechargement JS) : on l'efface pour ne pas rouvrir la même page
            // à chaque relance de l'app.
            Notifications.clearLastNotificationResponse();

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

    // ✅ Badge de l'icône de l'app = nombre de notifications non lues.
    // Se met à jour à chaque changement du compteur (réception, lecture,
    // suppression, déconnexion = 0), au lieu de rester figé sur la valeur
    // envoyée par le serveur dans la dernière push.
    let lastBadge = -1;
    const syncBadge = () => {
        const count = Number(store.getState().notification?.notificationNumber) || 0;
        if (count === lastBadge) return;
        lastBadge = count;
        Notifications.setBadgeCountAsync(count).catch(error =>
            console.log('Erreur mise à jour du badge:', error),
        );
    };
    syncBadge();
    const unsubscribeBadge = store.subscribe(syncBadge);

    // Écouter les réponses aux notifications (expo-notifications)
    const subscription = Notifications.addNotificationResponseReceivedListener(
        async (response) => {
            console.log('👆 Notification tapée (expo-notifications)');
            const data = response.notification.request.content.data;
            Notifications.clearLastNotificationResponse();
            await navigateFromNotificationData(data as Record<string, any>);
        }
    );

    // Écouter les notifications reçues en foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('📬 Notification reçue en foreground');
            refreshAppointmentPresetList().catch(error => console.log('Erreur refresh appointment preset list:', error));

            // ✅ Mettre à jour le compteur
            refreshNotificationCount().catch(error => console.log('Erreur refresh notification count:', error));
        }
    );

    // ✅ Firebase Messaging initialisé immédiatement (au lieu d'un
    // setTimeout(1000) arbitraire) : à cet instant, setupNotificationListeners
    // n'est appelée qu'une fois l'app marquée prête et les permissions
    // accordées, donc plus besoin d'attendre à l'aveugle. Ce délai pouvait
    // aussi faire manquer des messages FCM reçus dans la fenêtre d'attente.
    let firebaseCleanup = () => {};

    try {
        console.log('🔥 Initialisation de Firebase Messaging...');
        const messaging = getMessagingInstance();

        const unsubscribeFcm = onMessage(messaging, async (remoteMessage) => {
            console.log('📬 FCM message reçu');

            // ✅ Alerte : affichée directement par-dessus l'écran courant
            const alertShown = await presentAlertMessage(remoteMessage.data as Record<string, any>);

            // ✅ Mettre à jour le compteur
            await refreshNotificationCount();

            // ✅ Signale aux écrans mini club (liste + détail) de se recharger
            store.dispatch(updateMiniClubStatus(Date.now()));

            if (alertShown) return;

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

    return {
        unsubscribe: () => {
            subscription.remove();
            foregroundSubscription.remove();
            unsubscribeBadge();
            firebaseCleanup();
        }
    };
}
