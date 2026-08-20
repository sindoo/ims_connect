import React, {JSX, useEffect, useState} from "react";
import {View, Text, StyleSheet, Platform, useColorScheme, Pressable, TouchableOpacity, Linking} from "react-native";
import {COLORS, IMAGES} from "../../../constants";
import {StatusBar} from "expo-status-bar";
import {ImageBackground, Image} from "expo-image";
import {Badge, useNavigation} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {BASEURL_IMG} from "../../../api/appUrl";
import {changeAppLanguage} from "../../../redux/features/language/languageSlice";
import LanguageComponent from "./LanguageComponent";

const IMS_WEBSITE = 'https://www.ivorymontessorischool.com/';

const CustomHeader = ({ title }) => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    const {i18n} = useTranslation();
    const {notificationNumber} = useSelector((state: any) => state.notification);
    const {selectedChild} = useSelector((state: any) => state.child);
    const [childrenSelected, setChildrenSelected] = useState<any>(null);
    const [modal, setModal] = useState(false);
    const [notifModal, setNotifModal] = useState(false);
    const [languageValue, setLanguageValue] = useState(i18n.language);
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const handleLanguageChange = async (lang: any) => {
        try {
            setLanguageValue(lang);
            await i18n.changeLanguage(lang);
            dispatch(changeAppLanguage(lang));
            const timerId = setTimeout(() => {
                setModal(false);
            }, 500);

            return () => {
                clearTimeout(timerId);
            }
        }
        catch (error) {
            console.log(error)
        }
    };

    const openDrawMenu = () => {
        navigation.openDrawer();
        //navigation.dispatch(DrawerActions.toggleDrawer());
    };

    useEffect(() => {
        setChildrenSelected(selectedChild !== null ? selectedChild?.person : selectedChild);
    }, [selectedChild]);

    return (
        <View style={
            Platform.OS === 'ios'
                ? [styles.containerIOS, {backgroundColor: theme.background}]
                : [styles.containerAndroid, {backgroundColor: theme.background}]}
        >
            <StatusBar value="auto" translucent backgroundColor="transparent" />

            <ImageBackground source={IMAGES.headerBackground}>
                <View style={styles.smallLogoHeader}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => Linking.openURL(`${IMS_WEBSITE}`)}>
                        <Image source={IMAGES.logoHeader} style={styles.smallLogo} />
                    </TouchableOpacity>
                </View>
                <View style={styles.header}>
                    <View style={styles.titleBox}>
                        <View style={styles.headerTitle}>
                            <Text style={{...styles.headerText}}>{title}</Text>
                        </View>
                    </View>

                    <View style={styles.otherToolsBox}>
                        <View style={styles.language}>
                            <Pressable onPress={() => setModal(true)}>
                                <Image
                                    source={languageValue === 'en' ? IMAGES.languageEn : IMAGES.languageFr}
                                    style={styles.flag}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.notification}>
                            {/* setNotifModal(true) */}
                            <Pressable onPress={() => setNotifModal(true)}>
                                <Badge
                                    visible={true}
                                    size={18}
                                    style={{zIndex: 10}}
                                    theme={{colors: {primary: COLORS.primary}}}>
                                    {notificationNumber}
                                    0
                                </Badge>
                                <MaterialIcons
                                    name="notifications"
                                    color={COLORS.secondary}
                                    size={30}
                                    style={{right: 2, marginTop: -13}}
                                />
                            </Pressable>
                        </View>
                        <Pressable onPress={openDrawMenu} style={styles.avatarContainer}>
                            <Image
                                source={
                                    childrenSelected?.photo !== ''
                                        ? {uri: `${BASEURL_IMG}/${childrenSelected?.photo}`}
                                        : IMAGES.avatar
                                }
                                style={styles.avatar}
                            />
                            {childrenSelected !== null && (
                                <Image
                                    source={
                                        childrenSelected.photo !== ''
                                            ? {uri: `${BASEURL_IMG}/${childrenSelected.photo}`}
                                            : IMAGES.avatar
                                    }
                                    style={styles.avatar}
                                /> as JSX.Element
                            )}
                        </Pressable>
                    </View>

                    <LanguageComponent
                        modal={modal}
                        languageValue={languageValue}
                        setModal={setModal}
                        handleLanguageChange={handleLanguageChange}
                    />

                   {/* <NotificationHeader
                        notifModal={notifModal}
                        setNotifModal={setNotifModal}
                        navigation={navigation}
                    />*/}
                </View>
            </ImageBackground>

        </View>
    );
};

export default CustomHeader;

const styles = StyleSheet.create({
    containerIOS: {
        height: 75,
        overflow: 'hidden',
        marginTop: 0,
    },
    containerAndroid: {
        height: 75,
        overflow: 'hidden',
        marginTop: 0,
    },

    smallLogoHeader: {
        paddingTop: 5,
        paddingLeft: 20,
        marginBottom: -10,
    },
    imsWebsite: {
        fontSize: 12,
        paddingLeft: 4,
        color: COLORS.gray,
    },
    smallLogo: {
        width: 60,
        height: 20,
    },
    header: {
        height: 65,
        //paddingTop: 27,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayMedium,
    },
    headerText: {
        fontWeight: '500',
        fontSize: 18,
        color: COLORS.secondary,
        letterSpacing: 1,
        paddingLeft: 20,
        paddingRight: 20,
    },
    icon: {
        position: 'absolute',
        right: 20,
        paddingTop: 20,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    headerTitle: {
        //backgroundColor:'red'
        //flexDirection: 'row',
    },
    headerImage: {
        width: 26,
        height: 26,
        marginHorizontal: 10,
    },
    avatarContainer: {
        position: 'absolute',
        right: 20,
        paddingTop: 0,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
        backgroundColor: COLORS.grayLight,
    },
    avatar: {
        width: 35,
        height: 35,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    notification: {
        //flex:1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        paddingRight: 75,
        //backgroundColor:'red'
    },
    language: {
        //flex:1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        paddingRight: 15,
        top: -3,
    },
    flag: {
        width: 23,
        height: 25,
    },
    titleBox: {
        flex: 3,
    },
    otherToolsBox: {
        flex: 2,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        flexDirection: 'row',
    },

});
