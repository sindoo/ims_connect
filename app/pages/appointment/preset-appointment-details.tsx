import {JSX, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS, ROUTES, TIME_ZONE_ABIDJAN} from '../../../constants';
import {globalStyles} from '../../../style/Global';
import {useTranslation} from 'react-i18next';
import {format} from 'date-fns';
import {fr, enUS} from 'date-fns/locale';
import {useDispatch, useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';
import {request} from '../../../api/ApiManager';
import {toZonedTime} from "date-fns-tz";
import {
    setAllAppointmentList,
    setPresetAppointmentList,
    updatePresetAppoint
} from "../../../redux/features/appointment/appointmentSlice";
import AppointmentService from "../../../services/AppointmentService";
import {withSnackbar} from "../../../components/ui/SnackbarHOC";
import SelectFieldAppointment from "../../../components/ui/SelectFieldAppointment";
import {useLocalSearchParams} from "expo-router";
import ViewThemed from "../../../components/ui/ViewThemed";

function PresetAppointmentDetails({
                                      navigation,
                                      route,
                                      snackbarShowMessage,
                                  }: {
    navigation: any;
    route: any;
    snackbarShowMessage: any;
}) {
    const {t, i18n} = useTranslation();
    //const {data} = route.params;
    const { location} = useLocalSearchParams();
    const {appointmentDetailsInRedux} = useSelector((state: any) => state.appointment);
    const language = i18n.language;
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user} = useSelector((state: any) => state.user);
    const [creneauxRdvList, setCreneauxRdvList] = useState([]);
    const [creneauSelected, setCreneauSelected] = useState<any>(null);
    const [creneauChoiceDone, setCreneauChoiceDone] = useState<any>([]);
    const [cancelButtom, setCancelButtom] = useState(true);
    const [saveEditButtom, setSaveEditButtom] = useState(false);
    const [statusButtonSubmit, setStatusButtonSubmit] = useState(false);
    const [statusButtonCancel, setStatusButtonCancel] = useState(false);
    const dispatch = useDispatch();
    const [deadlineMeeting, setDeadlineMeeting] = useState(false);
    const [creneauRdvChoiceSelect, setCreneauRdvChoiceSelect] = useState<any>(undefined);

    const handleUserSelectChange = (item: any, index: number) => {
        setCreneauSelected(item);
    };

    const handleCreneauSelectionSubmit = () => {
        if (creneauSelected !== null && selectedChild !== null) {
            const dataToSend = {
                ...creneauSelected,
                id: creneauSelected?.id,
                rdvId: creneauSelected?.rdvId,
                dateDebut: creneauSelected?.dateDebut,
                dateFin: creneauSelected?.dateFin,
                totalInviterConfirm: creneauSelected?.totalInviterConfirm,
                meetingStatus: creneauSelected?.meetingStatus,
                creneauRdvEmployees: creneauSelected?.creneauRdvEmployees,
                creneauRdvEnfantParents: [
                    {
                        ...creneauSelected?.creneauRdvEnfantParents[0],
                        id: creneauSelected?.creneauRdvEnfantParents[0]?.id,
                        meetingStatus: 'CONFIRM',
                        creneauRdvId: creneauSelected?.id,
                        enfantId: selectedChild?.person?.id,
                        parentId: user?.userDetails?.personDetails?.person?.id,
                        dateDebut: creneauSelected?.dateDebut,
                        dateFin: creneauSelected?.dateFin,
                        common: creneauSelected?.creneauRdvEnfantParents[0]?.common,
                        commentaire:
                        creneauSelected?.creneauRdvEnfantParents[0]?.commentaire,
                    },
                ],
                parentNbrAction: creneauSelected?.parentNbrAction,
                employeeNbrAction: creneauSelected?.employeeNbrAction,
                lastReportDateDebut: creneauSelected?.lastReportDateDebut,
                lastReportDateFin: creneauSelected?.lastReportDateFin,
                lastReportUserId: creneauSelected?.lastReportUserId,
                common: creneauSelected?.common,
            };

            setStatusButtonSubmit(true);
            request(
                'PUT',
                '',
                `/extra/creneaurdv/presets/parent/choices/${selectedChild?.person?.id}`,
                dataToSend,
            )
                .then(async response => {
                    setCreneauSelected(response.data);

                    dispatch(
                        updatePresetAppoint({
                            rdvId: appointmentDetailsInRedux?.id,
                            creneauRdvData: response?.data,
                        }),
                    );

                    const allRdvListSort = await AppointmentService.getAllAppointment(selectedChild?.person.id);
                    dispatch(setAllAppointmentList(allRdvListSort));
                    const presetAppointmentChild = await AppointmentService.getAllPresetAppointment(selectedChild);
                    dispatch(setPresetAppointmentList(presetAppointmentChild));

                    setStatusButtonSubmit(false);
                    navigation.navigate(ROUTES.APPOINTMENT, {screen: ROUTES.ALL_APPOINTMENT});
                    snackbarShowMessage(t('snackBar.sb_succes_save'));
                })
                .catch(error => {
                    // Error message
                    console.log(error);
                    setStatusButtonSubmit(false);
                    snackbarShowMessage(t('snackBar.sb_error'));
                });
        }
    };

    const handleCancelCreneauChoiceDone = () => {
        if (creneauChoiceDone !== null && selectedChild !== null) {
            if(creneauChoiceDone?.creneauRdvEnfantParents[0]?.parentId === user.userDetails.personDetails?.person?.id) {
                const dataToSend = {
                    ...creneauChoiceDone,
                    id: creneauChoiceDone?.id,
                    rdvId: creneauChoiceDone?.rdvId,
                    dateDebut: creneauChoiceDone?.dateDebut,
                    dateFin: creneauChoiceDone?.dateFin,
                    totalInviterConfirm: creneauChoiceDone?.totalInviterConfirm,
                    meetingStatus: creneauChoiceDone?.meetingStatus,
                    creneauRdvEmployees: creneauChoiceDone?.creneauRdvEmployees,
                    creneauRdvEnfantParents: [
                        {
                            ...creneauChoiceDone?.creneauRdvEnfantParents[0],
                            id: creneauChoiceDone?.creneauRdvEnfantParents[0]?.id,
                            meetingStatus: 'CANCEL',
                            creneauRdvId:
                            creneauChoiceDone?.creneauRdvEnfantParents[0]?.creneauRdvId,
                            enfantId: selectedChild?.person?.id,
                            parentId: user.userDetails.personDetails?.person?.id,
                            dateDebut: creneauChoiceDone?.creneauRdvEnfantParents[0]?.dateDebut,
                            dateFin: creneauChoiceDone?.creneauRdvEnfantParents[0]?.dateFin,
                            common: creneauChoiceDone?.creneauRdvEnfantParents[0]?.common,
                            commentaire:
                            creneauChoiceDone?.creneauRdvEnfantParents[0]?.commentaire,
                        },
                    ],
                    parentNbrAction: creneauChoiceDone?.parentNbrAction,
                    employeeNbrAction: creneauChoiceDone?.employeeNbrAction,
                    lastReportDateDebut: creneauChoiceDone?.lastReportDateDebut,
                    lastReportDateFin: creneauChoiceDone?.lastReportDateFin,
                    lastReportUserId: creneauChoiceDone?.lastReportUserId,
                    common: creneauChoiceDone?.common,
                };

                setStatusButtonCancel(true);
                request(
                    'PUT',
                    '',
                    `/extra/creneaurdv/presets/parent/choices/${selectedChild.person.id}`,
                    dataToSend,
                )
                    .then(async response => {
                        dispatch(
                            updatePresetAppoint({
                                rdvId: appointmentDetailsInRedux.id,
                                creneauRdvData: response.data,
                            }),
                        );

                        const allRdvListSort = await AppointmentService.getAllAppointment(selectedChild?.person.id);
                        dispatch(setAllAppointmentList(allRdvListSort));
                        const presetAppointmentChild = await AppointmentService.getAllPresetAppointment(selectedChild);
                        dispatch(setPresetAppointmentList(presetAppointmentChild));

                        setStatusButtonCancel(false);
                        //navigation.navigate('Appointment');
                        navigation.navigate(ROUTES.APPOINTMENT);
                    })
                    .catch(error => {
                        // Error message
                        //const result = JSON.parse(error.config.data);
                        console.log(error);
                        setStatusButtonCancel(false);
                        snackbarShowMessage(t('snackBar.sb_error'));
                    });
            }
            else {
                snackbarShowMessage(t('allAppointment.cannot_edit_preset_appointment'));
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                let creneauRdvRequest: any = [...appointmentDetailsInRedux?.creneauRdvs];
                if (creneauRdvRequest.length > 0) {
                    creneauRdvRequest = creneauRdvRequest.sort(function (a: any, b: any) {
                        return a.dateDebut - b.dateDebut;
                    });

                    const creneauRdvListRequest = creneauRdvRequest.map((creneau: any, index: number) => {
                            const creneauRdvEnfantParents = creneau.creneauRdvEnfantParents;
                            if (creneauRdvEnfantParents.length > 0) {
                                if (creneauRdvEnfantParents[0].enfantId === selectedChild.person.id ) {
                                    //&& creneauRdvEnfantParents[0].parentId === user.userDetails.personDetails.person.id
                                    setCancelButtom(true);
                                    setSaveEditButtom(false);
                                    if (creneauRdvEnfantParents[0].meetingStatus === 'CONFIRM') {
                                        setCancelButtom(false);
                                        setSaveEditButtom(true);
                                    }
                                    setCreneauChoiceDone(creneau);
                                }
                            }

                            let creneauRdvData: any = {};
                            const creneauDebut = toZonedTime(creneau.dateDebut, TIME_ZONE_ABIDJAN);
                            const creneauFin = toZonedTime(creneau.dateFin, TIME_ZONE_ABIDJAN);

                            const dateRdvCreneau = format(creneauDebut, 'dd MMMM yyyy', {locale: language === 'en' ? enUS : fr,});

                            const startTime = format(creneauDebut, 'p', {locale: language === 'en' ? enUS : fr,});

                            const endTime = format(creneauFin, 'p', {locale: language === 'en' ? enUS : fr,});
                            creneauRdvData = {
                                dateAppointmentSlot: dateRdvCreneau,
                                startTimeSlot: startTime,
                                endTimeSlot: endTime,
                                ...creneau,
                            };

                            return creneauRdvData;
                        },
                    );

                    /*let creneauRdvChoiceFind = creneauRdvListRequest.find(
                        (crenau: any) => crenau?.creneauRdvEnfantParents[0]?.enfantId === selectedChild?.person?.id && crenau?.creneauRdvEnfantParents[0]?.parentId === user?.userDetails?.personDetails?.person?.id,
                    );*/
                    let creneauRdvChoiceFind = creneauRdvListRequest.find(
                        (crenau: any) => crenau?.creneauRdvEnfantParents[0]?.enfantId === selectedChild?.person?.id
                    );

                    if(creneauRdvChoiceFind !== undefined) {
                        setCreneauRdvChoiceSelect(creneauRdvChoiceFind);
                    }

                    let creneauRdvAvailable: any = [];
                    creneauRdvAvailable = creneauRdvListRequest.filter(
                        (creneau: any) => creneau.meetingStatus === 'WAIT',
                    );
                    setCreneauxRdvList(creneauRdvAvailable);
                }

                // DEADLINE MEETING
                const dateDebutMeeting = appointmentDetailsInRedux?.dateDebut - appointmentDetailsInRedux?.deadlineUpdate;
                const today = new Date().setHours(23, 59, 59, 0);
                if (dateDebutMeeting > 0) {
                    if (today < dateDebutMeeting) {
                        setDeadlineMeeting(true);
                    } else {
                        setDeadlineMeeting(false);
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, [appointmentDetailsInRedux]);

    return (
        <View style={styles.container}>
            <View style={styles.detailsContanier}>
                <View>
                    <View style={styles.appointmentDetails}>
                        <View style={styles.appointmentInfoContainer}>
                            <View style={{flexDirection: 'row'} as StyleSheet}>
                                <View
                                    style={{
                                        ...((appointmentDetailsInRedux.meetingStatus === 'CONFIRM' &&
                                                styles.validateStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'WAIT' && styles.pendingStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'PARTIAL_CONFIRM' &&
                                                styles.pendingStatus) ||
                                            (appointmentDetailsInRedux.meetingStatus === 'CANCEL' && styles.cancelStatus)),
                                        marginRight: 10,
                                    }}
                                />
                                <Text style={{...globalStyles.titleH2, marginRight: 10}}>{appointmentDetailsInRedux.objet}</Text>
                            </View>

                            {appointmentDetailsInRedux.details !== '' && (
                                <Text style={{marginBottom: 5, color: COLORS.gray}}>
                                    {appointmentDetailsInRedux.details}
                                </Text>
                            ) as JSX.Element}

                            <View style={styles.information}>
                                <Text style={styles.labelContainer}>
                                    {t('presetAppointment.date_start')}
                                </Text>
                                <Text style={styles.textContainer}>
                                    {format(appointmentDetailsInRedux.dateDebut, 'dd MMMM yyyy', {locale: language === 'en' ? enUS : fr,})}
                                </Text>
                            </View>

                            <View style={styles.information}>
                                <Text style={styles.labelContainer}>
                                    {t('presetAppointment.date_end')}
                                </Text>
                                <Text style={styles.textContainer}>
                                    {format(appointmentDetailsInRedux.dateFin, 'dd MMMM yyyy', {locale: language === 'en' ? enUS : fr,})}
                                </Text>
                            </View>

                            <View style={styles.information}>
                                <Text style={styles.labelContainer}>
                                    {t('presetAppointment.child')}
                                </Text>
                                <Text style={styles.textContainer}>
                                    {selectedChild.person.prenom} {selectedChild.person.nom}
                                </Text>
                            </View>

                            <View style={styles.information}>
                                <Text style={styles.labelContainer}>
                                    {t('presetAppointment.classroom')}
                                </Text>
                                <Text style={styles.textContainer}>
                                    {selectedChild.eleves.length > 0
                                        ? selectedChild.eleves[0].classe.nom
                                        : ''}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{paddingLeft: 12}}>
                        {creneauRdvChoiceSelect !== undefined && (
                            <Text style={{color: COLORS.gray, marginTop: 5}}>
                                {' '}
                                {t('presetAppointment.choice_slot_done')} :{' '}
                                {creneauRdvChoiceSelect.dateAppointmentSlot} (
                                {creneauRdvChoiceSelect.startTimeSlot} -{' '}
                                {creneauRdvChoiceSelect.endTimeSlot})
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.creneauxRdv}>
                    <ScrollView style={styles.creneauxRdvScroll}>
                        {deadlineMeeting ? (
                            <View style={styles.containerCreneauxRdv}>
                                <Text style={{color: COLORS.gray, marginBottom: 5}}>
                                    {t('presetAppointment.time_availbale')}
                                </Text>
                                <SelectFieldAppointment
                                    data={creneauxRdvList}
                                    //defaultValue={creneauChoiceSelected}
                                    placeholder={t('presetAppointment.label_time_slot')}
                                    disabled={creneauxRdvList.length <= 0}
                                    onSelect={(item: any, index: number) =>
                                        handleUserSelectChange(item, index)
                                    }
                                />

                                <View style={{marginTop: 30, marginBottom: 10}}>
                                    <View style={styles.buttomContainer}>
                                        {/* LEFT BUTTON [CANCEL PRESET] */}
                                        <View style={{flex: 1, paddingRight: 10}}>
                                            {statusButtonCancel ? (
                                                <>
                                                    <TouchableOpacity
                                                        style={
                                                            {...styles.buttom, ...styles.cancelButtom}
                                                        }
                                                        disabled={cancelButtom || statusButtonCancel}
                                                        onPress={() => {}}>
                                                        <Text
                                                            style={
                                                                styles.buttomCancelText
                                                            }>
                                                            {/*{t('upcomingAppointment.cancel_btn')}*/}
                                                            <ActivityIndicator size='small' color={COLORS.white} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <TouchableOpacity
                                                        style={
                                                            cancelButtom ? {...styles.buttom, ...styles.buttonCancelDisable} : {...styles.buttom, ...styles.cancelButtom}
                                                        }
                                                        disabled={cancelButtom}
                                                        onPress={() => handleCancelCreneauChoiceDone()}>
                                                        <Text
                                                            style={
                                                                cancelButtom ? styles.buttonCancelDisableText : styles.buttomCancelText
                                                            }>
                                                            {t('upcomingAppointment.cancel_btn')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}

                                        </View>

                                        {/* RIGHT BUTTON [ SAVE PRESET ] */}
                                        <View style={{flex: 1, paddingLeft: 10}}>
                                            {statusButtonSubmit ? (
                                                <>
                                                    <TouchableOpacity
                                                        style={
                                                            saveEditButtom
                                                                ? {...styles.buttom, ...styles.buttonCancelDisable}
                                                                : {
                                                                    ...styles.buttom,
                                                                    backgroundColor: COLORS.secondary,
                                                                }
                                                        }
                                                        onPress={() => {}}
                                                        disabled={saveEditButtom || statusButtonSubmit}>
                                                        <Text
                                                            style={
                                                                saveEditButtom
                                                                    ? styles.buttonCancelDisableText
                                                                    : styles.buttomTextRight
                                                            }
                                                        >
                                                            <ActivityIndicator size='small' color={COLORS.white} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                <>
                                                    <TouchableOpacity
                                                        style={
                                                            saveEditButtom
                                                                ? {...styles.buttom, ...styles.buttonCancelDisable}
                                                                : {
                                                                    ...styles.buttom,
                                                                    backgroundColor: COLORS.secondary,
                                                                }
                                                        }
                                                        onPress={() => handleCreneauSelectionSubmit()}
                                                        disabled={saveEditButtom}>
                                                        <Text
                                                            style={
                                                                saveEditButtom
                                                                    ? styles.buttonCancelDisableText
                                                                    : styles.buttomTextRight
                                                            }>
                                                            {t('appointmentDetails.save_btn')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}

                                        </View>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.containerCreneauxRdv}>
                                <Text style={{textAlign: 'justify'}}>
                                    {t('presetAppointment.no_action_available')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

export default withSnackbar(PresetAppointmentDetails);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: 15,
        paddingBottom: 20,
    },
    detailsContanier: {
        flex: 1,
    },
    appointmentDetails: {
        flexDirection: 'row',
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
        paddingLeft: 15,
        paddingRight: 15,
    },
    creneauxRdv: {
        flex: 1,
        marginTop: 20,
    },
    creneauxRdvScroll: {
        flex: 1,
    },
    containerCreneauxRdv: {
        paddingLeft: 15,
        paddingRight: 15,
    },
    validateStatus: {
        width: 13,
        height: 13,
        borderRadius: 10,
        marginTop: 5,
        backgroundColor: COLORS.greenLight,
    },
    pendingStatus: {
        width: 13,
        height: 13,
        borderRadius: 10,
        marginTop: 5,
        backgroundColor: COLORS.orange,
    },
    cancelStatus: {
        width: 13,
        height: 13,
        borderRadius: 10,
        marginTop: 5,
        backgroundColor: COLORS.red,
    },
    titleDetail: {
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: 10,
        textAlign: 'left',
    },
    information: {
        flexDirection: 'row',
        padding: 0,
        margin: 0,
        marginBottom: 4,
    },
    labelContainer: {
        flex: 1,
        color: COLORS.gray,
    },
    textContainer: {
        flex: 2,
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
    appointmentDate: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        height: 75,
        width: 40,
        backgroundColor: COLORS.blueLight,
    },
    cancelButtom: {
        backgroundColor: COLORS.redIms,
        borderColor: COLORS.redIms,
        borderWidth: 1,
    },
    buttomCancelText: {
        color: COLORS.white,
        fontWeight: '400',
    },
    buttonCancelDisable: {
        backgroundColor: COLORS.grayVeryLight,
    },
    buttonCancelDisableText: {
        color: COLORS.grayLight,
    },
    normalLeftButtom: {
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayLight,
        borderWidth: 1,
    },
    normalRightButtom: {
        backgroundColor: COLORS.primary,
    },
});
