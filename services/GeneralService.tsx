import WsNotificationService from "./WSNotificationService";
import {setNotificationList, setNotificationNumber} from "../redux/features/notification/notificationSlide";
import AuthenticationService from "./AuthenticationService";
import {AppState} from "react-native";
import {logoutUser} from "../redux/features/user/userSlice";

export const updateHeaderNotificationEveryWhere = async (userUuid: any, dispatch: any) => {
    try {
        //GET ALL NOTIFICATIONS
        let allNotification = await WsNotificationService.getAllNotification(userUuid);
        if (allNotification.length > 0) {
            // ✅ Filtrer les notifications non lues pour le compteur
            const unreadNotifications = allNotification.filter((notif: any) => notif.dateRead === null);
            dispatch(setNotificationNumber(unreadNotifications.length));
            dispatch(setNotificationList(allNotification));
        }
    }
    catch (error: any) {
        // Détail de l'erreur HTTP (URL, statut, corps de réponse) pour diagnostiquer les 400
        console.log('❌ updateHeaderNotificationEveryWhere', {
            uuid: userUuid,
            url: error?.config?.baseURL + error?.config?.url,
            status: error?.response?.status,
            data: error?.response?.data,
        });
    }
};

export const checkTokenExpired = (userToken: any, dispatch: any) => {
    const tokenExpired = AuthenticationService.checkTokenValidity(userToken);
    if(tokenExpired) {
        dispatch(logoutUser());
    }
}

// ✅ Version corrigée avec vérification
export const checkAppState = (appState: any, setCount: any) => {
    // ✅ Vérifier que setCount est bien une fonction
    if (typeof setCount !== 'function') {
        console.warn('setCount is not a function, skipping AppState listener');
        return {
            remove: () => {}
        };
    }

    return AppState.addEventListener('change', nextAppState => {
        // ✅ Vérifier à nouveau avant d'appeler
        if (typeof setCount === 'function') {
            setCount((c: number) => c + 1);
        }
        appState.current = nextAppState;
    });
}
