import React, {JSX} from 'react';
import {
    Animated,
    Text,
    ScrollView,
    Image,
    View,
    StyleSheet,
    Keyboard,
    TouchableWithoutFeedback,
    TouchableOpacity, TextInput
} from "react-native";
import {COLORS, IMAGES, ROUTES} from "../../constants";
import * as yup from "yup";
import {TLoginFormProps} from "../../lib/type/authenticationTypes";
import {globalStyles} from "../../style/Global";
import FlatButton from "../ui/FlatButton";
import {useTranslation} from "react-i18next";
import {Formik} from "formik";
import {useRouter} from "expo-router";
//import ScrollView = Animated.ScrollView;

const passwordFormSchema = yup.object({
    username: yup.string().required().min(3),
});

const ForgetPasswordForm = ({
                                onSubmit,
                                errorMessage,
                                sending,
                            }: TLoginFormProps) => {
    const {t} = useTranslation();
    const router = useRouter();

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
                            }}
                            validationSchema={passwordFormSchema}
                            onSubmit={async (data) => {
                               // await handleRequestPassword(data);
                            }}>
                            {formikProps => (
                                <>
                                    <View style={styles.formContent}>
                                        <TextInput
                                            style={{...styles.input}}
                                            placeholder={t('forgetPassword.username')}
                                            placeholderTextColor={COLORS.gray}
                                            onChangeText={formikProps.handleChange('username')}
                                            value={formikProps.values.username}
                                            onBlur={formikProps.handleBlur('username')}
                                        />
                                        <Text style={{...globalStyles.errorText}}>
                                            {formikProps.touched.username &&
                                                formikProps.errors.username && (
                                                    <Text>{t('login.required_field')}</Text>
                                                )}
                                        </Text>

                                        <View style={{...styles.button, ...styles.marginInput}}>
                                            <FlatButton
                                                title={t('forgetPassword.send_reset')}
                                                fontWeight="bold"
                                                fontSize={16}
                                                backgroundColor={COLORS.secondary}
                                                onPress={formikProps.handleSubmit}
                                                paddingVertical={17}
                                                borderRadius={30}
                                                disabled={sending}
                                            />
                                        </View>
                                        <View style={{alignItems: 'center', alignContent: 'center'} as StyleSheet}>
                                            <TouchableOpacity
                                                onPress={() =>  {
                                                    router.push(ROUTES.LOGIN);
                                                }}
                                                style={styles.forgetPassword}>
                                                <Text style={styles.forgetPasswordText}>
                                                    {t('forgetPassword.sign_in')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )  as JSX.Element}
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

export default ForgetPasswordForm;

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
    resizeLogo: {
        height: 50,
        aspectRatio: 165 / 76,
    },
    illustration: {
        alignItems: 'center',
    },
    responsiveImage: {
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

