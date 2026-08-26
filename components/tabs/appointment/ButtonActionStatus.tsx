import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView, Pressable, TextInput, ActivityIndicator
} from "react-native";
import * as yup from 'yup';
import {useTranslation} from "react-i18next";
import {JSX, useEffect, useState} from "react";
import {COLORS, IMAGES, TIME_ZONE_ABIDJAN} from "../../../constants";
import {useDispatch, useSelector} from "react-redux";
import {request} from "../../../api/ApiManager";
import {updateAppointment} from "../../../redux/features/appointment/appointmentSlice";
import {useRouter} from "expo-router";
import {format, getHours, getMinutes, getTime, set, toDate} from "date-fns";
import {fromZonedTime, toZonedTime} from "date-fns-tz";
import AppointmentService from "../../../services/AppointmentService";
import {globalStyles} from "../../../style/Global";
import DatesReservedModal from "./DatesReservedModal";
import {MaterialIcons} from "@expo/vector-icons";
import {Formik} from "formik";
import {enUS, fr} from "date-fns/locale";
import FlatButton from "../../ui/FlatButton";
import DatePicker from "react-native-date-picker";
import DropDownPicker from "react-native-dropdown-picker";
import {BASEURL_IMG} from "../../../api/appUrl";
import SelectDropdown from "react-native-select-dropdown";
import {Image} from "expo-image";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";


const newAppointmentFormSchema = yup.object({
    appointmentTitle: yup.string().required().min(3),
    appointmentDescription: yup.string(),
});

const dataStartTime = [
    {label: '15:30', value: 1},
    {label: '15:50', value: 2},
    {label: '16:10', value: 3},
];
const dayListOff = ['saturday', 'sunday'];

