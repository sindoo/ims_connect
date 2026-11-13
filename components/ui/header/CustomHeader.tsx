import React, {useCallback, useMemo, useState} from "react";
import {View, Text, StyleSheet, Platform, useColorScheme, Pressable, TouchableOpacity, Linking} from "react-native";
import {COLORS, IMAGES} from "../../../constants";
import {StatusBar} from "expo-status-bar";
import {ImageBackground, Image} from "expo-image";
import {MaterialIcons} from "@expo/vector-icons";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {BASEURL_IMG} from "../../../api/appUrl";
import {changeAppLanguage} from "../../../redux/features/language/languageSlice";
import LanguageComponent from "./LanguageComponent";
import {Badge} from "react-native-paper";
//import { useNavigation, DrawerActions } from 'expo-router/react-navigation';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import {router} from "expo-router";

const IMS_WEBSITE = 'https://www.ivorymontessorischool.com/';

const CustomHeader = ({ title }) => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    const {i18n} = useTranslation();
    const {notificationNumber} = useSelector((state: any) => state.notification);
    const {selectedChild} = useSelector((state: any) => state.child);
    const [modal, setModal] = useState(false);
    const [notifModal, setNotifModal] = useState(false);
    const [languageValue, setLanguageValue] = useState(i18n.language);
    const dispatch = useDispatch();
    const navigation = useNavigation();

    // ✅ "childrenSelected" etait un state mis a jour via un useEffect qui ne
    // faisait que deriver "selectedChild" (aucune autre logique). Ca forcait
    // un rendu SUPPLEMENTAIRE a chaque changement d'enfant selectionne : un
    // premier rendu avec l'ancienne valeur, puis l'effet qui se declenche et
    // provoque un second rendu avec la bonne valeur - un aller-retour de
    // rendu evitable a chaque fois que l'avatar doit changer dans le header.
    // Remplace par une valeur calculee directement pendant le rendu.
    const childrenSelected = selectedChild !== null ? selectedChild?.person : selectedChild;

    const handleLanguageChange = useCallback(async (lang: any) => {
        try {
            setLanguageValue(lang);
            await i18n.changeLanguage(lang);
            dispatch(changeAppLanguage(lang));
            setTimeout(() => {
                setModal(false);
            }, 500);
        }
        catch (error) {
            console.log(error)
        }
    }, [i18n, dispatch]);

    const openDrawMenu = useCallback(() => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    }, [navigation]);

    const handleNotificationRoute = useCallback(() => {
        //setNotifModal(true);
        router.push('pages/notification');
    }, []);

    // ✅ containerIOS et containerAndroid ont exactement les memes valeurs -
    // pas besoin de refaire un choix conditionnel + un nouvel objet
    // "{backgroundColor: theme.background}" (et un nouveau tableau) a
    // CHAQUE rendu. Style de base hoiste, seul le fond depend du theme.
    const containerStyle = useMemo(
        () => [styles.container, {backgroundColor: theme.background}],
        [theme.background]
    );

    return (
        <View style={containerStyle}>
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
                            <Text style={styles.headerText}>{title}</Text>
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

                            <Pressable onPress={handleNotificationRoute}>
                                <Badge
                                    visible={true}
                                    size={18}
                                    style={styles.badge}
                                    theme={{colors: {primary: COLORS.primary}}}>
                                    {notificationNumber}
                                </Badge>
                                <MaterialIcons
                                    name="notifications"
                                    color={COLORS.secondary}
                                    size={30}
                                    style={styles.notifIcon}
                                />
                            </Pressable>
                        </View>
                        <Pressable onPress={openDrawMenu} style={styles.avatarContainer}>
                            {childrenSelected !== null && (
                                <Image
                                    source={
                                        childrenSelected.photo !== ''
                                            ? {uri: `${BASEURL_IMG}/${childrenSelected.photo}`}
                                            : IMAGES.avatar
                                    }
                                    style={styles.avatar}
                                />
                            )}
                        </Pressable>
                    </View>

                    <LanguageComponent
                        modal={modal}
                        languageValue={languageValue}
                        setModal={setModal}
                        handleLanguageChange={handleLanguageChange}
                    />

                </View>
            </ImageBackground>

        </View>
    );
};

// Rendu par la navigation comme header de chaque ecran : memoise pour eviter
// un re-rendu quand la navigation recalcule ses options sans que "title"
// (ou les donnees Redux lues ici) n'ait reellement change.
export default React.memo(CustomHeader);

const styles = StyleSheet.create({
    container: {
        height: 75,
        overflow: 'hidden',
        marginTop: 0,
        borderBottomColor: COLORS.greyMedium,
        borderBottomWidth: 1
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
    badge: {
        zIndex: 10,
    },
    notifIcon: {
        right: 2,
        marginTop: -13,
    },

});
