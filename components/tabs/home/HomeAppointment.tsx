import React from 'react';
import {useTranslation} from "react-i18next";
import {COLORS, IMAGES, ROUTES} from "../../../constants";
import {Card} from "react-native-paper";
import {Pressable, View, StyleSheet} from "react-native";
import {BASEURL_IMG} from "../../../api/appUrl";
import { Image } from "expo-image";
import {globalStyles} from "../../../style/Global";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {MaterialIcons} from "@expo/vector-icons";

function HomeAppointment({
  appointment,
  navigation,
  employeesFind,
  dayDate,
  startTime,
  endTime,
  selectedChildClass,
}: {
  appointment: any;
  navigation: any;
  employeesFind: any;
  dayDate: any;
  startTime: any;
  endTime: any;
  selectedChildClass: any;
}) {
  const {t, i18n} = useTranslation();

  const handleAppointmentDetails = (data: any) => {
    if(data?.meetingType === 'PRESET') {
      navigation.navigate(ROUTES.APPOINTMENT_TAB, {
        screen: ROUTES.APPOINTMENT,
        initial: false,
        params: {
          screen: ROUTES.PRESET_APPOINTMENT
        }
      });
    }
    else {
      navigation.navigate(ROUTES.APPOINTMENT_HOME_DETAILS, { data: data, location: 'home' });
    }
  };

  return (
    <>
      <Card borderRaduis={6} marginBottom={20}>
        <Pressable onPress={() => handleAppointmentDetails(appointment)}>
          <View style={styles.appointmentItem}>
            <View style={styles.appointmentImage}>
              <Image
                source={
                  employeesFind !== undefined &&
                  employeesFind?.person.photo !== ''
                    ? {uri: `${BASEURL_IMG}/${employeesFind?.person.photo}`}
                    : IMAGES.avatar
                }
                contentFit="cover"
                style={styles.appointImageCover}
              />
              {/* <View style={styles.validateStatus} />*/}
            </View>

            <View style={styles.appointmentDetails}>
              <Text style={styles.titleDetail}>{appointment.objet}</Text>
              {/*<Text style={globalStyles.paragraph}>
                {employeesFind !== undefined ? employeesFind.person.prenom : ''}{' '}
                {employeesFind !== undefined ? employeesFind.person.nom : ''}
              </Text>*/}

              {employeesFind !== undefined ? (
                  <Text style={globalStyles.paragraph}>
                    {employeesFind?.person?.prenom} {employeesFind?.person?.nom}
                  </Text>
              ) : (
                  <Text style={globalStyles.paragraph}>
                    {t('appointment.no_teacher_selected')} {selectedChildClass?.nom}
                  </Text>
              )}

              <Text style={globalStyles.paragraph}>
                {startTime} - {endTime}
              </Text>
            </View>

            <View style={styles.dateContainer}>
              {appointment?.meetingStatus !== 3 && (
                <View style={styles.appointmentDate}>
                  <Text
                    style={{
                      ...styles.appointmentDateText,
                      textTransform: 'capitalize',
                    }}>
                    {format(dayDate, 'EEE', { locale: i18n.language == 'en' ? enUS : fr })}
                  </Text>
                  <Text
                    style={{
                      ...styles.appointmentDateText,
                      fontWeight: '700',
                    }}>
                    {String(dayDate.getDate()).padStart(2, '0')}
                  </Text>
                </View>
              )}
              {appointment.status === 3 && (
                <Pressable>
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={COLORS.gray}
                    style={{ textAlign: 'right'} as StyleSheet}
                  />
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </Card>
    </>
  );
}

export default HomeAppointment;

const styles = StyleSheet.create({
  appointmentItem: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 0,
  },
  appointmentImage: {
    flex: 2,
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
  appointmentDetails: {
    flex: 5,
  },
  titleDetail: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.gray,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  appointmentDate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    height: 75,
    width: 40,
    backgroundColor: COLORS.blueLight,
  },
  appointmentDateText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  validateStatus: {
    width: 13,
    height: 13,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: COLORS.greenLight,
  },
});
