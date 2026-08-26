import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {format, getTime} from "date-fns";
import {useNavigation} from "expo-router/react-navigation";
import {useDispatch, useSelector} from "react-redux";
import MiniClubService from "../../../../services/MiniClubService";
import {setChildMiniClubList, updateMiniClubStatus} from "../../../../redux/features/club/miniClubSlice";
import Loading from "../../../../components/ui/Loading";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {Image} from "expo-image";
import {globalStyles} from "../../../../style/Global";
import {COLORS} from "../../../../constants";
import FlatButton from "../../../../components/ui/FlatButton";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import FlatButtonClub from "../../../../components/ui/FlatButtonClub";
import RegisteredChildrenItem from "../../../../components/tabs/more/club/RegisteredChildrenItem";
import {useLocalSearchParams} from "expo-router";


function MiniClubDetails(props) {
    const {t} = useTranslation();
    // @ts-ignore
    const { registrationStatus} = useLocalSearchParams();
    const {miniClubDetailsInRedux} = useSelector((state: any) => state.miniclub);
    const amount = new Intl.NumberFormat('fr-FR').format(miniClubDetailsInRedux?.prix);
    const dateDebut = format(miniClubDetailsInRedux?.dateDebut, 'dd/MM/yyyy HH:mm');
    const dateFin = format(miniClubDetailsInRedux?.dateFin, 'dd/MM/yyyy HH:mm');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(false);
    const navigation = useNavigation();
    const [registeredChildList, setRegisteredChildList] = useState([]);
    const initDate = new Date();
    const today = getTime(initDate);
    let twoDayBeforeToday = initDate;
    twoDayBeforeToday.setDate(twoDayBeforeToday.getDate() + 2);
    const unsubscribeDate = getTime(twoDayBeforeToday);

    const dispatch = useDispatch();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user} = useSelector((state: any) => state.user);

    const handleSubscribe = async (data: any) => {
        try {
            if(selectedChild !== null && user !== null) {
                setStatus(true);
                await MiniClubService.subscription(selectedChild.person.id, user, data);
                const miniClubListFiltered = await MiniClubService.getChildClassMiniClubData(selectedChild);
                dispatch(setChildMiniClubList(miniClubListFiltered));
                dispatch(updateMiniClubStatus((prev: number) => prev + 1));

                navigation.goBack();
                setStatus(false);
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    const handleUnsubscribe = async (data: any) => {
        try {
            if(selectedChild !== null) {
                setStatus(true);
                const subscriptionInfo =  MiniClubService.getRegistrationInfo(selectedChild.person.id, data);
                if(subscriptionInfo !== null) {
                    await MiniClubService.unSubscription(subscriptionInfo);
                }

                const miniClubListFiltered = await MiniClubService.getChildClassMiniClubData(selectedChild);
                dispatch(setChildMiniClubList(miniClubListFiltered));
                dispatch(updateMiniClubStatus((prev: number) => prev + 1));

                navigation.goBack();
                setStatus(false);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if(miniClubDetailsInRedux !== null) {
                setLoading(true);
                const registeredList: any = await MiniClubService.getAllRegistration(miniClubDetailsInRedux?.inscritMiniClubs);
                setRegisteredChildList(registeredList);
                setLoading(false);
            }
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.topContent}>
                {miniClubDetailsInRedux?.uriPublicite !== '' && miniClubDetailsInRedux?.uriPublicite !== null && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{uri: `${BASEURL_IMG}/${miniClubDetailsInRedux?.uriPublicite}`}}
                            contentFit="cover"
                            style={styles.imageCover}
                        />
                    </View>
                )}
                <Text style={{...globalStyles.titleH2, textAlign: 'center'} as StyleSheet}>
                    {miniClubDetailsInRedux?.title}
                </Text>
                <View style={{flexDirection: 'row', marginTop: 10} as StyleSheet}>
                    <View style={{flex: 1}}>
                        <Text style={{color: COLORS.secondary}}>
                            {t('more.mini_club_price')} :
                        </Text>
                    </View>
                    <View style={{flex: 3}}>
                        <Text style={styles.price}>{amount} FCFA</Text>
                    </View>
                </View>
                <View style={{flexDirection: 'row'} as StyleSheet}>
                    <View style={{flex: 1}}>
                        <Text style={{color: COLORS.secondary}}>
                            {t('more.mini_club_date')} :
                        </Text>
                    </View>
                    <View style={{flex: 3}}>
                        <Text style={styles.price}>
                            {dateDebut} - {dateFin}
                        </Text>
                    </View>
                </View>
                {miniClubDetailsInRedux?.details !== '' && miniClubDetailsInRedux?.details !== null && (
                    <>
                        <Text style={{color: COLORS.secondary, marginTop: 5}}>
                            {t('more.mini_club_description')} :
                        </Text>
                        <Text style={{textAlign: 'justify', color: COLORS.gray} as StyleSheet}>{miniClubDetailsInRedux?.details}</Text>
                    </>
                )}
            </View>

            <View style={styles.registeredList}>
                {registeredChildList.length > 0 && (
                    <>
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleList}>
                                {t('more.mini_club_registeredChild')} (
                                {miniClubDetailsInRedux?.inscritMiniClubs.length}/{miniClubDetailsInRedux?.placeLimit})
                            </Text>
                        </View>

                        <ScrollView
                            style={{
                                maxHeight: '63%',
                                marginBottom: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.grayMedium,
                            } as StyleSheet}>
                            <View style={{paddingHorizontal: 15, paddingTop: 5}}>
                                <View style={styles.participant}>
                                    {registeredChildList.length > 0 &&
                                        registeredChildList.map((child: any) => (
                                            <RegisteredChildrenItem
                                                key={child?.person.id}
                                                data={child}
                                            />
                                        ))}
                                </View>
                            </View>
                        </ScrollView>
                    </>
                )}

                <View style={{marginTop: 15, marginBottom: 10, paddingHorizontal: 15}}>
                    {registrationStatus === '1' ? (
                        <>
                            {unsubscribeDate <= miniClubDetailsInRedux?.dateDebut ? (
                                <FlatButton
                                    title={t('more.unsubscribe')}
                                    fontWeight="400"
                                    fontSize={16}
                                    backgroundColor={COLORS.redIms}
                                    paddingVertical={12}
                                    borderRadius={20}
                                    onPress={() => handleUnsubscribe(miniClubDetailsInRedux)}
                                    disabled={status}
                                />
                            ) : (
                                <FlatButtonClub
                                    title={t('more.unsubscribe')}
                                    fontWeight="400"
                                    fontSize={16}
                                    backgroundColor={COLORS.grayMedium}
                                    paddingVertical={12}
                                    borderRadius={20}
                                    onPress={() => {}}
                                    disabled={true}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {today <= miniClubDetailsInRedux?.dateFin && (
                                <FlatButton
                                    title={t('more.subscribe')}
                                    fontWeight="400"
                                    fontSize={16}
                                    backgroundColor={COLORS.secondary}
                                    paddingVertical={12}
                                    borderRadius={20}
                                    onPress={() => handleSubscribe(miniClubDetailsInRedux)}
                                    disabled={status}
                                />
                            )}
                        </>
                    )}

                </View>
            </View>
        </ScrollView>
    );
}

export default withSnackbar(MiniClubDetails);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    topContent: {
        marginTop: 15,
        paddingHorizontal: 15,
    },
    imageContainer: {
        marginBottom: 20,
        overflow: 'hidden',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    imageCover: {
        width: '100%',
        height: 205,
        aspectRatio: 135 / 76,
    },
    registeredList: {
        marginTop: 15,
    },
    titleContainer: {
        borderBottomColor: COLORS.grayMedium,
        borderBottomWidth: 1,
        marginHorizontal: 15,
        paddingBottom: 10,
    },
    titleList: {
        //fontWeight: '600',
        color: COLORS.secondary,
    },
    participant: {
        flex: 1,
        //flexDirection: 'row',
        paddingTop: 10,
    },
    price: {
        color: COLORS.gray,
    }
});
