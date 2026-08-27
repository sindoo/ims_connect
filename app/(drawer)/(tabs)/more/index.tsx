import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from "react-redux";
import AuthenticationService from "../../../../services/AuthenticationService";
import {logoutUser} from "../../../../redux/features/userSlice";
import {ScrollView, TouchableOpacity, View, StyleSheet, Text} from "react-native";
import {COLORS} from "../../../../constants";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import {useRouter} from "expo-router";


export default function More({navigation}: {navigation: any}) {
    const {t} = useTranslation();
    const {user, userToken} = useSelector((state:any) => state.user);
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if(user !== null) {
                // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                //await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }

            const tokenExpired = AuthenticationService.checkTokenValidity(userToken);
            if(tokenExpired) {
                dispatch(logoutUser());
            }
        };
        fetchData().catch(error => {
            console.log(error);
        })
    }, []);
    return (
        <View style={styles.container}>
            <ScrollView style={{flex: 1}}>
                <View style={styles.content}>
                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/tuition')}>
                        <View style={styles.menuItem}>
                            <MaterialIcons
                                name="point-of-sale"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.schooling')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/club')}>
                        <View style={styles.menuItem}>
                            <MaterialIcons
                                name="group-work"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.mini_club')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/exchangelibrary')}>
                        <View style={styles.menuItem}>
                            <MaterialIcons
                                name="menu-book"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.exchange_library')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/picture')}>
                        <View style={styles.menuItem}>
                            <MaterialIcons
                                name="photo-library"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.pictures')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/document')}>
                        <View style={styles.menuItem}>
                            <MaterialIcons
                                name="description"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.school_document')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/marketing')}>
                        <View style={styles.menuItem}>
                            <MaterialIcons
                                name="sell"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.marketing')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => router.push('more/survey')}>
                        <View style={styles.menuItem}>
                            <MaterialCommunityIcons
                                name="message-question"
                                size={22}
                                color={COLORS.grayLightMenu}
                            />
                            <Text style={styles.itemColor}>{t('more.survey')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 15,
        backgroundColor: COLORS.white,
    },
    content: {
        marginLeft: 10,
        marginRight: 10,
    },
    menuItem: {
        padding: 10,
        flexDirection: 'row',
        borderBottomColor: COLORS.grayVeryLight,
        borderBottomWidth: 1,
        paddingBottom: 15,
        marginBottom: 15,
        //backgroundColor:'red',
    },
    itemColor: {
        marginLeft: 10,
        fontSize: 15,
        color: COLORS.gray,
    },
});
