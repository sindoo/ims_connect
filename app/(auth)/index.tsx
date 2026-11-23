import ViewThemed from "../../components/ui/ViewThemed";
import { globalStyles } from "../../style/Global";
import LoginForm from "../../components/form/LoginForm";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { postRequest, putRequest, setAuthToken, apiErrorMessage } from "../../api/ApiManager";
import { isNetworkError } from "../../api/connectivity";
import { serverErrorMessage } from "../../api/serverErrors";
import { setUserFCMToken, setUserSliceToken, loginUser } from "../../redux/features/user/userSlice";
import { getUserChildren } from "../../redux/features/child/childSlice";
import { getFcmToken } from "../../services/notificationService";
import { updateHeaderNotificationEveryWhere } from "../../services/GeneralService";

// Causes d'échec de connexion précisées à l'utilisateur ; toute autre erreur garde le message habituel.
const LOGIN_SPECIFIC_ERROR_CODES = [
    'ACCOUNT_JWT_LOCKED',
    'ACCOUNT_JWT_DISABLED',
    'ACCOUNT_JWT_EXPIRED',
    'PERMISSION_EXCEPTION',
    'SERVICE_UNAVAILABLE',
];


const Login = () => {
    const router = useRouter();
    const [buttonStatus, setButtonStatus] = useState(false);
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [errorMessage, setErrorMessage] = useState('');
    const { i18n } = useTranslation();

    const handleUserLogin = async (data) => {
        try {
            setButtonStatus(true);
            setErrorMessage('');
            const response = await postRequest('', '/public/auth/login/parent', {
                username: data.username.trim(),
                password: data.password.trim(),
            });

            // ✅ Récupération du token FCM avec un délai
            try {
                // Attendre 1s pour s'assurer que tout est prêt
                await new Promise(resolve => setTimeout(resolve, 1000));
                const fcmToken = await getFcmToken();
                if (fcmToken) {
                    await putRequest('', '/public/auth/parent/device', {
                        userId: response.user.id,
                        mobileToken: fcmToken,
                        mobileLang: i18n.language,
                    });
                    dispatch(setUserFCMToken(fcmToken));
                } else {
                    console.log('Aucun token FCM disponible');
                }
            } catch (fcmError) {
                console.log('Erreur FCM:', fcmError);
            }

            dispatch(loginUser(response));
            dispatch(getUserChildren(response));
            setAuthToken(response.token);
            dispatch(setUserSliceToken(response.token));

            // ✅ Récupérer les notifications après connexion
            await updateHeaderNotificationEveryWhere(response.user.uuid, dispatch);

            // Navigation vers la sélection de profil
            router.push('/');
        }
        catch (error: any) {
            if (isNetworkError(error)) {
                setErrorMessage(apiErrorMessage(error, t('snackBar.sb_no_connection')));
            } else {
                // Causes précises uniquement (compte verrouillé, désactivé, expiré, droits,
                // serveur indisponible). Identifiants faux ou toute autre erreur : message
                // habituel, qui ne précise pas si c'est le nom ou le mot de passe.
                setErrorMessage(
                    serverErrorMessage(error, LOGIN_SPECIFIC_ERROR_CODES) ?? t('login.acces_error'),
                );
            }
            setButtonStatus(false);
            console.log(JSON.stringify(error));
        }
    };

    return (
        <ViewThemed style={globalStyles.container}>
            <LoginForm onSubmit={handleUserLogin} sending={buttonStatus} errorMessage={errorMessage} />
        </ViewThemed>
    );
};

export default Login;
