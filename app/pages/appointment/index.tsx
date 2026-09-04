import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View, StyleSheet, TouchableOpacity} from "react-native";
import ViewThemed from "../../../components/ui/ViewThemed";
import {globalStyles} from "../../../style/Global";
import {format, getHours, getMinutes, toDate} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {toZonedTime} from "date-fns-tz";
import {COLORS, IMAGES, TIME_ZONE_ABIDJAN} from "../../../constants";
import {BASEURL_IMG} from "../../../api/appUrl";
import {Image} from "expo-image";
import FlatButton from "../../../components/ui/FlatButton";
import {useLocalSearchParams, useRouter} from "expo-router";
import {withSnackbar} from "../../../components/ui/SnackbarHOC";
import {removeAppointment} from "../../../redux/features/appointment/appointmentSlice";
import {request} from "../../../api/ApiManager";
import Loading from "../../../components/ui/Loading";
import ButtonActionStatus from "../../../components/tabs/appointment/ButtonActionStatus";

const AppointmentDetails = (props) => {
    const {route, snackbarShowMessage} = props;
    const {t, i18n} = useTranslation();
    const { location} = useLocalSearchParams();
    const {appointmentDetailsInRedux} = useSelector((state: any) => state.appointment);
    const {employees, teacherList} = useSelector((state: any) => state.employee);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user} = useSelector((state: any) => state.user);
    const [teacherData, setTeacherData] = useState<any>(null);
    const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
    let dayDate: any = appointmentDetails !== null ? toDate(appointmentDetailsInRedux.dateDebut) : toDate(appointmentDetailsInRedux?.dateDebut);
    let datefin: any = appointmentDetails !== null ? toDate(appointmentDetailsInRedux.dateFin) : toDate(appointmentDetailsInRedux?.dateFin);
    dayDate = toZonedTime(dayDate, TIME_ZONE_ABIDJAN);
    datefin = toZonedTime(datefin, TIME_ZONE_ABIDJAN);

    let startTime = `${String(getHours(dayDate)).padStart(2, '0')}:${String(getMinutes(dayDate)).padStart(2, '0')}`;
    let endTime = `${String(getHours(datefin)).padStart(2, '0')}:${String(getMinutes(datefin)).padStart(2, '0')}`;

    const [dateParent, setDateParent] = useState<any>(null);
    const [timeParent, setTimeParent] = useState<any>(null);
    const [dateEmployee, setDateEmployee] = useState<any>(null);
    const [timeEmployee, setTimeEmployee] = useState<any>(null);
    const parentId: any = user.userDetails.personDetails.person.id;
    const userId: any = user.id;
    const [loading, setLoading] = useState(true);
    let indexCrenauChoice = -1;
    const dispatch = useDispatch();
    const [deadlinePresetMeeting, setDeadlinePresetMeeting] = useState(false);
    const router = useRouter();

    if (appointmentDetailsInRedux?.meetingType === 'PRESET') {
        if (appointmentDetailsInRedux?.creneauRdvs[0]?.creneauRdvEnfantParents.length > 0) {
            dayDate = toDate(appointmentDetailsInRedux?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.dateDebut);
            datefin = toDate(appointmentDetailsInRedux?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.dateFin);

            dayDate = toZonedTime(dayDate, TIME_ZONE_ABIDJAN);
            datefin = toZonedTime(datefin, TIME_ZONE_ABIDJAN);

            startTime = `${String(getHours(dayDate)).padStart(2, '0')}:${String(getMinutes(dayDate)).padStart(2, '0')}`;
            endTime = `${String(getHours(datefin)).padStart(2, '0')}:${String(getMinutes(datefin)).padStart(2, '0')}`;
        }

        for (let i = 0; i < appointmentDetailsInRedux?.creneauRdvs.length; i++) {
            if (appointmentDetailsInRedux?.creneauRdvs[i]?.creneauRdvEnfantParents?.length > 0) {
                if (appointmentDetailsInRedux.creneauRdvs[i]?.creneauRdvEnfantParents[0]?.enfantId === selectedChild.person.id) {
                    dayDate = toDate(appointmentDetailsInRedux?.creneauRdvs[i]?.creneauRdvEnfantParents[0]?.dateDebut);
                    datefin = toDate(appointmentDetailsInRedux?.creneauRdvs[i]?.creneauRdvEnfantParents[0]?.dateFin);
                    dayDate = toZonedTime(dayDate, TIME_ZONE_ABIDJAN);
                    datefin = toZonedTime(datefin, TIME_ZONE_ABIDJAN);

                    startTime = `${String(getHours(dayDate)).padStart(2, '0')}:${String(getMinutes(dayDate)).padStart(2, '0')}`;
                    endTime = `${String(getHours(datefin)).padStart(2, '0')}:${String(getMinutes(datefin)).padStart(2, '0')}`;
                    indexCrenauChoice = i;
                }
            }
        }
    }

    const handleDeleteRdv = (data: any) => {
        //navigation.navigate('Appointment');
        request('DELETE', '', `/extra/rdv/${data.id}`, {})
            .then(response => {
                dispatch(removeAppointment(data));
                router.push('/(drawer)/(tabs)/appointment/all-appointment');
            })
            .catch(error => {
                console.log(JSON.stringify(error));
                snackbarShowMessage(t('snackBar.sb_error'));
            });
    };

    useEffect(() => {
        const fetchData = async () => {
            //console.log("appointmentDetailsInRedux:", JSON.stringify(appointmentDetailsInRedux));
            try {
                setLoading(true);
                setAppointmentDetails(appointmentDetailsInRedux);
                if (appointmentDetailsInRedux?.creneauRdvs.length > 0) {
                    const teacherFind = employees.find(
                        (teacher: any) =>
                            teacher.person.id ===
                            appointmentDetailsInRedux.creneauRdvs[0].creneauRdvEmployees[0].employeeId,
                    );
                    setTeacherData(teacherFind);
                    let creaneauParent: any = appointmentDetailsInRedux.creneauRdvs[0].creneauRdvEnfantParents.length > 0
                        ? appointmentDetailsInRedux.creneauRdvs[0].creneauRdvEnfantParents[0]
                        : null;
                    let creaneauEmployee: any = appointmentDetailsInRedux.creneauRdvs[0].creneauRdvEmployees.length > 0
                        ? appointmentDetailsInRedux.creneauRdvs[0].creneauRdvEmployees[0]
                        : null;
                    // PRESET
                    if (appointmentDetailsInRedux.meetingType === 'PRESET') {
                        setTeacherData(null);
                        creaneauParent = appointmentDetailsInRedux.creneauRdvs[indexCrenauChoice].creneauRdvEnfantParents.length > 0 ? appointmentDetailsInRedux.creneauRdvs[indexCrenauChoice].creneauRdvEnfantParents[0] : null;
                        creaneauEmployee = appointmentDetailsInRedux.creneauRdvs[indexCrenauChoice].creneauRdvEmployees.length > 0 ? appointmentDetailsInRedux.creneauRdvs[indexCrenauChoice].creneauRdvEmployees[0] : null;
                    }

                    if (creaneauParent !== null) {
                        //PARENT
                        let dayParent: any = toDate(creaneauParent?.dateDebut);
                        let dayParentFin: any = toDate(creaneauParent?.dateFin);
                        dayParent = toZonedTime(dayParent, TIME_ZONE_ABIDJAN);
                        dayParentFin = toZonedTime(dayParentFin, TIME_ZONE_ABIDJAN);

                        const startTimeParent = `${String(getHours(dayParent)).padStart(2, '0')}:${String(getMinutes(dayParent)).padStart(2, '0')}`;
                        const endTimeParent = `${String(getHours(dayParentFin)).padStart(2, '0')}:${String(getMinutes(dayParentFin)).padStart(2, '0')}`;
                        setDateParent(dayParent);
                        setTimeParent(`${startTimeParent} - ${endTimeParent}`);
                    }

                    if (creaneauEmployee !== null) {
                        //EMPLOYEE
                        let dayEmployee: any = toDate(creaneauEmployee?.dateDebut);
                        let dayEmployeeFin: any = toDate(creaneauEmployee?.dateFin);
                        dayEmployee = toZonedTime(dayEmployee, TIME_ZONE_ABIDJAN);
                        dayEmployeeFin = toZonedTime(dayEmployeeFin, TIME_ZONE_ABIDJAN);

                        const startTimeEmployee = `${String(getHours(dayEmployee)).padStart(2, '0')}:${String(getMinutes(dayEmployee)).padStart(2, '0')}`;
                        const endTimeEmployee = `${String(getHours(dayEmployeeFin)).padStart(2, '0')}:${String(getMinutes(dayEmployeeFin)).padStart(2, '0')}`;
                        setDateEmployee(dayEmployee);
                        setTimeEmployee(`${startTimeEmployee} - ${endTimeEmployee}`);
                    }
                }
                setLoading(false);

                // DEADLINE PRESET MEETING
                if(appointmentDetailsInRedux.meetingType === 'PRESET') {
                    const dateDebutMeeting = appointmentDetailsInRedux.dateDebut - appointmentDetailsInRedux.deadlineUpdate;
                    const today = new Date().setHours(23, 59, 59, 0);
                    if (dateDebutMeeting > 0) {
                        if (today < dateDebutMeeting) {
                            setDeadlinePresetMeeting(true);
                        } else {
                            setDeadlinePresetMeeting(false);
                        }
                    }
                }
            }
            catch (error) {
                console.log("Error fetching data in AppointmentDetails:", error);
                setLoading(false);
            }

        };
        fetchData().catch(error => {
            console.log(error);
            //setLoading(false);
        });
    }, [appointmentDetailsInRedux]);

    if(loading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={globalStyles.container}>
            <ScrollView style={{flex: 1}}>
                {appointmentDetailsInRedux !== null && (
                    <View style={styles.detailsContanier}>
                        <View style={styles.appointmentDetails}>
                            <View style={styles.appointmentImage}>
                                <Image
                                    source={
                                        teacherData !== null && teacherData !== undefined && teacherData?.person.photo !== ''
                                            ? {uri: `${BASEURL_IMG}/${teacherData?.person.photo}`}
                                            : IMAGES.avatar
                                    }
                                    contentFit="cover"
                                    style={styles.appointImageCover}
                                />
                                {/*{(
                                    <View
                                        style={{
                                            ...((appointmentDetailsInRedux.meetingStatus === 'CONFIRM' &&
                                                    styles.validateStatus) ||
                                                (indexCrenauChoice !== -1 &&
                                                    appointmentDetailsInRedux.meetingType === 'PRESET' &&
                                                    appointmentDetailsInRedux?.creneauRdvs[indexCrenauChoice]
                                                        ?.creneauRdvEnfantParents[0]?.meetingStatus ===
                                                    'CONFIRM' &&
                                                    styles.validateStatus) ||
                                                (appointmentDetailsInRedux.meetingStatus === 'NOT_RESPECTED' &&
                                                    styles.validateStatus) ||
                                                (appointmentDetailsInRedux.meetingStatus === 'WAIT' &&
                                                    styles.pendingStatus) ||
                                                (appointmentDetailsInRedux.meetingStatus === 'REPORT' &&
                                                    styles.pendingStatus) ||
                                                (appointmentDetailsInRedux.meetingStatus === 'NOT_HELD' &&
                                                    styles.pendingStatus) ||
                                                (appointmentDetailsInRedux.meetingStatus === 'PARTIAL_CONFIRM' &&
                                                    styles.pendingStatus) ||
                                                (appointmentDetailsInRedux.meetingStatus === 'CANCEL' &&
                                                    styles.cancelStatus)),
                                        } as StyleSheet}
                                    />
                                )}*/}

                                {(appointmentDetailsInRedux.meetingStatus === 'WAIT' ||
                                    //appointmentDetails.meetingStatus === 'REPORT' ||
                                    appointmentDetailsInRedux.meetingStatus === 'NOT_HELD' ||
                                    appointmentDetailsInRedux.meetingStatus === 'PARTIAL_CONFIRM' ||
                                    appointmentDetailsInRedux.meetingStatus === 'CANCEL') && appointmentDetailsInRedux.creneauRdvs[0].employeeNbrAction === 0 && userId === appointmentDetailsInRedux.userInitor && (
                                        <TouchableOpacity
                                            onPress={() => handleDeleteRdv(appointmentDetailsInRedux)}
                                            style={{marginTop: 10}}>
                                            <Text style={styles.deleteAppointment}>{t('appointment.delete')}</Text>
                                        </TouchableOpacity>
                                    )}
                            </View>

                            <View style={styles.appointmentInfoContainer}>
                                <Text style={{...globalStyles.titleH2}}>
                                    {appointmentDetailsInRedux.objet}
                                </Text>
                                <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start',  marginBottom: 7, } as StyleSheet}>
                                    <Text style={{marginBottom: 5,padding:3, paddingHorizontal:7, fontSize: 11, fontWeight: 400, borderRadius: 5, ...((appointmentDetailsInRedux.meetingType === 'NORMAL' &&
                                                appointmentDetailsInRedux.meetingStatus === 'CONFIRM' &&
                                                styles.validateStatus) ||
                                            (indexCrenauChoice !== -1 &&
                                                appointmentDetailsInRedux.meetingType === 'PRESET' &&
                                                appointmentDetailsInRedux?.creneauRdvs[indexCrenauChoice]
                                                    ?.creneauRdvEnfantParents[0]?.meetingStatus === 'CONFIRM' &&
                                                styles.validateStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'NOT_RESPECTED' &&
                                                styles.validateStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'WAIT' && styles.pendingStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'REPORT' && styles.pendingStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'NOT_HELD' && styles.pendingStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'PARTIAL_CONFIRM' &&
                                                styles.pendingStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'CANCEL' && styles.cancelStatus))} as StyleSheet }>
                                        {
                                            appointmentDetailsInRedux.meetingType === 'NORMAL' &&
                                            appointmentDetailsInRedux.meetingStatus === 'CONFIRM' &&
                                            t('appointment.confirmed') ||
                                            (indexCrenauChoice !== -1 && appointmentDetailsInRedux.meetingType === 'PRESET' && appointmentDetailsInRedux?.creneauRdvs[indexCrenauChoice]?.creneauRdvEnfantParents[0]?.meetingStatus === 'CONFIRM' && t('appointment.confirmed')) ||
                                            appointmentDetailsInRedux.meetingStatus === 'NOT_RESPECTED' &&
                                            t('appointment.confirmed') ||
                                            (appointmentDetailsInRedux.meetingStatus === 'WAIT' && t('appointment.pending')) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'REPORT' && t('appointment.pending')) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'NOT_HELD' && t('appointment.pending')) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'PARTIAL_CONFIRM' && t('appointment.pending')) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'CANCEL' && t('appointment.cancelled'))
                                        }
                                    </Text>
                                </View>
                                {appointmentDetailsInRedux.details !== '' && (
                                        <Text
                                            style={{
                                                marginBottom: 5,
                                                marginTop: -5,
                                                color: COLORS.gray,
                                            }}>
                                            {appointmentDetailsInRedux.details}
                                        </Text>
                                    )}


                                <View style={styles.information}>
                                    <Text style={{...styles.labelContainer, ...styles.textGray}}>
                                        {t('allAppointment.employee_field_label')}
                                    </Text>
                                    {teacherData !== null && teacherData !== undefined ? (
                                        <Text style={{...styles.textContainer, ...styles.textGray}}>
                                            {teacherData?.person.prenom} {teacherData?.person.nom}
                                        </Text>
                                    ) : (
                                        <>
                                            {selectedChild !== null && selectedChild?.eleves.length > 0 && (
                                                <Text style={{...styles.textContainer, ...styles.textGray}}>
                                                    {selectedChild?.eleves[0]?.classe.nom}
                                                </Text>
                                            )
                                            }
                                        </>
                                    )}
                                </View>

                                {appointmentDetailsInRedux.meetingStatus !== 'REPORT' && (
                                        <>
                                            <View style={styles.information}>
                                                <Text
                                                    style={{...styles.labelContainer, ...styles.textGray}}>
                                                    {t('allAppointment.date_field_label')}
                                                </Text>

                                                <Text
                                                    style={{
                                                        ...styles.textContainer,
                                                        textTransform: 'capitalize',
                                                        ...styles.textGray,
                                                    } as StyleSheet}>
                                                    {i18n.language == 'en'
                                                        ? `${format(dayDate, 'EEE', {locale: enUS})} ${format(
                                                            dayDate,
                                                            'MMMM',
                                                            {locale: enUS},
                                                        )} ${String(dayDate.getDate()).padStart(
                                                            2,
                                                            '0',
                                                        )}, ${format(dayDate, 'yyyy', {locale: enUS})}`
                                                        : `${format(dayDate, 'EEE', {locale: fr})} ${String(
                                                            dayDate.getDate(),
                                                        ).padStart(2, '0')} ${format(dayDate, 'MMMM', {
                                                            locale: fr,
                                                        })} ${format(dayDate, 'yyyy', {locale: fr})}`}
                                                </Text>
                                            </View>

                                            <View style={styles.information}>
                                                <Text
                                                    style={{...styles.labelContainer, ...styles.textGray}}>
                                                    {t('allAppointment.startime_field_label')}
                                                </Text>
                                                <Text
                                                    style={{...styles.textContainer, ...styles.textGray}}>
                                                    {startTime}
                                                </Text>
                                            </View>

                                            <View style={styles.information}>
                                                <Text
                                                    style={{...styles.labelContainer, ...styles.textGray}}>
                                                    {t('allAppointment.endtime_field_label')}
                                                </Text>
                                                <Text
                                                    style={{...styles.textContainer, ...styles.textGray}}>
                                                    {endTime}
                                                </Text>
                                            </View>
                                        </>
                                    )}

                                <View style={styles.information}>
                                    <Text style={{...styles.labelContainer, ...styles.textGray}}>
                                        {t('presetAppointment.child')}
                                    </Text>
                                    <Text style={{...styles.textContainer, ...styles.textGray}}>
                                        {selectedChild !== null
                                            ? `${selectedChild?.person.prenom} ${selectedChild?.person.nom}`
                                            : ''}
                                    </Text>
                                </View>

                                <View style={styles.information}>
                                    <Text style={{...styles.labelContainer, ...styles.textGray}}>
                                        {t('presetAppointment.classroom')}
                                    </Text>
                                    <Text style={{...styles.textContainer, ...styles.textGray}}>
                                        {selectedChild !== null && selectedChild?.eleves.length > 0
                                            ? selectedChild?.eleves[0].classe.nom
                                            : ''}
                                    </Text>
                                </View>

                                {appointmentDetailsInRedux.meetingStatus === 'REPORT' && (
                                        <View style={{marginTop: 10}}>
                                            <Text style={globalStyles.titleH3}>
                                                {t('appointmentDetails.date_proposition')} :
                                            </Text>
                                            {/*PARENT PROPOSITION*/}
                                            <View style={{...styles.information, paddingTop: 5}}>
                                                <View style={styles.labelContainer}>
                                                    <Text style={styles.textGray}>
                                                        {t('appointmentDetails.parent')}
                                                    </Text>
                                                </View>
                                                <View style={styles.textContainer}>
                                                    {dateParent !== null && (
                                                        <Text
                                                            style={{
                                                                textTransform: 'capitalize',
                                                                ...styles.textGray,
                                                            } as StyleSheet}>
                                                            {i18n.language == 'en'
                                                                ? `${format(dateParent, 'EEE', {
                                                                    locale: enUS,
                                                                })} ${format(dateParent, 'MMMM', {
                                                                    locale: enUS,
                                                                })} ${String(dateParent.getDate()).padStart(
                                                                    2,
                                                                    '0',
                                                                )}, ${format(dateParent, 'yyyy', {
                                                                    locale: enUS,
                                                                })}`
                                                                : `${format(dateParent, 'EEE', {
                                                                    locale: fr,
                                                                })} ${String(dateParent.getDate()).padStart(
                                                                    2,
                                                                    '0',
                                                                )} ${format(dateParent, 'MMMM', {
                                                                    locale: fr,
                                                                })} ${format(dateParent, 'yyyy', {
                                                                    locale: fr,
                                                                })}`}
                                                        </Text>
                                                    )}

                                                    {timeParent !== null && (
                                                        <Text style={styles.textGray}>{timeParent}</Text>
                                                    )}
                                                </View>
                                            </View>

                                            {/*TEACHER PROPOSITION*/}
                                            <View style={{...styles.information, paddingTop: 5}}>
                                                <View style={styles.labelContainer}>
                                                    <Text style={styles.textGray}>
                                                        {t('appointmentDetails.teacher')}
                                                    </Text>
                                                </View>
                                                <View style={styles.textContainer}>
                                                    {dateEmployee !== null && (
                                                        <Text
                                                            style={{
                                                                textTransform: 'capitalize',
                                                                ...styles.textGray,
                                                            } as StyleSheet}>

                                                            {i18n.language == 'en'
                                                                ? `${format(dateEmployee, 'EEE', {
                                                                    locale: enUS,
                                                                })} ${format(dateEmployee, 'MMMM', {
                                                                    locale: enUS,
                                                                })} ${String(dateEmployee.getDate()).padStart(
                                                                    2,
                                                                    '0',
                                                                )}, ${format(dateEmployee, 'yyyy', {
                                                                    locale: enUS,
                                                                })}`
                                                                : `${format(dateEmployee, 'EEE', {
                                                                    locale: fr,
                                                                })} ${String(dateEmployee.getDate()).padStart(
                                                                    2,
                                                                    '0',
                                                                )} ${format(dateEmployee, 'MMMM', {
                                                                    locale: fr,
                                                                })} ${format(dateEmployee, 'yyyy', {
                                                                    locale: fr,
                                                                })}`}
                                                        </Text>
                                                    )}

                                                    {timeEmployee !== null && (
                                                        <Text style={styles.textGray}>{timeEmployee}</Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    )}
                            </View>
                        </View>


                        {appointmentDetailsInRedux.meetingType === 'NORMAL' && (
                            <ButtonActionStatus
                                data={appointmentDetailsInRedux}
                                snackbarShowMessage={snackbarShowMessage}
                                setAppointmentDetails={setAppointmentDetails}
                                parentId={parentId}
                                userId={userId}
                                //navigation={navigation}
                                //location={location}
                            />
                        )}

                        {appointmentDetailsInRedux.meetingType === 'PRESET' && deadlinePresetMeeting && (
                            <View style={styles.containerCreneauxRdv}>
                                <FlatButton
                                    title={t('allAppointment.edit_change_time_slot_preset')}
                                    fontWeight="500"
                                    fontSize={16}
                                    backgroundColor={COLORS.secondary}
                                    paddingVertical={12}
                                    borderRadius={5}
                                    onPress={() => {
                                        router.push('');
                                        // /*navigation.navigate(ROUTES.PRESET_APPOINTMENT_DETAILS, {
                                        //     data: data,
                                        // })*/
                                    }}
                                    disabled={false}
                                />
                            </View>
                        )}

                        {appointmentDetailsInRedux.meetingType === 'PRESET' && !deadlinePresetMeeting && (
                            <View style={styles.containerCreneauxRdv}>
                                <Text style={{textAlign: 'justify'} as StyleSheet}>
                                    {t('presetAppointment.no_action_available')}
                                </Text>
                            </View>
                        )}

                    </View>
                )}
            </ScrollView>
        </ViewThemed>
    );
};

