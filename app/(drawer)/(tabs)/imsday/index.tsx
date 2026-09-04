import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, AppState} from "react-native";
import {globalStyles} from "../../../../style/Global";
import {COLORS, IMAGES} from "../../../../constants";
import ViewThemed from "../../../../components/ui/ViewThemed";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import {ImageBackground} from "expo-image";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import ImsDayInfoItem from "../../../../components/tabs/imsday/ImsDayInfoItem";
import ImsDayService from "../../../../services/ImsDayService";
import MenuYearService from "../../../../services/MenuYearService";
import {checkAppState, checkTokenExpired} from "../../../../services/GeneralService";
import WeekService from "../../../../services/WeekService";
import Loading from "../../../../components/ui/Loading";

const ImsDayHome = (props) => {
    const {snackbarShowMessage} = props;
    const {t} = useTranslation();
    const [imsDayList, setImsDayList] = useState<any>([]);
    const [imsDayInfo, setImsDayInfo] = useState<any>(null);
    const [menuJourList, setMenuJourList] = useState([]);
    const [menuCanteenList, setMenuCanteenList] = useState<any>([]);
    const [dishList, setDishList] = useState<any>([]);
    const [imsDayMenuData, setImsDayMenuData] = useState<any>(null);
    const [parentCommentStatus, setParentCommentStatus] = useState(false);
    const [index, setIndex] = useState(-1);
    const [weekData, setWeekData] = useState<any>([]);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state:any) => state.user);
    const [loading, setLoading] = useState(true);
    const [menuYearLoading, setMenuYearLoading] = useState(true);
    const [commentParent, setCommentParent] = useState<any>(null);
    const dispatch = useDispatch();
    const {stackStatus} = useSelector((state:any) => state.stackScreen);
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    const handleTextChange = (text: any) => {
        setCommentParent(text);
    };

    const saveParentObservation = async (index: number, comment: string) => {
        try {
            setParentCommentStatus(true);
            if (comment !== '' && imsDayInfo !== null) {
                const dataToSend = {
                    ...imsDayInfo,
                    commentaireParent: comment,
                };

                const response = await ImsDayService.getImsDay(imsDayInfo.id, dataToSend);
                setImsDayInfo(response);
                imsDayList[index] = response;
                setImsDayList(imsDayList);
                snackbarShowMessage(t('snackBar.sb_succes_save'));
            }
        }
        catch (error) {
            snackbarShowMessage(t('snackBar.sb_error'));
            console.log(error);
            setParentCommentStatus(false);
        }
    };


    const handleForward = async (index: number) => {
        setLoading(true);
        //setImsDayInfo(null);
        if (imsDayList.length > 0) {
            if (index + 1 <= imsDayList.length) {
                setIndex(index + 1);
                setParentCommentStatus(false);
                let imsDayInformation  = imsDayList[index + 1];
                setImsDayInfo(imsDayInformation);
                const dayMenuFind: any = menuJourList.find(
                    (menuJour: any) => menuJour.id === imsDayList[index + 1]?.menuJourId,
                );
                const weekFind = weekData.find(
                    (week: any) => week.id == dayMenuFind?.semaineId,
                );
                if (dayMenuFind !== undefined && weekFind !== undefined) {
                    const dayListMenuTab = MenuYearService.getMenuDayList(
                        menuJourList,
                        dayMenuFind,
                        weekFind,
                        menuCanteenList,
                        dishList,
                    );

                    if (dayListMenuTab.length > 0) {
                        setImsDayMenuData(dayListMenuTab[0]);
                    }
                }
                else {
                    if(dayMenuFind === undefined){
                        let dayMenuFounded = await MenuYearService.getMenuJour(imsDayList[index + 1]?.menuJourId);
                        setImsDayMenuData(null);
                        const dayListMenuTab:any = MenuYearService.getMenuDayListWithoutWeek(
                            dayMenuFounded,
                            menuCanteenList,
                            dishList,
                        );

                        if (dayListMenuTab.length > 0) {
                            setImsDayMenuData(dayListMenuTab[0]);
                        }
                    }
                }
            } else {
                setIndex(imsDayList.length);
            }
        }
        setLoading(false);
    };


    const handleBack = async (index: number) => {
        setLoading(true);
        //setImsDayInfo(null);
        if (imsDayList.length > 0) {
            if (index - 1 >= 0) {
                let imsDayInformation  = imsDayList[index - 1];
                setImsDayInfo(imsDayInformation);
                setIndex(index - 1);
                setParentCommentStatus(false);
                const dayMenuFind: any = menuJourList.find(
                    (menuJour: any) => menuJour.id === imsDayList[index - 1]?.menuJourId,
                );
                const weekFind = weekData.find(
                    (week: any) => week.id == dayMenuFind?.semaineId,
                );

                if (dayMenuFind !== undefined && weekFind !== undefined) {
                    const dayListMenuTab = MenuYearService.getMenuDayList(
                        menuJourList,
                        dayMenuFind,
                        weekFind,
                        menuCanteenList,
                        dishList,
                    );

                    if (dayListMenuTab.length > 0) {
                        setImsDayMenuData(dayListMenuTab[0]);
                    }
                }
                else {
                    if(dayMenuFind === undefined){
                        let dayMenuFounded = await MenuYearService.getMenuJour(imsDayList[index - 1]?.menuJourId);
                        setImsDayMenuData(null);
                        const dayListMenuTab:any = MenuYearService.getMenuDayListWithoutWeek(
                            dayMenuFounded,
                            menuCanteenList,
                            dishList,
                        );

                        if (dayListMenuTab.length > 0) {
                            setImsDayMenuData(dayListMenuTab[0]);
                        }
                    }
                }
            } else {
                setIndex(0);
            }
        }
        setLoading(false);
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setImsDayList([]);
                setImsDayInfo(null);
                setIndex(-1);
                setMenuCanteenList([]);
                setDishList([]);
                setImsDayMenuData(null);

                if(selectedChild !== null) {
                    // ALL IMS DAY MENU LIST
                    const childImsDayList = await ImsDayService.getChildImsDay(selectedChild.person.id);
                    // CONNECTED CHILD IMS DAY LIST
                    if (childImsDayList.length > 0) {
                        setImsDayList(childImsDayList);
                        let imsDayInformation = childImsDayList[childImsDayList.length - 1];
                        setImsDayInfo(imsDayInformation);
                        setIndex(childImsDayList.length - 1);
                        setLoading(false);

                        // GET MENU DAY LIST
                        const menuJourListRequest = await MenuYearService.getMenuByDayList();
                        setMenuJourList(menuJourListRequest);
                        // GET MENU CANTEEN
                        const menuCanteenRequest = await MenuYearService.getMenuCanteen();
                        setMenuCanteenList(menuCanteenRequest);
                        // GET PLAT CANTEEN STATER DISH - DISH - DESSERT
                        const dishRequestList = await MenuYearService.getPlatCanteen();
                        setDishList(dishRequestList);

                        let dayMenuFind = menuJourListRequest.find(
                            (menuJour: any) =>
                                menuJour.id ===
                                childImsDayList[childImsDayList.length - 1]?.menuJourId,
                        );

                        if(dayMenuFind === undefined){
                            dayMenuFind = await MenuYearService.getMenuJour(childImsDayList[childImsDayList.length - 1]?.menuJourId);
                        }

                        // ALL WEEK DATA
                        const weekListRequest = await WeekService.getAllWeekData();
                        const weekFind = weekListRequest.find(
                            (week: any) => week.id == dayMenuFind?.semaineId,
                        );
                        setWeekData(weekListRequest);

                        let dayListMenuTab:any = [];
                        if (dayMenuFind !== undefined && weekFind !== undefined) {
                            dayListMenuTab = MenuYearService.getMenuDayList(
                                menuJourListRequest,
                                dayMenuFind,
                                weekFind,
                                menuCanteenRequest,
                                dishRequestList,
                            );
                            if (dayListMenuTab.length > 0) {
                                setImsDayMenuData(dayListMenuTab[0]);
                            }
                        }
                        else {
                            if(dayMenuFind !== undefined){
                                dayListMenuTab = MenuYearService.getMenuDayListWithoutWeek(
                                    dayMenuFind,
                                    menuCanteenRequest,
                                    dishRequestList,
                                );

                                if (dayListMenuTab.length > 0) {
                                    setImsDayMenuData(dayListMenuTab[0]);
                                }
                            }
                        }
                    }
                    setMenuYearLoading(false);
                }

                setLoading(false);
                if(user !== null) {
                    // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                    //await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
                }

                checkTokenExpired(userToken, dispatch);
            }
            catch (error) {
                console.log(error);
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
        };

        fetchData().catch(error => {
            console.log(error);
        })

        const subscription = checkAppState(appState, setCount);

        return () => {
            //clearInterval(interval);
            subscription.remove();
        };


    }, [selectedChild]);

    if (loading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={{...globalStyles.container, borderTopColor: COLORS.greyMedium, borderTopWidth: 1}}>
            <ScrollView style={styles.container}>
                <ImageBackground
                    source={IMAGES.backgroundImageApp}
                    contentFit="cover"
                    style={styles.backgroundImage}>
                    <View style={styles.myImsDayContainer}>
                        {imsDayList.length === 0 && (
                            <>
                                <Text style={{textAlign: 'center', color: COLORS.gray} as StyleSheet}>
                                    {t('myDayAtIms.empty_ims_day')}
                                </Text>
                            </>
                        )}

                        {imsDayInfo !== null && (
                            <ImsDayInfoItem
                                styles={styles}
                                index={index}
                                imsDayMenuData={imsDayMenuData}
                                imsDayInfo={imsDayInfo}
                                parentCommentStatus={parentCommentStatus}
                                setParentCommentStatus={setParentCommentStatus}
                                saveParentObservation={saveParentObservation}
                                handleBack={handleBack}
                                handleForward={handleForward}
                                size={imsDayList.length - 1}
                                commentParent={commentParent}
                                setCommentParent={setCommentParent}
                                handleTextChange={handleTextChange}
                                menuYearLoading={menuYearLoading}
                                setMenuYearLoading={setMenuYearLoading}
                                //handleTextChange={handleTextChange}
                            />
                        )}
                    </View>
                </ImageBackground>
            </ScrollView>
        </ViewThemed>
    );
};

