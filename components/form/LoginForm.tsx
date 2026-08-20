import {JSX, useState} from "react";
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Image,
    TouchableWithoutFeedback,
    Keyboard,
    TextInput,
    TouchableOpacity
} from "react-native";
import ScrollView = Animated.ScrollView;
import {COLORS, IMAGES, ROUTES} from "../../constants";
import {globalStyles} from "../../style/Global";
import * as yup from 'yup';
import {TLoginFormProps} from "../../lib/type/authenticationTypes";
import {Formik} from "formik";
import {useTranslation} from "react-i18next";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import FlatButton from "../ui/FlatButton";
import {useRouter} from "expo-router";


const loginFormSchema = yup.object({
    username: yup.string().required().min(3),
    password: yup.string().required().min(3),
});
const LoginForm = ({
                       onSubmit,
                       errorMessage,
                       sending,
                   }: TLoginFormProps) => {
    const {t} = useTranslation();
    const [passwordVisibility, setPasswordVisibility] = useState(true);
    const [passwordIcon, setPasswordIcon] = useState('eye');
    const router = useRouter();

    const handlePasswordVisibility = () => {
        setPasswordVisibility(!passwordVisibility);
        passwordVisibility ? setPasswordIcon('eye-off') : setPasswordIcon('eye');
    };

    return (
        <ScrollView style={{flex: 1}}>
            <View style={styles.polygonOne}>
                <Image source={IMAGES.logPolygonTop} />
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.content}>
                    <View style={styles.illustration}>
                        <Image
                            source={IMAGES.logo}
                            resizeMode="cover"
                            style={styles.responsiveImage}
                        />
                    </View>

                    <View style={styles.formContent}>
                        <Text
                            style={{
                                ...globalStyles.errorText,
                                ...{textAlign: 'center', marginBottom: 10},
                            } as StyleSheet }>
                            {errorMessage}
                        </Text>

                        <Formik
                            initialValues={{
                                username: '',
                                password: '',
                            }}
                            validationSchema={loginFormSchema}
                            onSubmit={data => {
                                onSubmit(data);
                            }}
                        >
                            {formikProps => (
                                <>
                                    <TextInput
                                        style={{...styles.input}}
                                        placeholder={t('login.username')}
                                        placeholderTextColor={COLORS.gray}
                                        onChangeText={formikProps.handleChange('username')}
                                        value={formikProps.values.username}
                                        onBlur={formikProps.handleBlur('username')}
                                    />
                                    <Text
                                        style={{
                                            ...globalStyles.errorText,
                                            ...styles.marginInput,
                                        }}>
                                        {formikProps.touched.username &&
                                            formikProps.errors.username && (
                                                <Text style={{color: 'crimson'}}>{t('login.required_field')}</Text>
                                            )}
                                    </Text>

                                    <View style={{...styles.password}}>
                                        <TextInput
                                            style={{...styles.inputPassword}}
                                            secureTextEntry={passwordVisibility}
                                            placeholder={t('login.password')}
                                            placeholderTextColor={COLORS.gray}
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
                                                size={24}
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
                                                <Text style={{color: 'crimson'}}>{t('login.required_field')}</Text>
                                            )}
                                    </Text>

                                    <View style={{...styles.button, ...styles.marginInput}}>
                                        <FlatButton
                                            title={t('login.sign_in')}
                                            fontWeight="bold"
                                            fontSize={16}
                                            backgroundColor={COLORS.secondary}
                                            onPress={formikProps.handleSubmit}
                                            paddingVertical={17}
                                            borderRadius={30}
                                            disabled={sending}
                                        />
                                    </View>

                                    <View
                                        style={{alignItems: 'center', alignContent: 'center'} as StyleSheet}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                //setButtonStatus(false);
                                                router.push(ROUTES.FORGOT_PASSWORD);
                                            }}
                                            style={styles.forgetPassword}>
                                            <Text style={styles.forgetPasswordText}>
                                                {t('login.forget_password')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                </>
                            ) as JSX.Element}
                        </Formik>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.circle}>
                            <Image source={IMAGES.logCircle} />
                        </View>
                        <View style={styles.polygonTwo}>
                            <Image source={IMAGES.logPolygonBottom} />
                        </View>
                        <View style={styles.square}>
                            <Image source={IMAGES.logSquare} />
                        </View>
                        {/*<View style={styles.footerContent}></View>*/}
                    </View>

                </View>

            </TouchableWithoutFeedback>
        </ScrollView>
    );
};

export default LoginForm;

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
        alignItems: 'center',
    },
    responsiveImage: {
        /*width: '100%',
        height: 68,
        aspectRatio: 186 / 63,*/
        width: '100%',
        height: 75,
        aspectRatio: 170 / 66,
    },
    formContent: {
        marginTop: 10,
        marginBottom: 40,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 12,
        fontSize: 16,
        borderRadius: 8,
        color: COLORS.black,
    },
    password: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        borderRadius: 8,
        color: COLORS.black,
    },
    inputPassword: {
        flex: 6,
        //width: "80%",
        fontSize: 16,
        padding: 12,
        color: COLORS.black,
        //backgroundColor:'green'
    },
    passwordIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    forgetPassword: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
    },
    forgetPasswordText: {
        color: COLORS.black,
        fontSize: 16,
        padding: 8,
        paddingLeft: 20,
        paddingRight: 20,
    },
    marginInput: {
        marginBottom: 15,
    },
    button: {
        marginTop: 25,
    },
    square: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
    },
    circle: {
        flex: 1,
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
    },
});
