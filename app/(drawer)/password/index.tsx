import React, {useEffect, useState} from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
} from 'react-native';
import * as yup from 'yup';
import {Formik} from 'formik';
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import AuthenticationService from "../../../services/AuthenticationService";
import Loading from "../../../components/ui/Loading";
import {globalStyles} from "../../../style/Global";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {COLORS} from "../../../constants";
import FlatButton from "../../../components/ui/FlatButton";
import {withSnackbar} from "../../../components/ui/SnackbarHOC";

const loginFormSchema = yup.object({
    username: yup.string().required().min(2),
    password: yup.string().required().min(3),
    newPassword: yup.string().required().min(3),
});

function ChangePassword({snackbarShowMessage}: {snackbarShowMessage: any}) {
    const [passwordVisibility, setPasswordVisibility] = useState(true);
    const [passwordIcon, setPasswordIcon] = useState('eye');
    const [loading, setLoading] = useState(false);
    //const dispatch = useDispatch();
    const {t} = useTranslation();
    const [errorMessage, setErrorMessage] = useState('');
    const [buttonStatus, setButtonStatus] = useState(false);
    const {user} = useSelector((state: any) => state.user);

    const handlePasswordVisibility = () => {
        setPasswordVisibility(!passwordVisibility);
        passwordVisibility ? setPasswordIcon('eye-off') : setPasswordIcon('eye');
    };

    const handleChangePassword = async (data: any) => {
        setButtonStatus(true);
        try {
            const dataToSend = {
                username: user?.username,
                password: data.password,
                newPassword: data.newPassword,
            };
            //await authentication.updateUserPassword(dataToSend);
            await AuthenticationService.updateUserPassword(dataToSend);
            setButtonStatus(false);
            snackbarShowMessage(t('snackBar.sb_succes_save'));
        } catch (error:any) {
            if (error?.code === 'BAD_CREDENTIALS') {
                snackbarShowMessage(t('login.password_error'));
            } else {
                snackbarShowMessage(t('login.password_error'));
                console.log(error);
            }
            setButtonStatus(false);
        }
    };

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) {
        return <Loading />
    }

    return (
        <View style={globalStyles.container}>
            <ScrollView style={{flex: 1}}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        <View style={styles.formContent}>
                            <Text style={{...styles.titleH3, textAlign: 'center'} as StyleSheet}>
                                {t('drawer.title_edit_password')}
                            </Text>

                            <Text
                                style={{
                                    ...globalStyles.errorText,
                                    ...{textAlign: 'center', marginBottom: 0},
                                } as StyleSheet}>
                                {errorMessage}
                            </Text>

                            <Formik
                                initialValues={{
                                    username: user?.username,
                                    password: '',
                                    newPassword: '',
                                }}
                                validationSchema={loginFormSchema}
                                onSubmit={ async (data) => {
                                    await handleChangePassword(data);
                                }}>
                                {formikProps => (
                                    <>
                                        <TextInput
                                            style={{...styles.input}}
                                            placeholder={t('login.username')}
                                            onChangeText={formikProps.handleChange('username')}
                                            value={formikProps.values.username}
                                            onBlur={formikProps.handleBlur('username')}
                                            editable={false}
                                        />
                                        <Text
                                            style={{
                                                ...globalStyles.errorText,
                                                ...styles.marginInput,
                                            }}>
                                            {formikProps.touched.username &&
                                                formikProps.errors.username && (
                                                    <Text>{t('login.required_field')}</Text>
                                                )}
                                        </Text>

                                        {/*OLD PASSWORD*/}
                                        <View style={{...styles.password}}>
                                            <TextInput
                                                style={{...styles.inputPassword}}
                                                secureTextEntry={passwordVisibility}
                                                placeholder={t('login.old_password')}
                                                onChangeText={formikProps.handleChange('password')}
                                                value={formikProps.values.password}
                                                onBlur={formikProps.handleBlur('password')}
                                            />
                                            <TouchableOpacity
                                                onPress={() => handlePasswordVisibility()}
                                                activeOpacity={0.8}
                                                style={styles.passwordIcon}>
                                                <MaterialCommunityIcons
                                                    name={passwordIcon}
                                                    size={22}
                                                    color={COLORS.gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <Text
                                            style={{
                                                ...globalStyles.errorText,
                                                ...styles.marginInput,
                                            }}>
                                            {formikProps.touched.password &&
                                                formikProps.errors.password && (
                                                    <Text>{t('login.required_field')}</Text>
                                                )}
                                        </Text>

                                        {/*NEW PASSWORD*/}
                                        <View style={{...styles.password}}>
                                            <TextInput
                                                style={{...styles.inputPassword}}
                                                secureTextEntry={passwordVisibility}
                                                placeholder={t('login.new_password')}
                                                onChangeText={formikProps.handleChange('newPassword')}
                                                value={formikProps.values.newPassword}
                                                onBlur={formikProps.handleBlur('newPassword')}
                                            />
                                            <TouchableOpacity
                                                onPress={() => handlePasswordVisibility()}
                                                activeOpacity={0.8}
                                                style={styles.passwordIcon}>
                                                <MaterialCommunityIcons
                                                    name={passwordIcon}
                                                    size={22}
                                                    color={COLORS.gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        <Text
                                            style={{
                                                ...globalStyles.errorText,
                                                ...styles.marginInput,
                                            }}>
                                            {formikProps.touched.newPassword &&
                                                formikProps.errors.newPassword && (
                                                    <Text>{t('login.required_field')}</Text>
                                                )}
                                        </Text>

                                        <View style={{...styles.buttom, ...styles.marginInput}}>
                                            <FlatButton
                                                title={t('allAppointment.save_form')}
                                                fontWeight="bold"
                                                fontSize={16}
                                                backgroundColor={COLORS.secondary}
                                                onPress={formikProps.handleSubmit}
                                                paddingVertical={17}
                                                borderRadius={30}
                                                disabled={buttonStatus}
                                            />
                                        </View>
                                    </>
                                )}
                            </Formik>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        </View>
    );
}

export default withSnackbar(ChangePassword);

const styles = StyleSheet.create({
    polygonOne: {
        flex: 1,
        alignItems: 'flex-end',
    },
    content: {
        flex: 8,
        padding: 20,
        paddingTop: 0,
    },
    logo: {
        //height: 50,
    },
    resizeLogo: {
        height: 50,
        aspectRatio: 165 / 76,
    },
    illustration: {
        marginTop: '3%',
        alignItems: 'center',
    },
    responsiveImage: {
        width: '100%',
        height: 85,
        aspectRatio: 170 / 76,
    },
    formContent: {
        marginTop: 20,
        marginBottom: 100,
    },
    titleH3: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.secondary,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 12,
        fontSize: 16,
        borderRadius: 8,
        color: COLORS.blackDark,
    },
    password: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        borderRadius: 8,
        color: COLORS.blackDark,
    },
    inputPassword: {
        flex: 6,
        //width: "80%",
        fontSize: 16,
        padding: 12,
        color: COLORS.blackDark,
        //backgroundColor:'green'
    },
    passwordIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    forgetPassword: {
        alignItems: 'center',
        marginTop: 20,
    },
    forgetPasswordText: {
        color: COLORS.blackDark,
        fontSize: 16,
    },
    marginInput: {
        marginBottom: 20,
    },
    buttom: {
        marginTop: 25,
    },
    square: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
    },
    circle: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'flex-end',
        //marginTop:20
    },
    polygonTwo: {
        //flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    footer: {
        flex: 1,
    },
    footerContent: {
        flex: 1,
        flexDirection: 'row',
        //backgroundColor: "red",
    },
});