export default withSnackbar(ImsDayHome);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    backgroundImage: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    myImsDayContainer: {
        paddingTop: 15,
    },
    imsDayHeader: {
        flex: 1,
        flexDirection: 'row',
    },
    previousButton: {
        flex: 1,
        paddingLeft: 15,
        justifyContent: 'center',
    },
    imsDayHeaderTitle: {
        flex: 4,
    },
    nextButton: {
        flex: 1,
        paddingRight: 15,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    howIateContainer: {
        padding: 10,
        paddingTop: 20,
    },
    napTimeContainer: {
        padding: 10,
        paddingTop: 20,
    },
    imsDayItem: {
        flex: 1,
        flexDirection: 'row',
    },
    imsDayItemText: {
        flex: 1,
        //height: 80,
    },
    imsDayItemImage: {
        flex: 1,
        alignItems: 'center',
        overflow: 'hidden',
    },
    dayItemImageCover: {
        width: '100%',
        height: 80,
    },
    bowelContainer: {
        padding: 10,
        paddingTop: 20,
    },
    injuriesContainer: {
        padding: 10,
        paddingTop: 20,
    },
    parentComment: {
        padding: 10,
        paddingTop: 20,
        marginBottom: 15,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
        color: COLORS.gray,
    },
    imsDayWhatIneed: {
        //flex: 1,
        //flexDirection: 'row',
        paddingTop: 10,
        paddingLeft: 15,
        paddingRight: 15,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
});
