import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {globalStyles} from "../style/Global";
import ViewThemed from "../components/ui/ViewThemed";
import {COLORS, IMAGES, ROUTES} from "../constants";
import Card from "../components/ui/Card";
import {BASEURL_IMG} from "../api/appUrl";
import {changeChild} from "../redux/features/child/childSlice";
import {useRouter} from "expo-router";
import Loading from "../components/ui/Loading";

const ProfileChoice = () => {
    const [buttonStatus, setButtonStatus] = useState(false);
    const dispatch = useDispatch();
    //const {t, i18n} = useTranslation();
    const {children} = useSelector((state: any) => state.child);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleSelectChildProfile = (child: any) => {
        dispatch(changeChild(child));
        //navigation.navigate(ROUTES.HOME_DRAWER);
        router.push(ROUTES.HOME_DRAWER);
    };

    useEffect(() => {
        const fetchLoading = () => {
            setLoading(false);
        }
        fetchLoading();
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={globalStyles.container}>
            <ScrollView style={styles.profileContainer}>
                <View style={styles.containerProfileChoice}>
                    {children.length > 1 &&
                        children.map((child: any) => {
                            return (
                                <View style={styles.profileItemContainer} key={child?.id}>
                                    <Card borderRaduis={6}>
                                        <TouchableOpacity
                                            onPress={() => handleSelectChildProfile(child)}>
                                            <View style={styles.profileItem}>
                                                <View style={styles.profileImage}>
                                                    <Image
                                                        source={
                                                            child?.person?.photo !== null &&
                                                            child?.person?.photo !== ''
                                                                ? {
                                                                    uri: `${BASEURL_IMG}/${child?.person?.photo}`,
                                                                }
                                                                : IMAGES.avatar
                                                        }
                                                        resizeMode="cover"
                                                        style={styles.profileImageCover}
                                                    />
                                                </View>
                                                <Text style={styles.profileItemTitle}>
                                                    {child?.person?.nom} {child?.person?.prenom}
                                                </Text>
                                                <Text
                                                    style={{
                                                        ...styles.profile,
                                                        textTransform: 'capitalize',
                                                    } as StyleSheet}>
                                                    {child.eleves[0]?.classe?.nom}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </Card>
                                </View>
                            );
                        })}
                </View>
            </ScrollView>
        </ViewThemed>
    );
};

export default ProfileChoice;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: COLORS.white,
    },
    profileContainer: {
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: '5%',
    },
    profileItemContainer: {
        width: 138,
        marginRight: 10,
        marginBottom: 20,
    },
    containerProfileChoice: {
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        //flexWrap: "wrap"
    },

    profileItem: {
        width: 130,
        minHeight: 155,
        backgroundColor: COLORS.grayExtraLight,
        padding: 5,
    },
    profileImage: {
        alignItems: 'center',
        overflow: 'hidden',
        padding: 5,
    },
    profileImageCover: {
        width: 80,
        height: 80,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    profileItemTitle: {
        textAlign: 'center',
        fontWeight: '600',
        color: COLORS.gray,
    },
    profile: {
        textAlign: 'center',
        color: COLORS.gray,
    },
});
