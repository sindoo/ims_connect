import React, {useState} from 'react';
import ViewThemed from "../../../../components/ui/ViewThemed";
import {View, Text, ScrollView, StyleSheet} from "react-native";
import {globalStyles} from "../../../../style/Global";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {COLORS} from "../../../../constants";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import AppointmentItem from "../../../../components/tabs/appointment/AppointmentItem";
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
    const {teacherSelected, employeesClassList} = useSelector(
        (state: any) => state.employee,
    );
    const [teacherDest, setTeacherDest] = useState<any>(null);

    return (
        <ViewThemed style={{...globalStyles.container}}>
            <View style={{paddingTop: 20, paddingBottom:20, backgroundColor: COLORS.grayExtraLight}}>
                <View style={{paddingHorizontal:40}}>
                    <FlatButton
                        title={t('allAppointment.take_appointment')}
                        fontWeight="500"
                        fontSize={16}
                        backgroundColor={COLORS.secondary}
                        paddingVertical={10}
                        borderRadius={20}
                        onPress={() => {
                            setTeacherDest(null);
                            setAddModal(true);
                        }}
                        disabled={false}
                    />
                </View>
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.todayAppointmentContainer}>
                    <Text style={{...globalStyles.title}}>
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
                    {(todayListAppointments.length === 0 || false) && (
                        <View>
                            <Text style={{textAlign: 'center'} as StyleSheet}>
                                {t('appointment.empty_appointment')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.upcomingAppContainer}>
                    <Text style={{...globalStyles.title}}>
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
                    {(upcomingListAppointments.length === 0 || false) && (
                        <View>
                            <Text style={{textAlign: 'center'} as StyleSheet}>
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
                    teacherSelected={teacherSelected}
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
