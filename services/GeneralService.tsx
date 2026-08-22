import WsNotificationService from "./WSNotificationService";
import {setNotificationList, setNotificationNumber} from "../redux/features/notification/notificationSlide";
import AuthenticationService from "./AuthenticationService";
import {AppState} from "react-native";
import {logoutUser} from "../redux/features/userSlice";

export const updateHeaderNotificationEveryWhere = async (userUuid: any, dispatch: any) => {
    try {
        // GET ALL NOTIFICATIONS AND DELETE OLD ONE
        let allNotification = await WsNotificationService.getAllHeaderNotification(userUuid);
        dispatch(setNotificationNumber(0));
        dispatch(setNotificationList([]));

        if (allNotification.length > 0) {
            dispatch(setNotificationNumber(allNotification.length));
            dispatch(setNotificationList(allNotification));
        }
    }
    catch (error) {
        console.log(error)
    }
};

export const checkTokenExpired = (userToken: any, dispatch: any) => {
    const tokenExpired = AuthenticationService.checkTokenValidity(userToken);
    if(tokenExpired) {
        dispatch(logoutUser());
    }
}

export const checkAppState = (appState: any, setCount: any) => {
    return AppState.addEventListener('change', nextAppState => {
        setCount((c: number) => c + 1); // plus besoin de lire `count` depuis l'extérieur
        appState.current = nextAppState;
    });
}