function ButtonActionStatus(props: any) {
    const {
        data,
        snackbarShowMessage,
        setAppointmentDetails,
        parentId,
        userId,
        navigation,
        location,
    } = props;

    const {t, i18n} = useTranslation();
    const [editModal, setEditModal] = useState(false);
    const [teacherDest, setTeacherDest] = useState<any>(null);
    const {selectedChild} = useSelector((state: any) => state.child);
    const selectedChildClass = selectedChild?.eleves[0]?.classe;
    const {teacherSelected, employeesClassList} = useSelector(
        (state: any) => state.employee,
    );
    const {user} = useSelector((state: any) => state.user);

    const [errorMsgToday, setErrorMsgToday] = useState('');
    const [errorMsgTeacher, setErrorMsgTeacher] = useState('');
    const [errorMsgStartTime, setErrorMsgStartTime] = useState('');
    const newDate = new Date();
    const [date, setDate] = useState(newDate);
    const [startTime, setStartTime] = useState(newDate);
    const [openStartTime, setStartTimeOpen] = useState(false);
    const [endTime, setEndTime] = useState(startTime);
    const [openEndTime, setEndTimeOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [bntActionStatus, setBntActionStatus] = useState('');
    const today = newDate;
    const dispatch = useDispatch();
    const status = data.meetingStatus;
    const [buttonStatus, setButtonStatus] = useState(false);
    const [loading, setLoading] = useState(false);

    // DEADLINE MEETING
    const deadline = data.dateDebut - data.deadlineUpdate;
    const todayDeadline = newDate.setHours(23, 59, 59, 0);
    const statusDealine = deadline > todayDeadline;

    const [openStartTimeHour, setOpenStartTimeHour] = useState(false);
    const [startTimeValue, setStartTimeValue] = useState<any>(null);
    const [startTimeData, setStartTimeData] = useState<any>(dataStartTime);
    const [openDates, setOpenDates] = useState(false);
    const [openDatesData, setOpenDatesData] = useState<any>([]);
    const router = useRouter();

    const handleOpenDatesData = async () => {
        setOpenDates(true);
    }

    const handleTeacherSelectChange = (item: any, index: number) => {
        setTeacherDest(item);
        setErrorMsgTeacher('');
    };

    const handleConfirmAppointment = () => {
        setLoading(true);
        const dataToSend = {
            id: data.id,
            meetingType: data.meetingType,
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            objet: data.objet,
            details: data.details,
            classeId: data.classeId,
            maxInviter: data.maxInviter,
            dureeMeeting: data.dureeMeeting,
            deadlineUpdate: data.deadlineUpdate,
            meetingStatus: data.meetingStatus,
            totalCreneau: data.totalCreneau,
            maxEnfantChoice: data.maxEnfantChoice,
            userInitor: data.userInitor,
            creneauRdvs: [
                {
                    id: data.creneauRdvs[0].id,
                    rdvId: data.creneauRdvs[0].rdvId,
                    dateDebut: data.creneauRdvs[0].dateDebut,
                    dateFin: data.creneauRdvs[0].dateFin,
                    totalInviterConfirm: data.creneauRdvs[0].totalInviterConfirm,
                    meetingStatus: data.creneauRdvs[0].meetingStatus,
                    creneauRdvEnfantParents: [
                        {
                            ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                            id: data.creneauRdvs[0].creneauRdvEnfantParents[0].id,
                            meetingStatus: 'CONFIRM',
                            creneauRdvId: data.creneauRdvs[0].creneauRdvEnfantParents[0].creneauRdvId,
                            enfantId: data.creneauRdvs[0].creneauRdvEnfantParents[0].enfantId,
                            parentId: parentId,
                            dateDebut: data.creneauRdvs[0].creneauRdvEmployees[0].dateDebut,
                            dateFin: data.creneauRdvs[0].creneauRdvEmployees[0].dateFin,
                            commentaire: data.creneauRdvs[0].creneauRdvEnfantParents[0].commentaire,
                        },
                    ],
                    creneauRdvEmployees: data.creneauRdvs[0].creneauRdvEmployees,
                    parentNbrAction: data.creneauRdvs[0].parentNbrAction,
                    employeeNbrAction: data.creneauRdvs[0].employeeNbrAction,
                    common: data.creneauRdvs[0].common,
                    libelle: data.creneauRdvs[0].libelle,
                    compositeId: data.creneauRdvs[0].compositeId,
                    _links: data.creneauRdvs[0]._links,
                },
            ],
            common: data.common,
        };

        const dateDebutMeeting = data.dateDebut - data.deadlineUpdate;
        const today = new Date().setHours(23, 59, 59, 0);

        if (dateDebutMeeting > 0 && (today < dateDebutMeeting)) {
            if(data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === user.userDetails.personDetails?.person?.id || data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === null) {
                request('PUT', '', `/extra/rdv/${data.id}`, dataToSend)
                    .then(response => {
                        dispatch(updateAppointment(response.data));
                        setAppointmentDetails(response.data);
                        setLoading(false);
                        setEditModal(false);
                        if(location === 'home') {
                            //navigation.navigate(ROUTES.HOME_TAB);
                            router.push('/(tabs)');
                        } else {
                            //navigation.navigate(ROUTES.APPOINTMENT, {screen: ROUTES.ALL_APPOINTMENT});
                            router.push('/(tabs)/appointment/all-appointment');
                        }
                    })
                    .catch(error => {
                        setLoading(false);
                        setEditModal(false);
                        if (error.response) {
                            const msgToDisplay = error.response.data;
                            if(msgToDisplay?.codeMessage === 'RDV_DATE_NOT_FREE') {
                                snackbarShowMessage(t('allAppointment.rdv_date_not_free'));
                            }
                            console.log(msgToDisplay);
                        }
                        else {
                            snackbarShowMessage(t('snackBar.sb_error'));
                        }
                        console.log(error.config);
                    });
            }
            else {
                setLoading(false);
                snackbarShowMessage(t('allAppointment.cannot_edit_preset_appointment'));
            }
        }
        else {
            setLoading(false);
            setEditModal(false);
            snackbarShowMessage(t('snackBar.sb_error_deadline_exceeded'));
        }
    };

    const handleEditAppointment = () => {
        try {
            setEditModal(true);
            const employeesFind: any = employeesClassList.find(
                (employee: any) =>
                    employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId,
            );
            setTeacherDest(employeesFind !== undefined ? employeesFind : null);

            if (data.meetingStatus === 'REPORT') {
                let dateEditDebut: any = toDate(data.creneauRdvs[0].lastReportDateDebut);
                dateEditDebut = toZonedTime(dateEditDebut, TIME_ZONE_ABIDJAN);

                const appointmentStartTime: string = getHours(dateEditDebut) + ':' + getMinutes(dateEditDebut);
                const hourFind: any = dataStartTime.find(
                    (hour: any) => hour.label === appointmentStartTime,
                );
                setStartTimeValue(hourFind?.value);

                let dateEditFin: any = toDate(data.creneauRdvs[0].lastReportDateFin);
                dateEditFin = toZonedTime(dateEditFin, TIME_ZONE_ABIDJAN);

                setDate(dateEditDebut);
                setStartTime(dateEditDebut);
                setEndTime(dateEditFin);
            }
            else {
                const appointmentStartTime: string =
                    getHours(startTime) + ':' + getMinutes(startTime);

                const hourFind: any = dataStartTime.find(
                    (hour: any) => hour.label === appointmentStartTime,
                );
                if(hourFind !== undefined){
                    setStartTimeValue(hourFind?.value);
                    const startHourTab = hourFind?.label.split(':');

                    const timeStart = set(date, {
                        hours: parseInt(startHourTab[0]),
                        minutes: parseInt(startHourTab[1]),
                        seconds: 0,
                    });
                    setStartTime(timeStart);

                    const timeEnd = set(date, {
                        hours: parseInt(startHourTab[0]),
                        minutes: parseInt(startHourTab[1]) + 20,
                        seconds: 0,
                    });
                    setEndTime(timeEnd);
                }
                else {
                    setStartTimeValue(dataStartTime[0].value);
                    const startHourTab = dataStartTime[0].label.split(':');

                    const timeStart = set(date, {
                        hours: parseInt(startHourTab[0]),
                        minutes: parseInt(startHourTab[1]),
                        seconds: 0,
                    });
                    setStartTime(timeStart);

                    const timeEnd = set(date, {
                        hours: parseInt(startHourTab[0]),
                        minutes: parseInt(startHourTab[1]) + 20,
                        seconds: 0,
                    });
                    setEndTime(timeEnd);
                }
            }

            setBntActionStatus('EDIT');
        } catch (error) {
            console.log(error);
        }
    };

    const handleRescheduleAppointment = () => {
        try {
            setEditModal(true);
            const employeesFind: any = employeesClassList.find(
                (employee: any) =>
                    employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId,
            );
            setTeacherDest(employeesFind !== undefined ? employeesFind : null);
            setBntActionStatus('CONFIRM');

            let dateEditDebut: any = toDate(data.creneauRdvs[0].dateDebut);
            dateEditDebut = toZonedTime(dateEditDebut, TIME_ZONE_ABIDJAN);

            const appointmentStartTime: string = getHours(dateEditDebut) + ':' + getMinutes(dateEditDebut);
            const hourFind: any = dataStartTime.find(
                (hour: any) => hour.label === appointmentStartTime,
            );
            setStartTimeValue(hourFind?.value);

            let dateEditFin: any = toDate(data.creneauRdvs[0].dateFin);
            dateEditFin = toZonedTime(dateEditFin, TIME_ZONE_ABIDJAN);
            setDate(dateEditDebut);
            setStartTime(dateEditDebut);
            setEndTime(dateEditFin);
            //console.log('Reprogrammer');
        } catch (error) {
            console.log(error);
        }
    };

    const handleCancelAppointment = () => {
        setLoading(true);
        const dataToSend = {
            id: data.id,
            meetingType: data.meetingType,
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            objet: data.objet,
            details: data.details,
            classeId: data.classeId,
            maxInviter: data.maxInviter,
            dureeMeeting: data.dureeMeeting,
            deadlineUpdate: data.deadlineUpdate,
            meetingStatus: data.meetingStatus,
            totalCreneau: data.totalCreneau,
            maxEnfantChoice: data.maxEnfantChoice,
            userInitor: data.userInitor,
            creneauRdvs: [
                {
                    id: data.creneauRdvs[0].id,
                    rdvId: data.creneauRdvs[0].rdvId,
                    dateDebut: data.creneauRdvs[0].dateDebut,
                    dateFin: data.creneauRdvs[0].dateFin,
                    totalInviterConfirm: data.creneauRdvs[0].totalInviterConfirm,
                    meetingStatus: data.creneauRdvs[0].meetingStatus,
                    creneauRdvEnfantParents: [
                        {
                            ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                            id: data.creneauRdvs[0].creneauRdvEnfantParents[0].id,
                            meetingStatus: 'CANCEL',
                            creneauRdvId:
                            data.creneauRdvs[0].creneauRdvEnfantParents[0].creneauRdvId,
                            enfantId: data.creneauRdvs[0].creneauRdvEnfantParents[0].enfantId,
                            parentId: parentId,
                            dateDebut:
                            data.creneauRdvs[0].creneauRdvEnfantParents[0].dateDebut,
                            dateFin: data.creneauRdvs[0].creneauRdvEnfantParents[0].dateFin,
                            commentaire:
                            data.creneauRdvs[0].creneauRdvEnfantParents[0].commentaire,
                        },
                    ],
                    creneauRdvEmployees: data.creneauRdvs[0].creneauRdvEmployees,
                    parentNbrAction: data.creneauRdvs[0].parentNbrAction,
                    employeeNbrAction: data.creneauRdvs[0].employeeNbrAction,
                    common: data.creneauRdvs[0].common,
                    libelle: data.creneauRdvs[0].libelle,
                    compositeId: data.creneauRdvs[0].compositeId,
                    _links: data.creneauRdvs[0]._links,
                },
            ],
            common: data.common,
        };

        const dateDebutMeeting = data.dateDebut - data.deadlineUpdate;
        const today = new Date().setHours(23, 59, 59, 0);
        if (dateDebutMeeting > 0 && (today < dateDebutMeeting)) {
            if(data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === user.userDetails.personDetails?.person?.id || data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === null) {
                request('PUT', '', `/extra/rdv/${data.id}`, dataToSend)
                    .then(response => {
                        dispatch(updateAppointment(response.data));
                        setAppointmentDetails(response.data);
                        setLoading(false);
                        setEditModal(false);
                        //snackbarShowMessage(t('snackBar.sb_succes_save'));
                        //navigation.navigate(ROUTES.ALL_APPOINTMENT);
                        if(location === 'home') {
                            //navigation.navigate(ROUTES.HOME_TAB);
                            router.push('/(tabs)');
                        }
                        else {
                            //navigation.navigate(ROUTES.APPOINTMENT, {screen: ROUTES.ALL_APPOINTMENT});
                            router.push('/(tabs)/appointment/all-appointment')
                        }
                    })
                    .catch(error => {
                        setLoading(false);
                        setEditModal(false);
                        //console.log(error);
                        if (error.response) {
                            const msgToDisplay = error.response.data;
                            if(msgToDisplay?.codeMessage === 'RDV_DATE_NOT_FREE') {
                                snackbarShowMessage(t('allAppointment.rdv_date_not_free'));
                            }
                            console.log(msgToDisplay);
                        }
                        else {
                            snackbarShowMessage(t('snackBar.sb_error'));
                        }
                        console.log(error.config);
                    });
            }
            else {
                setLoading(false);
                snackbarShowMessage(t('allAppointment.cannot_edit_preset_appointment'));
            }

        }
        else {
            setLoading(false);
            setEditModal(false);
            snackbarShowMessage(t('snackBar.sb_error_deadline_exceeded'));
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            let dateDebut = toDate(data?.dateDebut);
            let dateFin = toDate(data?.dateFin);

            dateDebut = toZonedTime(dateDebut, TIME_ZONE_ABIDJAN);
            dateFin = toZonedTime(dateFin, TIME_ZONE_ABIDJAN);

            const employeesFind: any = employeesClassList.find(
                (employee: any) =>
                    employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId,
            );
            setTeacherDest(employeesFind !== undefined ? employeesFind : null);
            setDate(dateDebut);
            setStartTime(dateDebut);
            setEndTime(dateFin);
            const openDatesDataList =  await AppointmentService.getAppointmentByDate(selectedChild);
            setOpenDatesData(openDatesDataList);
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, [data]);

    return (
        <View style={{marginTop: 30, marginBottom: 10}}>
            <View style={styles.buttomContainer}>
                {/* LET BUTTON [EDIT - CANCEL ] */}
                <View style={{flex: 1, paddingRight: 10}}>
                    <TouchableOpacity
                        style={
                            ((status === 'WAIT' ||
                                status === 'REPORT' ||
                                status === 'PARTIAL_CONFIRM' ||
                                status === 'NOT_HELD') && {
                                ...styles.buttom,
                                ...styles.normalLeftButtom,
                                padding: 8,
                            }) ||
                            ((status === 'CONFIRM' || status === 'NOT_RESPECTED') &&
                                statusDealine && {
                                    ...styles.buttom,
                                    //...styles.normalLeftButtom,
                                    ...styles.cancelButtom,
                                    padding: 8,
                                }) ||
                            (status === 'CANCEL' && {
                                ...styles.buttom,
                                ...styles.buttonCancelDisable,
                                padding: 8,
                            })
                        }
                        disabled={
                            ((status === 'WAIT' ||
                                    status === 'REPORT' ||
                                    status === 'PARTIAL_CONFIRM' ||
                                    status === 'NOT_HELD') &&
                                false) ||
                            ((status === 'CONFIRM' || status === 'NOT_RESPECTED') &&
                                userId !== data.userInitor) ||
                            (status === 'CANCEL' && true)
                        }
                        onPress={() =>
                            ((status === 'WAIT' || status === 'REPORT') &&
                                handleEditAppointment()) ||
                            (status === 'CONFIRM' &&
                                userId === data.userInitor &&
                                handleCancelAppointment())
                        }>
                        {(status === 'WAIT' ||
                            status === 'REPORT' ||
                            status === 'PARTIAL_CONFIRM' ||
                            status === 'NOT_HELD') && (
                            <Text style={styles.buttomTextLeft}>
                                {t('upcomingAppointment.edit_btn')}
                            </Text>
                        ) as JSX.Element}

                        {(status === 'CONFIRM' || status === 'NOT_RESPECTED') &&
                            statusDealine && (
                                <Text
                                    style={
                                        styles.buttomCancelText
                                        //userId === data.userInitor ? styles.buttomTextLeft : styles.buttomCancelText
                                    }>
                                    {t('upcomingAppointment.cancel_btn')}
                                </Text>
                            )}

                        {status === 'CANCEL' && (
                            <Text style={
                                styles.buttonCancelDisableText
                            }>
                                {t('upcomingAppointment.cancel_btn')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
                {/* RIGHT BUTTON [CONFIRM - REPROGRAMME - SAVE ] */}
                <View style={{flex: 1, paddingLeft: 10}}>
                    <TouchableOpacity
                        style={
                            (status === 'CANCEL' && {
                                ...styles.buttom,
                                ...styles.buttonCancelDisable,
                                padding: 8,
                            }) ||
                            ((status === 'REPORT' ||
                                status === 'PARTIAL_CONFIRM' ||
                                status === 'NOT_HELD') && {
                                ...styles.buttom,
                                backgroundColor: COLORS.secondary,
                                padding: 8,
                            }) ||
                            (status === 'WAIT' &&
                                userId !== data.userInitor && {
                                    ...styles.buttom,
                                    backgroundColor: COLORS.secondary,
                                    padding: 8,
                                }) ||
                            (status === 'WAIT' &&
                                userId === data.userInitor && {
                                    ...styles.buttom,
                                    ...styles.buttonCancelDisable,
                                    padding: 8,
                                }) ||
                            ((status === 'CONFIRM' || status === 'NOT_RESPECTED') &&
                                statusDealine && {
                                    ...styles.buttom,
                                    backgroundColor: COLORS.secondary,
                                    padding: 8,
                                })
                        }
                        onPress={() =>
                            (status === 'WAIT' && handleConfirmAppointment()) ||
                            (status === 'REPORT' && handleConfirmAppointment()) ||
                            (status === 'CONFIRM' && handleRescheduleAppointment())
                        }
                        disabled={
                            (status === 'WAIT' && userId === data.userInitor && teacherDest === null && true) ||
                            (status === 'CONFIRM' && false) ||
                            (status === 'CANCEL' && true)
                        }>
                        {(status === 'WAIT' ||
                            status === 'REPORT' ||
                            status === 'PARTIAL_CONFIRM' ||
                            status === 'NOT_HELD') && (
                            <Text
                                style={
                                    status === 'WAIT' && userId === data.userInitor
                                        ? styles.buttonCancelDisableText
                                        : styles.buttomTextRight
                                }>
                                {t('upcomingAppointment.confirm_btn')}
                            </Text>
                        )}

                        {(status === 'CONFIRM' || status === 'NOT_RESPECTED') &&
                            statusDealine && (
                                <Text style={styles.buttomTextRight}>
                                    {t('upcomingAppointment.reschedule_btn')}
                                </Text>
                            )}

                        {status === 'CANCEL' && (
                            <Text style={styles.buttonCancelDisableText}>
                                {t('appointmentDetails.save_btn')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {loading && (
                <View style={{...globalStyles.loading, marginTop: 100} as StyleSheet}>
                    <ActivityIndicator size={'large'} color={COLORS.secondary} />
                </View>
            )}

            <Modal visible={editModal} animationType="slide" style={{marginTop: 100}}>
                <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
                    <DatesReservedModal
                        visibility={openDates}
                        setOpenDates={setOpenDates}
                        openDatesData={openDatesData}
                    />
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitle}>
                                    <Text style={styles.modalTitleText}>
                                        {t('allAppointment.edit_appointment')}
                                    </Text>
                                </View>
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                    <MaterialIcons
                                        name="close"
                                        size={22}
                                        color={COLORS.gray}
                                        onPress={() => {
                                            setEditModal(false);
                                        }}
                                    />
                                </TouchableWithoutFeedback>
                            </View>

                            <ScrollView style={styles.modalContent}>
                                <Formik
                                    initialValues={{
                                        appointmentTitle: data.objet,
                                        appointmentDescription: data.details,
                                        appointmentTeacher: '',
                                    }}
                                    validationSchema={newAppointmentFormSchema}
                                    onSubmit={(dataForm: any, actions: any) => {

                                        const dateDebutMeeting = data.dateDebut - data.deadlineUpdate;
                                        const today = new Date().setHours(23, 59, 59, 0);
                                        if (dateDebutMeeting > 0 && (today < dateDebutMeeting)) {

                                            if (bntActionStatus === 'EDIT') {
                                                const theDay = format(date, 'EEEE', {locale: enUS});

                                                if (!dayListOff.includes(theDay.toLowerCase())) {
                                                    //teacherDest !== null &&
                                                    if (startTimeValue !== null) {
                                                        setErrorMsgTeacher('');
                                                        setErrorMsgStartTime('');
                                                        setErrorMsgToday('');
                                                        setButtonStatus(true);
                                                        let dateDebut = set(date, {
                                                            hours: getHours(startTime),
                                                            minutes: getMinutes(startTime),
                                                        });
                                                        let dateFin = set(date, {
                                                            hours: getHours(endTime),
                                                            minutes: getMinutes(endTime),
                                                        });

                                                        dateDebut = fromZonedTime(dateDebut, TIME_ZONE_ABIDJAN);
                                                        dateFin = fromZonedTime(dateFin, TIME_ZONE_ABIDJAN);

                                                        let dataToSend: any = null;

                                                        if (statusDealine) {
                                                            const today = getTime(newDate);
                                                            if(today <= getTime(dateDebut)) {
                                                                if (data.meetingStatus === 'WAIT') {
                                                                    if (data.userInitor === userId) {
                                                                        dataToSend = {
                                                                            ...data,
                                                                            id: data.id,
                                                                            meetingType: data.meetingType,
                                                                            dateDebut: getTime(dateDebut),
                                                                            dateFin: getTime(dateFin),
                                                                            objet: dataForm.appointmentTitle,
                                                                            details: dataForm.appointmentDescription,
                                                                            classeId: data.classeId,
                                                                            maxInviter: data.maxInviter,
                                                                            dureeMeeting: data.dureeMeeting,
                                                                            deadlineUpdate: data.deadlineUpdate,
                                                                            meetingStatus: data.meetingStatus,
                                                                            totalCreneau: data.totalCreneau,
                                                                            maxEnfantChoice: data.maxEnfantChoice,
                                                                            creneauRdvs: [
                                                                                {
                                                                                    ...data.creneauRdvs[0],
                                                                                    id: data.creneauRdvs[0].id,
                                                                                    rdvId: data.creneauRdvs[0].rdvId,
                                                                                    dateDebut: getTime(dateDebut),
                                                                                    dateFin: getTime(dateFin),
                                                                                    totalInviterConfirm:
                                                                                    data.creneauRdvs[0].totalInviterConfirm,
                                                                                    meetingStatus:
                                                                                    data.creneauRdvs[0].meetingStatus,
                                                                                    creneauRdvEnfantParents: [
                                                                                        {
                                                                                            ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                                                                                            id: data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0].id,
                                                                                            meetingStatus:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .meetingStatus,
                                                                                            creneauRdvId:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .creneauRdvId,
                                                                                            enfantId:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .enfantId,
                                                                                            parentId: parentId,
                                                                                            dateDebut: getTime(dateDebut),
                                                                                            dateFin: getTime(dateFin),
                                                                                            commentaire:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .commentaire,
                                                                                        },
                                                                                    ],
                                                                                    creneauRdvEmployees: [
                                                                                        {
                                                                                            ...data.creneauRdvs[0].creneauRdvEmployees[0],
                                                                                        }
                                                                                    ],
                                                                                    parentNbrAction:
                                                                                    data.creneauRdvs[0].parentNbrAction,
                                                                                    employeeNbrAction:
                                                                                    data.creneauRdvs[0].employeeNbrAction,
                                                                                    common: data.creneauRdvs[0].common,
                                                                                    libelle: data.creneauRdvs[0].libelle,
                                                                                    compositeId:
                                                                                    data.creneauRdvs[0].compositeId,
                                                                                    _links: data.creneauRdvs[0]._links,
                                                                                },
                                                                            ],
                                                                            common: data.common,
                                                                            userInitor: data.userInitor,
                                                                        };
                                                                    }
                                                                    else {
                                                                        dataToSend = {
                                                                            ...data,
                                                                            id: data.id,
                                                                            meetingType: data.meetingType,
                                                                            dateDebut: data.dateDebut,
                                                                            dateFin: data.dateFin,
                                                                            objet: data.objet,
                                                                            details: data.details,
                                                                            classeId: data.classeId,
                                                                            maxInviter: data.maxInviter,
                                                                            dureeMeeting: data.dureeMeeting,
                                                                            deadlineUpdate: data.deadlineUpdate,
                                                                            meetingStatus: 'REPORT',
                                                                            totalCreneau: data.totalCreneau,
                                                                            maxEnfantChoice: data.maxEnfantChoice,
                                                                            userInitor: data.userInitor,
                                                                            creneauRdvs: [
                                                                                {
                                                                                    ...data.creneauRdvs[0],
                                                                                    id: data.creneauRdvs[0].id,
                                                                                    rdvId: data.creneauRdvs[0].rdvId,
                                                                                    dateDebut: data.creneauRdvs[0].dateDebut,
                                                                                    dateFin: data.creneauRdvs[0].dateFin,
                                                                                    totalInviterConfirm:
                                                                                    data.creneauRdvs[0].totalInviterConfirm,
                                                                                    //meetingStatus: data.creneauRdvs[0].meetingStatus,
                                                                                    meetingStatus: 'REPORT',
                                                                                    creneauRdvEnfantParents: [
                                                                                        {
                                                                                            ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                                                                                            id: data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0].id,
                                                                                            meetingStatus: 'REPORT',
                                                                                            creneauRdvId:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .creneauRdvId,
                                                                                            enfantId:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .enfantId,
                                                                                            parentId: parentId,
                                                                                            dateDebut: getTime(dateDebut),
                                                                                            dateFin: getTime(dateFin),
                                                                                            commentaire:
                                                                                            data.creneauRdvs[0]
                                                                                                .creneauRdvEnfantParents[0]
                                                                                                .commentaire,
                                                                                        },
                                                                                    ],
                                                                                    creneauRdvEmployees:
                                                                                    data.creneauRdvs[0].creneauRdvEmployees,
                                                                                    parentNbrAction:
                                                                                    data.creneauRdvs[0].parentNbrAction,
                                                                                    employeeNbrAction:
                                                                                    data.creneauRdvs[0].employeeNbrAction,
                                                                                    common: data.creneauRdvs[0].common,
                                                                                    libelle: data.creneauRdvs[0].libelle,
                                                                                    compositeId:
                                                                                    data.creneauRdvs[0].compositeId,
                                                                                    _links: data.creneauRdvs[0]._links,
                                                                                },
                                                                            ],
                                                                            common: data.common,
                                                                        };
                                                                    }
                                                                }
                                                                else if (data.meetingStatus === 'REPORT') {
                                                                    dataToSend = {
                                                                        ...data,
                                                                        id: data.id,
                                                                        meetingType: data.meetingType,
                                                                        dateDebut: data.dateDebut,
                                                                        dateFin: data.dateFin,
                                                                        objet: data.objet,
                                                                        details: data.details,
                                                                        classeId: data.classeId,
                                                                        maxInviter: data.maxInviter,
                                                                        dureeMeeting: data.dureeMeeting,
                                                                        deadlineUpdate: data.deadlineUpdate,
                                                                        meetingStatus: data.meetingStatus,
                                                                        totalCreneau: data.totalCreneau,
                                                                        maxEnfantChoice: data.maxEnfantChoice,
                                                                        userInitor: data.userInitor,
                                                                        creneauRdvs: [
                                                                            {
                                                                                ...data.creneauRdvs[0],
                                                                                id: data.creneauRdvs[0].id,
                                                                                rdvId: data.creneauRdvs[0].rdvId,
                                                                                dateDebut: data.creneauRdvs[0].dateDebut,
                                                                                dateFin: data.creneauRdvs[0].dateFin,
                                                                                totalInviterConfirm:
                                                                                data.creneauRdvs[0].totalInviterConfirm,
                                                                                meetingStatus:
                                                                                data.creneauRdvs[0].meetingStatus,
                                                                                creneauRdvEnfantParents: [
                                                                                    {
                                                                                        ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                                                                                        id: data.creneauRdvs[0]
                                                                                            .creneauRdvEnfantParents[0].id,
                                                                                        meetingStatus: 'REPORT',
                                                                                        creneauRdvId:
                                                                                        data.creneauRdvs[0]
                                                                                            .creneauRdvEnfantParents[0]
                                                                                            .creneauRdvId,
                                                                                        enfantId:
                                                                                        data.creneauRdvs[0]
                                                                                            .creneauRdvEnfantParents[0]
                                                                                            .enfantId,
                                                                                        parentId: parentId,
                                                                                        dateDebut: getTime(dateDebut),
                                                                                        dateFin: getTime(dateFin),
                                                                                        commentaire:
                                                                                        data.creneauRdvs[0]
                                                                                            .creneauRdvEnfantParents[0]
                                                                                            .commentaire,
                                                                                    },
                                                                                ],
                                                                                creneauRdvEmployees:
                                                                                data.creneauRdvs[0].creneauRdvEmployees,
                                                                                parentNbrAction:
                                                                                data.creneauRdvs[0].parentNbrAction,
                                                                                employeeNbrAction:
                                                                                data.creneauRdvs[0].employeeNbrAction,
                                                                                common: data.creneauRdvs[0].common,
                                                                                libelle: data.creneauRdvs[0].libelle,
                                                                                compositeId:
                                                                                data.creneauRdvs[0].compositeId,
                                                                                _links: data.creneauRdvs[0]._links,
                                                                            },
                                                                        ],
                                                                        common: data.common,
                                                                    };
                                                                }

                                                                if (dataToSend !== null) {
                                                                    if(data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === user.userDetails.personDetails?.person?.id || data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === null) {
                                                                        request(
                                                                            'PUT',
                                                                            '',
                                                                            `/extra/rdv/${data.id}`,
                                                                            dataToSend,
                                                                        )
                                                                            .then(response => {
                                                                                dispatch(updateAppointment(response.data));
                                                                                setAppointmentDetails(null);
                                                                                setAppointmentDetails(response.data);
                                                                                actions.resetForm({
                                                                                    values: {
                                                                                        appointmentTitle: '',
                                                                                        appointmentDescription: '',
                                                                                        appointmentTeacher: '',
                                                                                    },
                                                                                });

                                                                                setDate(newDate);
                                                                                setStartTime(newDate);
                                                                                setEndTime(newDate);
                                                                                setEditModal(false);
                                                                                setButtonStatus(false);
                                                                                if(location === 'home') {
                                                                                    //navigation.navigate(ROUTES.HOME_TAB);
                                                                                    router.push('/(tabs)');
                                                                                }
                                                                                else {
                                                                                    //navigation.navigate(ROUTES.APPOINTMENT, {screen: ROUTES.ALL_APPOINTMENT});
                                                                                    router.push('/(tabs)/appointment/all-appointment');
                                                                                }
                                                                                //snackbarShowMessage(t('snackBar.sb_succes_save'));
                                                                            })
                                                                            .catch(error => {
                                                                                //console.log(JSON.stringify(error));
                                                                                if (error.response) {
                                                                                    const msgToDisplay = error.response.data;
                                                                                    if(msgToDisplay?.codeMessage === 'RDV_DATE_NOT_FREE') {
                                                                                        snackbarShowMessage(t('allAppointment.rdv_date_not_free'));
                                                                                    }
                                                                                    console.log(msgToDisplay);
                                                                                }
                                                                                else {
                                                                                    snackbarShowMessage(t('snackBar.sb_error'));
                                                                                }
                                                                                console.log(error.config);

                                                                                setButtonStatus(false);
                                                                                setEditModal(false);
                                                                            });
                                                                    }
                                                                    else {
                                                                        setButtonStatus(false);
                                                                        setEditModal(false);
                                                                        snackbarShowMessage(t('allAppointment.cannot_edit_preset_appointment'));
                                                                    }
                                                                }
                                                            }
                                                            else {
                                                                setErrorMsgToday(t('allAppointment.no_right_date'));
                                                            }
                                                        }
                                                        else {
                                                            setEditModal(false);
                                                            setButtonStatus(false);
                                                            snackbarShowMessage(
                                                                t('appointment.no_action_available'),
                                                            );
                                                        }
                                                    }
                                                    else {
                                                        setErrorMsgTeacher(t('login.required_field'));
                                                        if (teacherDest !== null) {
                                                            setErrorMsgTeacher('');
                                                        }

                                                        setErrorMsgStartTime(t('login.required_field'));
                                                        if (startTimeValue !== null) {
                                                            setErrorMsgStartTime('');
                                                        }
                                                    }
                                                }
                                                else {
                                                    setButtonStatus(false);
                                                    setEditModal(false);
                                                    snackbarShowMessage(t('allAppointment.no_duty'));
                                                }
                                            }
                                            else if (bntActionStatus === 'CONFIRM') {
                                                const theDay = format(date, 'EEEE', {locale: enUS});
                                                if (!dayListOff.includes(theDay.toLowerCase())) {
                                                    //teacherDest !== null &&
                                                    if (startTimeValue !== null) {
                                                        setErrorMsgTeacher('');
                                                        setErrorMsgStartTime('');
                                                        setButtonStatus(true);

                                                        let dateDebut = set(date, {
                                                            hours: getHours(startTime),
                                                            minutes: getMinutes(startTime),
                                                        });
                                                        let dateFin = set(date, {
                                                            hours: getHours(endTime),
                                                            minutes: getMinutes(endTime),
                                                        });
                                                        dateDebut = fromZonedTime(dateDebut, TIME_ZONE_ABIDJAN);
                                                        dateFin = fromZonedTime(dateFin, TIME_ZONE_ABIDJAN);

                                                        const today = getTime(newDate);
                                                        if(today <= getTime(dateDebut)) {
                                                            let dataToSend: any = null;
                                                            dataToSend = {
                                                                ...data,
                                                                id: data.id,
                                                                meetingType: data.meetingType,
                                                                dateDebut: data.dateDebut,
                                                                dateFin: data.dateFin,
                                                                objet: data.objet,
                                                                details: data.details,
                                                                classeId: data.classeId,
                                                                maxInviter: data.maxInviter,
                                                                dureeMeeting: data.dureeMeeting,
                                                                deadlineUpdate: data.deadlineUpdate,
                                                                meetingStatus: data.meetingStatus,
                                                                totalCreneau: data.totalCreneau,
                                                                maxEnfantChoice: data.maxEnfantChoice,
                                                                userInitor: data.userInitor,
                                                                creneauRdvs: [
                                                                    {
                                                                        ...data.creneauRdvs[0],
                                                                        id: data.creneauRdvs[0].id,
                                                                        rdvId: data.creneauRdvs[0].rdvId,
                                                                        dateDebut: data.creneauRdvs[0].dateDebut,
                                                                        dateFin: data.creneauRdvs[0].dateFin,
                                                                        totalInviterConfirm:
                                                                        data.creneauRdvs[0].totalInviterConfirm,
                                                                        meetingStatus: data.creneauRdvs[0].meetingStatus,
                                                                        creneauRdvEnfantParents: [
                                                                            {
                                                                                ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                                                                                id: data.creneauRdvs[0]
                                                                                    .creneauRdvEnfantParents[0].id,
                                                                                meetingStatus: 'REPORT',
                                                                                creneauRdvId:
                                                                                data.creneauRdvs[0]
                                                                                    .creneauRdvEnfantParents[0].creneauRdvId,
                                                                                enfantId:
                                                                                data.creneauRdvs[0]
                                                                                    .creneauRdvEnfantParents[0].enfantId,
                                                                                parentId: parentId,
                                                                                dateDebut: getTime(dateDebut),
                                                                                dateFin: getTime(dateFin),
                                                                                commentaire:
                                                                                data.creneauRdvs[0]
                                                                                    .creneauRdvEnfantParents[0].commentaire,
                                                                            },
                                                                        ],
                                                                        creneauRdvEmployees:
                                                                        data.creneauRdvs[0].creneauRdvEmployees,
                                                                        parentNbrAction:
                                                                        data.creneauRdvs[0].parentNbrAction,
                                                                        employeeNbrAction:
                                                                        data.creneauRdvs[0].employeeNbrAction,
                                                                        common: data.creneauRdvs[0].common,
                                                                        libelle: data.creneauRdvs[0].libelle,
                                                                        compositeId: data.creneauRdvs[0].compositeId,
                                                                        _links: data.creneauRdvs[0]._links,
                                                                    },
                                                                ],
                                                                common: data.common,
                                                            };

                                                            if(data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === user.userDetails.personDetails?.person?.id || data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === null) {
                                                                request('PUT', '', `/extra/rdv/${data.id}`, dataToSend)
                                                                    .then(response => {
                                                                        dispatch(updateAppointment(response.data));
                                                                        setAppointmentDetails(null);
                                                                        setAppointmentDetails(response.data);
                                                                        actions.resetForm({
                                                                            values: {
                                                                                appointmentTitle: '',
                                                                                appointmentDescription: '',
                                                                                appointmentTeacher: '',
                                                                            },
                                                                        });

                                                                        setDate(newDate);
                                                                        setStartTime(newDate);
                                                                        setEndTime(newDate);
                                                                        setEditModal(false);
                                                                        setButtonStatus(false);
                                                                        //navigation.navigate(ROUTES.ALL_APPOINTMENT);
                                                                        if(location === 'home') {
                                                                            //navigation.navigate(ROUTES.HOME_TAB);
                                                                            router.push('/(tabs)');
                                                                        }
                                                                        else {
                                                                            //navigation.navigate(ROUTES.APPOINTMENT, {screen: ROUTES.ALL_APPOINTMENT});
                                                                            router.push('/(tabs)/appointment/all-appointment');
                                                                        }
                                                                        //snackbarShowMessage(t('snackBar.sb/_succes_save'));
                                                                    })
                                                                    .catch(error => {
                                                                        console.log(JSON.stringify(error));
                                                                        if (error.response) {
                                                                            const msgToDisplay = error.response.data;
                                                                            if(msgToDisplay?.codeMessage === 'RDV_DATE_NOT_FREE') {
                                                                                snackbarShowMessage(t('allAppointment.rdv_date_not_free'));
                                                                            }
                                                                            console.log(msgToDisplay);
                                                                        }
                                                                        else {
                                                                            snackbarShowMessage(t('snackBar.sb_error'));
                                                                        }
                                                                        console.log(error.config);

                                                                        setButtonStatus(false);
                                                                        setEditModal(false);
                                                                        snackbarShowMessage(t('snackBar.sb_error'));
                                                                    });
                                                            }
                                                            else {
                                                                setButtonStatus(false);
                                                                setEditModal(false);
                                                                snackbarShowMessage(t('allAppointment.cannot_edit_preset_appointment'));
                                                            }
                                                        }
                                                        else {
                                                            setErrorMsgToday(t('allAppointment.no_right_date'));
                                                        }
                                                    }
                                                    else {
                                                        setErrorMsgTeacher(t('login.required_field'));
                                                        if (teacherDest !== null) {
                                                            setErrorMsgTeacher('');
                                                        }

                                                        setErrorMsgStartTime(t('login.required_field'));
                                                        if (startTimeValue !== null) {
                                                            setErrorMsgStartTime('');
                                                        }
                                                    }
                                                }
                                                else {
                                                    setButtonStatus(false);
                                                    setEditModal(false);
                                                    snackbarShowMessage(t('allAppointment.no_duty'));
                                                }

                                            }

                                        }
                                        else {
                                            setButtonStatus(false);
                                            setEditModal(false);
                                            snackbarShowMessage(t('snackBar.sb_error_deadline_exceeded'));
                                        }
                                    }}>
                                    {formikProps => (
                                        <>
                                            {errorMsgToday && (
                                                <Text style={{color: COLORS.redIms, textAlign: 'center', marginBottom:10} as StyleSheet}>{errorMsgToday}</Text>
                                            )}

                                            <View style={styles.inputField}>
                                                <Text style={styles.modalInputLabel}>
                                                    {t('allAppointment.child_field_label')}
                                                </Text>
                                                <TextInput
                                                    style={{...styles.inputModal}}
                                                    editable={false}
                                                    value={
                                                        selectedChild !== null
                                                            ? `${selectedChild.person.prenom} ${selectedChild.person.nom}`
                                                            : ''
                                                    }
                                                />
                                            </View>

                                            <View style={styles.inputField}>
                                                <Text style={styles.modalInputLabel}>
                                                    {t('allAppointment.employee_field_label')}
                                                </Text>
                                                {teacherDest !== null ? (
                                                    <>
                                                        <SelectDropdown
                                                            //disabled={!(userId === data.userInitor)}
                                                            disabled={true}
                                                            data={employeesClassList}
                                                            onSelect={(selectedItem, index) => {
                                                                handleTeacherSelectChange(selectedItem, index);
                                                            }}
                                                            buttonStyle={styles.dropdown3BtnStyle}
                                                            renderCustomizedButtonChild={(
                                                                selectedItem: any,
                                                                index: any,
                                                            ) => {
                                                                return (
                                                                    <View style={styles.dropdown3BtnChildStyle}>
                                                                        {selectedItem ? (
                                                                            <Image
                                                                                source={
                                                                                    selectedItem.person.photo !== '' &&
                                                                                    selectedItem.person.photo !== null
                                                                                        ? {
                                                                                            uri: `${BASEURL_IMG}/${selectedItem.person.photo}`,
                                                                                        }
                                                                                        : IMAGES.avatar
                                                                                }
                                                                                style={styles.dropdown3BtnImage}
                                                                            />
                                                                        ) : (
                                                                            <MaterialIcons
                                                                                name="person-outline"
                                                                                color={COLORS.gray}
                                                                                size={30}
                                                                            />
                                                                        )}
                                                                        <Text
                                                                            style={
                                                                                userId === data.userInitor
                                                                                    ? {...styles.dropdown3BtnTxt}
                                                                                    : {
                                                                                        ...styles.dropdown3BtnTxt,
                                                                                        color: COLORS.grayLight,
                                                                                    }
                                                                            }>
                                                                            {selectedItem
                                                                                ? `${selectedItem.person.prenom} ${selectedItem.person.nom}`
                                                                                : t(
                                                                                    'allAppointment.employee_select_placeholder',
                                                                                )}
                                                                        </Text>
                                                                        <MaterialIcons
                                                                            name="expand-more"
                                                                            color={COLORS.gray}
                                                                            size={22}
                                                                        />
                                                                    </View>
                                                                );
                                                            }}
                                                            dropdownStyle={styles.dropdown3DropdownStyle}
                                                            rowStyle={styles.dropdown3RowStyle}
                                                            renderCustomizedRowChild={(item: any, index: any) => {
                                                                return (
                                                                    <View style={styles.dropdown3RowChildStyle}>
                                                                        <Image
                                                                            source={
                                                                                item !== null &&
                                                                                item.person.photo !== '' &&
                                                                                item.person.photo !== null
                                                                                    ? {
                                                                                        uri: `${BASEURL_IMG}/${item.person.photo}`,
                                                                                    }
                                                                                    : IMAGES.avatar
                                                                            }
                                                                            style={styles.dropdownRowImage}
                                                                        />
                                                                        <Text style={styles.dropdown3RowTxt}>
                                                                            {item !== null ? item.person.prenom : ''}{' '}
                                                                            {item !== null ? item.person.nom : ''}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            }}
                                                            defaultValue={teacherDest}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <TextInput
                                                            style={{...styles.inputModal}}
                                                            editable={false}
                                                            value={`${t('appointment.no_teacher_selected')} ${selectedChildClass?.nom}`}
                                                        />
                                                    </>
                                                )}

                                            </View>

                                            <View style={styles.inputField}>
                                                <Text style={styles.modalInputLabel}>
                                                    {t('allAppointment.title_field_label')}
                                                </Text>
                                                <TextInput
                                                    editable={userId === data.userInitor}
                                                    style={
                                                        userId === data.userInitor
                                                            ? {...styles.inputModal, ...styles.textGray}
                                                            : {...styles.inputModal}
                                                    }
                                                    placeholder={t('allAppointment.title_placeholder')}
                                                    onChangeText={formikProps.handleChange(
                                                        'appointmentTitle',
                                                    )}
                                                    value={formikProps.values.appointmentTitle}
                                                    onBlur={formikProps.handleBlur('appointmentTitle')}
                                                />
                                                <Text style={{...globalStyles.errorText}}>
                                                    {formikProps.touched.appointmentTitle &&
                                                        formikProps.errors.appointmentTitle && (
                                                            <Text>{t('login.required_field')}</Text>
                                                        )}
                                                </Text>
                                            </View>

                                            <View style={styles.inputField}>
                                                <Text style={styles.modalInputLabel}>
                                                    {t('allAppointment.description_field_label')}
                                                </Text>
                                                <TextInput
                                                    editable={userId === data.userInitor}
                                                    multiline
                                                    placeholderTextColor={
                                                        userId === data.userInitor
                                                            ? COLORS.gray
                                                            : COLORS.grayLight
                                                    }
                                                    style={
                                                        userId === data.userInitor
                                                            ? {...styles.inputModal, ...styles.textGray}
                                                            : {...styles.inputModal}
                                                    }
                                                    placeholder={t(
                                                        'allAppointment.description_placeholder',
                                                    )}
                                                    onChangeText={formikProps.handleChange(
                                                        'appointmentDescription',
                                                    )}
                                                    value={formikProps.values.appointmentDescription}
                                                    onBlur={formikProps.handleBlur(
                                                        'appointmentDescription',
                                                    )}
                                                />
                                            </View>

                                            <View style={styles.inputField}>
                                                <View style={{flexDirection: "row"} as StyleSheet}>
                                                    <View style={{flex: 2}}>
                                                        <Text style={styles.modalInputLabel}>
                                                            {t('allAppointment.date_field_label')}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <TouchableOpacity onPress={() => handleOpenDatesData()} style={styles.boxTimeNotAvailable}>
                                                            <MaterialIcons name="info-outline" color={COLORS.primary} size={15} style={{marginRight: 3}} />
                                                            <Text style={styles.textTimeNotAvailable}>{t('allAppointment.time_not_available')}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                <Pressable onPress={() => setOpen(true)}>
                                                    <Text
                                                        style={{...styles.inputModal, ...styles.textGray}}>
                                                        {format(date, 'P', {locale: i18n.language === 'en' ? enUS : fr,})}
                                                    </Text>
                                                </Pressable>
                                            </View>
                                            <DatePicker
                                                modal
                                                open={open}
                                                date={date}
                                                mode="date"
                                                minimumDate={today}
                                                locale={i18n.language}
                                                onConfirm={(date: any) => {
                                                    setOpen(false);
                                                    setDate(date);
                                                }}
                                                onCancel={() => {
                                                    setOpen(false);
                                                }}
                                            />

                                            <View style={{...styles.inputField, zIndex: 2}}>
                                                <Text style={styles.modalInputLabel}>
                                                    {t('allAppointment.startime_field_label')}
                                                </Text>
                                                <DropDownPicker
                                                    open={openStartTimeHour}
                                                    value={startTimeValue}
                                                    items={startTimeData}
                                                    setOpen={setOpenStartTimeHour}
                                                    setValue={setStartTimeValue}
                                                    setItems={setStartTimeData}
                                                    listMode="SCROLLVIEW"
                                                    onChangeValue={startTimeValue => {
                                                        const startHourFind: any = dataStartTime.find(
                                                            (hour: any) => hour.value == startTimeValue,
                                                        );
                                                        const startHourTab = startHourFind.label.split(':');

                                                        const timeStart = set(date, {
                                                            hours: parseInt(startHourTab[0]),
                                                            minutes: parseInt(startHourTab[1]),
                                                            seconds: 0,
                                                        });
                                                        setStartTime(timeStart);

                                                        const timeEnd = set(date, {
                                                            hours: parseInt(startHourTab[0]),
                                                            minutes: parseInt(startHourTab[1]) + 20,
                                                            seconds: 0,
                                                        });
                                                        setEndTime(timeEnd);
                                                    }}
                                                    placeholder={t('allAppointment.startime_field_label')}
                                                    style={{
                                                        borderRadius: 4,
                                                        borderColor: COLORS.grayMedium,
                                                        padding: 0,
                                                    }}
                                                    dropDownContainerStyle={{
                                                        borderColor: COLORS.grayMedium,
                                                        borderRadius: 4,
                                                    }}
                                                    labelStyle={{
                                                        color: COLORS.gray,
                                                        fontSize: 16,
                                                        padding: 0,
                                                    }}
                                                    containerStyle={{
                                                        borderColor: COLORS.grayLight,
                                                        padding: 0,
                                                    }}
                                                    placeholderStyle={{
                                                        color: COLORS.gray,
                                                        fontSize: 16,
                                                    }}
                                                    listItemLabelStyle={{
                                                        fontSize: 16,
                                                        color: COLORS.gray,
                                                    }}
                                                    // @ts-ignore
                                                    language={i18n.language.toUpperCase()}
                                                />
                                            </View>
                                            {errorMsgStartTime !== '' && (
                                                <View style={{...styles.inputField, zIndex: 0}}>
                                                    <Text
                                                        style={{
                                                            ...globalStyles.errorText,
                                                            marginTop: -8,
                                                            paddingTop: 0,
                                                            zIndex: 0,
                                                        } as StyleSheet}>
                                                        {errorMsgStartTime}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={{...styles.inputField, marginBottom: 40}}>
                                                <Text style={styles.modalInputLabel}>
                                                    {t('allAppointment.endtime_field_label')}
                                                </Text>
                                                <Pressable onPress={() => setEndTimeOpen(false)}>
                                                    <Text
                                                        style={{...styles.inputModal, ...styles.textGray}}>
                                                        {format(endTime, 'p', {locale: i18n.language === 'en' ? enUS : fr,})}
                                                    </Text>
                                                </Pressable>
                                            </View>
                                            <DatePicker
                                                modal
                                                open={openEndTime}
                                                date={endTime}
                                                minimumDate={startTime}
                                                mode="time"
                                                locale={i18n.language}
                                                onConfirm={(endTime: any) => {
                                                    setEndTimeOpen(false);
                                                    setEndTime(endTime);
                                                }}
                                                onCancel={() => {
                                                    setEndTimeOpen(false);
                                                }}
                                            />

                                            <FlatButton
                                                title={t('allAppointment.edit_form')}
                                                fontWeight="500"
                                                fontSize={16}
                                                backgroundColor={COLORS.secondary}
                                                paddingVertical={12}
                                                borderRadius={20}
                                                onPress={formikProps.handleSubmit}
                                                disabled={buttonStatus}
                                            />
                                        </>
                                    ) as JSX.Element}
                                </Formik>
                                <View style={{marginTop: 20}} />
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </Modal>
        </View>
    );
}

export default ButtonActionStatus;

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
    },
    information: {
        flexDirection: 'row',
        padding: 0,
        margin: 0,
        marginBottom: 4,
    },
    labelContainer: {
        flex: 1,
    },
    textContainer: {
        flex: 2,
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
    normalLeftButtom: {
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayLight,
        borderWidth: 1,
    },
    normalRightButtom: {
        backgroundColor: COLORS.primary,
    },
    cancelButtom: {
        //backgroundColor: COLORS.grayVeryLight,
        backgroundColor: COLORS.redIms,
        borderColor: COLORS.redIms,
        borderWidth: 1,
    },
    buttomCancelText: {
        //color: COLORS.grayLight,
        color: COLORS.white,
        fontWeight: '400',
    },
    buttonCancelDisable: {
        backgroundColor: COLORS.grayVeryLight,
    },
    buttonCancelDisableText: {
        color: COLORS.grayLight,
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
        color: COLORS.grayDarkLess,
    },
    inputField: {
        marginBottom: 15,
    },
    modalInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.black,
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
    boxTimeNotAvailable: {
        flexDirection: "row"
    },
    textTimeNotAvailable: {
        color: COLORS.primary,
        fontSize: 12,
        fontStyle: "italic"
    }
});
