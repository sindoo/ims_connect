import React from 'react';
import ViewThemed from "../../../../components/ui/ViewThemed";
import {View, Text, ScrollView, StyleSheet} from "react-native";
import {globalStyles} from "../../../../style/Global";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {COLORS} from "../../../../constants";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import AppointmentItem from "../../../../components/tabs/appointment/AppointmentItem";

const UpcomingAppointment = (props) => {
    const {snackbarShowMessage} = props;
    const {t} = useTranslation();
    const {todayListAppointments, upcomingListAppointments} = useSelector(
        (state: any) => state.appointment,
    );

    return (
        <ViewThemed style={{...globalStyles.container}}>
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
    },
    todayAppointmentContainer: {
        paddingTop: 15,
    },
    upcomingAppContainer: {
        paddingTop: 15,
    },
});
