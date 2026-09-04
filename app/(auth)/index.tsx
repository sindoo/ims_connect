import ViewThemed from "../../components/ui/ViewThemed";
import { globalStyles } from "../../style/Global";
import LoginForm from "../../components/form/LoginForm";
import { useRouter } from "expo-router";
import { useState } from "react";
import { loginUser } from "../../redux/features/userSlice";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { postRequest, putRequest, setAuthToken } from "../../api/ApiManager";
import { setUserFCMToken, setUserSliceToken } from "../../redux/features/user/userSlice";
import { getUserChildren } from "../../redux/features/child/childSlice";
import { getFcmToken } from "../../services/notificationService";

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
        }
        catch (error: any) {
            if (error?.code === 'ERR_NETWORK') {
                setErrorMessage(t('login.network_error'));
            } else {
                setErrorMessage(t('login.acces_error'));
            }
            setButtonStatus(false);
            console.log(JSON.stringify(error));
        }
    };

    return (
        <ViewThemed style={globalStyles.container}>
            <LoginForm onSubmit={handleUserLogin} sending={buttonStatus} />
        </ViewThemed>
    );
};

export default Login;
