import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, AppState} from "react-native";
import ViewThemed from "../../../components/ui/ViewThemed";
import {globalStyles} from "../../../style/Global";
import {CANTEEN_OBSERVATION_EN, CANTEEN_OBSERVATION_FR, COLORS, IMAGES, TIME_ZONE_ABIDJAN} from "../../../constants";
import {ImageBackground, Image} from "expo-image";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import FlatButton from "../../../components/ui/FlatButton";
import {format, getHours, getMinutes, getTime, set, toDate} from 'date-fns';
import {enUS, fr} from 'date-fns/locale';
import ImsDayService from "../../../services/ImsDayService";
import {checkAppState, checkTokenExpired} from "../../../services/GeneralService";
import {toZonedTime} from "date-fns-tz";
import {getRequest} from "../../../api/ApiManager";

const home = () => {
    const {selectedChild, children} = useSelector((state: any) => state.child);
    const selectedChildClass = selectedChild?.eleves.length >0 ? selectedChild?.eleves[0]?.classe : null;
    const {employeesClassList, teacherList} = useSelector((state: any) => state.employee);
    //const {activeAppointmentList, allAppointmentList} = useSelector((state: any) => state.appointment);
    const {openAlert, dataNotification} = useSelector((state: any) => state.alertMessage);
    const {user, userToken} = useSelector((state:any) => state.user);
    const dispatch = useDispatch();

    const [date, setDate] = useState(new Date());
    const {t, i18n} = useTranslation();
    const [upcomingAppointHome, setUpcomingAppointHome] = useState([]);
    const [menuPLatCanteen, setMenuPLatCanteen] = useState([]);
    const [dataMenuList, setDataMenuList] = useState<any>([]);
    const [weekData, setWeekData] = useState<any>([]);
    const [week, setWeek] = useState<any | ''>('');
    const [workDaysList, setWorkDaysList] = useState<any>([]);
    const [workDaysNameList, setWorkDaysNameList] = useState<any>([]);
    const [dataMenuJourList, setDataMenuJourList] = useState<any>([]);
    const [dayMenuDetails, setDayMenuDetails] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [menuYearLoading, setMenuYearLoading] = useState(false);
    const [imsDayInfo, setImsDayInfo] = useState<any>(null);
    const [statusMenuApp, setStatusMenuApp] = useState(false);
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setMenuYearLoading(true);
            if (selectedChild !== null) {
                const upcomingAppointment: any = [];
                setMenuPLatCanteen([]);
                setDataMenuList([]);
                setWeekData([]);
                setWorkDaysList([]);
                setWorkDaysNameList([]);
                setWeek('');
                setDataMenuJourList([]);
                setImsDayInfo(null);
                setUpcomingAppointHome([]);

                //GET EMPLOYEES AND TEACHERS OF CHILD CLASS
                /*const employeesRes = await EmployeeService.getChildClassEmployees(selectedChild);
                dispatch(getEmployeesTeacher({
                        employees: employeesRes.employees,
                        teacher: employeesRes.teacher,
                        teacherList: employeesRes.teacherList,
                        employeesClassList: employeesRes.employeesClassList,
                    }),
                );*/

                //GET APPOINTMENT LIST
                //const allRdvListSort = await AppointmentService.getAllAppointment(selectedChild.person.id);
                setLoading(false);

                /*if(allRdvListSort !== undefined) {
                    dispatch(setAllAppointmentList(allRdvListSort));
                    const activeAppointmentList = AppointmentService.getChildActiveAppointmentList(allRdvListSort);
                    let count = 0;
                    if (activeAppointmentList.length > 0) {
                        for (let i = 0; i < activeAppointmentList.length; i++) {
                            if (count < 3) {
                                upcomingAppointment.push(activeAppointmentList[i]);
                                count++;
                            } else {
                                break;
                            }
                        }
                        setUpcomingAppointHome(upcomingAppointment);
                    }
                }*/


                const allImsDayList = await ImsDayService.getChildImsDay(selectedChild?.person?.id);
                allImsDayList.reverse();
                console.log('ALL IMS DAY LIST : ', JSON.stringify(allImsDayList));
                if (allImsDayList.length > 0) {
                    let imsDayInformation = {
                        ...allImsDayList[0],
                        timeDebutSieste: toZonedTime(allImsDayList[0]?.timeDebutSieste, TIME_ZONE_ABIDJAN),
                        timeFinSieste:  toZonedTime(allImsDayList[0]?.timeFinSieste, TIME_ZONE_ABIDJAN),
                    };
                    setImsDayInfo(imsDayInformation);
                }

                //GET MENU CANTEEN DETAILS
                //await getMenuCanteenDetails();

                // HANDLE NOTIFICATION
                //await handleFirebaseNotification();
                //await handleNotifyNotification();
            }
            setLoading(false);

            if(user !== null) {
                // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                //await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }

            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => {
            console.log(JSON.stringify(error));
            setMenuYearLoading(false);
            setLoading(false);
            checkTokenExpired(userToken, dispatch);
        });

        const subscription = checkAppState(appState, setCount);
        return () => {
            subscription.remove();
        };
    }, [selectedChild]);

    return (
        <ViewThemed style={{...globalStyles.container, borderTopColor: COLORS.greyMedium, borderTopWidth: 1}}>
            <ScrollView style={styles.container}>
                <ImageBackground
                    source={IMAGES.backgroundImageApp}
                    contentFit="cover"
                    style={styles.backgroundImage}>

                    {/** BOX IMS DAY */}
                    <View style={styles.imsDay}>
                        <Text style={globalStyles.title}>{t('home.my_day_ims')}</Text>
                        <Text>{}</Text>
                        {imsDayInfo !== null && (
                            <View style={styles.imsDayContainer}>
                                <Text style={styles.todayImsDay}>
                                    {format(
                                        imsDayInfo?.theDate,
                                        i18n.language === 'en'
                                            ? 'EEEE, MMMM dd yyyy'
                                            : 'EEEE, dd MMMM yyyy',
                                        {locale: i18n.language === 'en' ? enUS : fr},
                                    )}
                                </Text>

                                <View style={styles.imsDayItem}>
                                    <View style={styles.imsDayItemText}>
                                        <Text style={globalStyles.titleH2}>{t('home.nap_time')}</Text>
                                        {imsDayInfo?.sieste ? (
                                            <>
                                                <Text style={globalStyles.paragraph}>
                                                    {t('home.start_nap_time')} :{' '}
                                                    {format(
                                                        imsDayInfo?.timeDebutSieste !== null
                                                            ? imsDayInfo?.timeDebutSieste
                                                            : 0,
                                                        i18n.language === 'en' ? 'hh:mm a' : 'H:mm',
                                                        {locale: i18n.language === 'en' ? enUS : fr},
                                                    )}
                                                </Text>
                                                <Text style={globalStyles.paragraph}>
                                                    {t('home.end_nap_time')} :{' '}
                                                    {format(
                                                        imsDayInfo?.timeFinSieste !== null
                                                            ? imsDayInfo?.timeFinSieste
                                                            : 0,
                                                        i18n.language === 'en' ? 'hh:mm a' : 'H:mm',
                                                        {locale: i18n.language === 'en' ? enUS : fr},
                                                    )}
                                                </Text>
                                            </>
                                        ) : (
                                            <Text style={globalStyles.paragraph}>
                                                {t('myDayAtIms.no_nap_time')}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.imsDayItemImage}>
                                        <Image
                                            source={IMAGES.sleepNatimeImage}
                                            contentFit="cover"
                                            style={styles.dayItemImageCover}
                                        />
                                    </View>
                                </View>

                                {imsDayInfo?.observationCantine !== '' &&
                                    imsDayInfo?.observationCantine !== null && (
                                        <View style={styles.imsDayItem}>
                                            <View style={styles.imsDayItemText}>
                                                <Text style={globalStyles.titleH2}>
                                                    {t('home.how_i_ate')}
                                                </Text>
                                                <Text style={globalStyles.paragraph}>
                                                    {i18n.language === 'en'
                                                        ? CANTEEN_OBSERVATION_EN[
                                                            imsDayInfo?.observationCantine
                                                            ]
                                                        : CANTEEN_OBSERVATION_FR[
                                                            imsDayInfo?.observationCantine
                                                            ]}
                                                </Text>
                                            </View>

                                            <View style={styles.imsDayItemImage}>
                                                <Image
                                                    source={IMAGES.howIateImage}
                                                    contentFit="cover"
                                                    style={styles.dayItemImageCover}
                                                />
                                            </View>
                                        </View>
                                    )}

                                <View style={{marginTop: 10, marginBottom: 10}}>
                                    <FlatButton
                                        title={t('home.more_details')}
                                        fontWeight="400"
                                        fontSize={16}
                                        backgroundColor={COLORS.secondary}
                                        paddingVertical={12}
                                        borderRadius={20}
                                        onPress={() => navigation.navigate('MyImsDay')}
                                        disabled={false}
                                    />
                                </View>
                            </View>
                        )}
                    </View>


                </ImageBackground>
            </ScrollView>
        </ViewThemed>
    );
};