export default withSnackbar(AppointmentDetails);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: 15,
        paddingBottom: 20,
    },
    detailsContanier: {
        paddingLeft: 15,
        paddingRight: 15,
    },
    appointmentDetails: {
        flexDirection: 'row',
        marginTop: 20,
    },
    appointmentImage: {
        flex: 1,
        alignItems: 'center',
    },
    appointImageCover: {
        width: 65,
        height: 65,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    appointmentInfoContainer: {
        flex: 4,
        paddingLeft: 7,
    },
    validateStatus: {
        color: COLORS.greenTextSuccess,
        backgroundColor: COLORS.greenExtraLight,
    },
    pendingStatus: {
        color: COLORS.orangeTextSuccess,
        backgroundColor: COLORS.orangeExtraLight,
    },
    cancelStatus: {
        color: COLORS.white,
        backgroundColor: COLORS.redIms,
    },
    titleDetail: {
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 10,
    },
    information: {
        flexDirection: 'row',
        padding: 0,
        margin: 0,
        marginBottom: 4,
    },
    labelContainer: {
        flex: 2,
    },
    textContainer: {
        flex: 3,
    },
    textGray: {
        color: COLORS.gray,
    },
    buttomContainer: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 5,
        alignItems: 'center',
    },
    buttom: {
        flex: 1,
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttomTextLeft: {
        color: COLORS.gray,
        fontWeight: '400',
    },
    buttomTextRight: {
        color: COLORS.white,
        fontWeight: '400',
    },
    cancelButtom: {
        backgroundColor: COLORS.grayVeryLight,
    },
    normalLeftButtom: {
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayLight,
        borderWidth: 1,
    },
    normalRightButtom: {
        backgroundColor: COLORS.primary,
    },
    buttomCancelText: {
        color: COLORS.grayLight,
        fontWeight: '400',
    },
    backgroundImage: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    floatinBtn: {
        width: 50,
        height: 50,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        bottom: 5,
        right: 1,
        elevation: 2,
        backgroundColor: COLORS.secondary,
    },
    searchContainer: {
        padding: 10,
    },
    searchBar: {
        flexDirection: 'row',
        marginTop: 10,
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: COLORS.grayVeryLight,
        borderRadius: 6,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 3,
        fontSize: 16,
        borderRadius: 0,
        color: COLORS.gray,
        marginLeft: 4,
    },
    listContainer: {
        flex: 1,
        padding: 10,
        paddingTop: 15,
    },
    modalContainer: {
        flex: 1,
        padding: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
    },
    modalTitle: {
        flex: 1,
        alignItems: 'center',
    },
    modalTitleText: {
        fontSize: 18,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.secondary,
    },
    modalContent: {
        flex: 1,
        paddingTop: 20,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 10,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
        color: COLORS.grayLight,
    },
    inputField: {
        marginBottom: 15,
    },
    modalInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.grayLight,
        paddingLeft: 2,
        paddingBottom: 5,
    },

    dropdown3BtnStyle: {
        width: '100%',
        backgroundColor: COLORS.white,
        paddingHorizontal: 0,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: COLORS.grayMedium,
    },
    dropdown3BtnChildStyle: {
        flex: 1,
        flexDirection: 'row',
        //justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    dropdown3BtnImage: {
        width: 35,
        height: 35,
        resizeMode: 'cover',
        borderRadius: 35,
    },
    dropdown3BtnTxt: {
        flex: 1,
        color: COLORS.gray,
        textAlign: 'left',
        fontSize: 16,
        marginHorizontal: 12,
    },
    dropdown3DropdownStyle: {
        backgroundColor: COLORS.white,
    },
    dropdown3RowStyle: {
        borderColor: COLORS.grayVeryLight,
        borderBottomColor: COLORS.grayVeryLight,
        //height: 50,
    },
    dropdown3RowChildStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    dropdownRowImage: {
        width: 35,
        height: 35,
        resizeMode: 'cover',
        borderRadius: 35,
    },
    dropdown3RowTxt: {
        color: COLORS.gray,
        textAlign: 'center',
        fontSize: 16,
        marginHorizontal: 12,
    },
    containerCreneauxRdv: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 15,
    },
    deleteAppointment: {
        backgroundColor: COLORS.red,
        color: COLORS.white,
        fontSize: 11,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius:5
    }
});
