import React, {useCallback, useState} from 'react';
import ViewThemed from "../../../../components/ui/ViewThemed";
import {View, Text, ScrollView, StyleSheet} from "react-native";
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from "../../../../style/Global";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {COLORS} from "../../../../constants";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import AppointmentItem from "../../../../components/tabs/appointment/AppointmentItem";
import AppointmentService from "../../../../services/AppointmentService";
import {setAllAppointmentList} from "../../../../redux/features/appointment/appointmentSlice";
import * as yup from "yup";
import AppointmentForm from "../../../../components/tabs/appointment/AppointmentForm";
import FlatButton from "../../../../components/ui/FlatButton";

const newAppointmentFormSchema = yup.object({
    appointmentTitle: yup.string().required().min(3),
    appointmentDescription: yup.string().required().min(3),
});
const UpcomingAppointment = (props) => {
    const {snackbarShowMessage} = props;
    const {t} = useTranslation();
    const {todayListAppointments, upcomingListAppointments} = useSelector(
        (state: any) => state.appointment,
    );
    const [addModal, setAddModal] = useState(false);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {employeesClassList} = useSelector(
        (state: any) => state.employee,
    );
    const [teacherDest, setTeacherDest] = useState<any>(null);
    const dispatch = useDispatch();

    // ✅ Évite de recréer cette fonction (et de forcer un re-rendu de
    // FlatButton si jamais il est mémoïsé) à chaque rendu du parent.
    const handleOpenAddModal = useCallback(() => {
        setTeacherDest(null);
        setAddModal(true);
    }, []);

    // ✅ Cet écran ne lisait que "todayListAppointments" /
    // "upcomingListAppointments" depuis Redux, sans jamais les rafraîchir
    // lui-même : leur contenu ne se mettait à jour que si l'écran d'accueil
    // avait relancé son propre chargement. On recharge ici directement à
    // chaque focus de cet onglet, pour que la liste soit à jour même en y
    // arrivant sans passer par l'accueil.
    const fetchAppointments = useCallback(async () => {
        if (!selectedChild) return;
        try {
            const allRdvListSort = await AppointmentService.getAllAppointment(selectedChild.person.id);
            dispatch(setAllAppointmentList(allRdvListSort || []));
        } catch (error) {
            console.log(error);
        }
    }, [selectedChild, dispatch]);

    useFocusEffect(
        useCallback(() => {
            fetchAppointments();
        }, [fetchAppointments])
    );

    return (
        <ViewThemed style={globalStyles.container}>
            <View style={styles.headerBar}>
                <View style={styles.headerButtonWrapper}>
                    <FlatButton
                        title={t('allAppointment.take_appointment')}
                        fontWeight="500"
                        fontSize={16}
                        backgroundColor={COLORS.secondary}
                        paddingVertical={10}
                        borderRadius={20}
                        onPress={handleOpenAddModal}
                        disabled={false}
                    />
                </View>
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.todayAppointmentContainer}>
                    <Text style={globalStyles.title}>
                        {t('upcomingAppointment.today')}
                    </Text>
                    {todayListAppointments.length > 0 &&
                        todayListAppointments.map((appointment: any) => (
                            <AppointmentItem
                                key={appointment.id}
                                data={appointment}
                                snackbarShowMessage={snackbarShowMessage}
                            />
                        ))}
                    {todayListAppointments.length === 0 && (
                        <View>
                            <Text style={styles.emptyText}>
                                {t('appointment.empty_appointment')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.upcomingAppContainer}>
                    <Text style={globalStyles.title}>
                        {t('upcomingAppointment.upcoming')}
                    </Text>
                    {upcomingListAppointments.length > 0 &&
                        upcomingListAppointments.map((appointment: any) => (
                            <AppointmentItem
                                key={appointment.id}
                                data={appointment}
                                snackbarShowMessage={snackbarShowMessage}
                            />
                        ))}
                    {upcomingListAppointments.length === 0 && (
                        <View>
                            <Text style={styles.emptyText}>
                                {t('appointment.empty_appointment')}
                            </Text>
                        </View>
                    )}
                </View>

                <AppointmentForm
                    addModal={addModal}
                    setAddModal={setAddModal}
                    newAppointmentFormSchema={newAppointmentFormSchema}
                    teacherDest={teacherDest}
                    selectedChild={selectedChild}
                    employeesClassList={employeesClassList}
                    setTeacherDest={setTeacherDest}
                    snackbarShowMessage={snackbarShowMessage}
                />
            </ScrollView>
        </ViewThemed>
    );
};

export default withSnackbar(UpcomingAppointment);

const styles = StyleSheet.create({
    headerBar: {
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: COLORS.grayExtraLight,
    },
    headerButtonWrapper: {
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 10,
        paddingBottom: 20,
        paddingTop:0,
    },
    todayAppointmentContainer: {
        paddingTop: 15,
    },
    upcomingAppContainer: {
        paddingTop: 15,
    },
});
