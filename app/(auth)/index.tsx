import ViewThemed from "../../components/ui/ViewThemed";
import {globalStyles} from "../../style/Global";
import LoginForm from "../../components/form/LoginForm";
import {useRouter} from "expo-router";
import {useEffect, useState} from "react";
import {loginUser} from "../../redux/features/userSlice";
import {useDispatch} from "react-redux";
import {useTranslation} from "react-i18next";
import {postRequest, putRequest} from "../../api/ApiManager";
import {setUserFCMToken} from "../../redux/features/user/userSlice";
import {getUserChildren} from "../../redux/features/child/childSlice";
import messaging from "@react-native-firebase/messaging";

const Login = () => {
    const router = useRouter();
    const [buttonStatus, setButtonStatus] = useState(false);
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const [errorMessage, setErrorMessage] = useState('');
    //const {userFCMToken} = useSelector((state: any) => state.user);
    const {i18n} = useTranslation();

    const handleUserLogin = async (data) => {
        try {
            setButtonStatus(true);
            const response = await postRequest('', '/public/auth/login/parent', {
                username: data.username.trim(),
                password: data.password.trim(),
            });

            /*const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                messaging()
                    .getToken()
                    .then(async fcmToken => {
                        const dataToSend = {
                            userId: response.user.id,
                            mobileToken: fcmToken,
                            mobileLang: i18n.language,
                        };
                        await putRequest('', '/public/auth/parent/device', dataToSend);
                        dispatch(setUserFCMToken(fcmToken));

                    }).catch(e => {
                    console.log(e);
                    setButtonStatus(false);
                });
            }
            else {
                console.log('Not Authorization status:', authStatus);
            }*/

            //dispatch(changeStack(false));
            //dispatch(changeFirstLog(true));
            dispatch(loginUser(response));
            dispatch(getUserChildren(response));
            setButtonStatus(false);

        }
        catch (error: any) {
            if (error?.code === 'ERR_NETWORK') {
                setErrorMessage(t('login.network_error'));
            }
            else {
                setErrorMessage(t('login.acces_error'));
            }
            setButtonStatus(false);
            console.log(error);
        }

        /*setButtonStatus(true);
        const userInfo = {
            user: [],
            token: "jajshayyqwq.dsdowiwyewe00.yyweyweyyuw",
        };
        dispatch(loginUser(userInfo));
        setButtonStatus(false);*/
    }

    useEffect(() => {
        /*messaging().requestPermission().catch(error => {
            console.log(error);
        });
        notifee.requestPermission().catch(error => {
            console.log(error);
        });*/
    }, []);

    return (
        <ViewThemed style={globalStyles.container}>
            <LoginForm  onSubmit={handleUserLogin} sending={buttonStatus} />
        </ViewThemed>
    );
};

export default Login;