export default home;

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
    imsDay: {
        paddingTop: 20,
    },
    imsDayContainer: {
        borderRadius: 10,
        backgroundColor: COLORS.grayVeryLight,
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 15,
        paddingRight: 15,
    },
    todayImsDay: {
        textAlign: 'center',
        color: COLORS.gray,
        marginBottom: 15,
        textTransform: 'capitalize',
    },
    imsDayWhatIneed: {
        flex: 1,
        //flexDirection: 'row',
        borderRadius: 10,
        padding: 10,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
    imsDayItem: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 10,
        padding: 10,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
    imsDayItemText: {
        flex: 3,
        height: 80,
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
    itemDayTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingBottom: 10,
    },
    appointment: {
        flex: 1,
        paddingTop: 20,
    },
    appointmentContainer: {
        flex: 1,
        //flexDirection: 'row',
        paddingBottom: 10,
    },
    appointmentItem: {
        width: 130,
        minHeight: 145,
        backgroundColor: COLORS.grayVeryLight,
        padding: 5,
    },
    appointItemContainer: {
        flex: 1,
        //marginRight: 10,
    },
    appointImage: {
        alignItems: 'center',
        overflow: 'hidden',
        padding: 5,
    },
    appointImageCover: {
        width: 65,
        height: 65,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    appointItemTitle: {
        textAlign: 'center',
        fontWeight: '600',
        color: COLORS.gray,
    },
    appoint: {
        textAlign: 'center',
        color: COLORS.gray,
    },
});

