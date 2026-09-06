import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  COLORS,
  NOTIFICATION_MESSAGE_EN,
  NOTIFICATION_MESSAGE_FR,
  NOTIFICATION_NAGIVATION,
  NOTIFICATION_TAG_EN,
  NOTIFICATION_TAG_FR,
  ROUTES,
} from '../../../constants';
import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {
  initializeNotification,
  setNotificationList,
  setNotificationNumber,
} from '../../../redux/features/notification/notificationSlide';
import {format, toDate} from 'date-fns';
import {enUS, fr} from 'date-fns/locale';
import WsNotificationService from '../../../services/WSNotificationService';
import {
  setAlertMessageHeader,
  setDataNotification,
} from '../../../redux/features/alertmessage/alertMessageSlide';
import {changeChild} from '../../../redux/features/child/childSlice';
import {MaterialIcons} from "@expo/vector-icons";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import SearchBox from "../SearchBox";



export default function NotificationHeader({notifModal, setNotifModal, navigation}: any) {
  const {children} = useSelector((state: any) => state.child);
  const {user} = useSelector((state:any) => state.user);
  const {notificationList} = useSelector((state: any) => state.notification);
  const {t, i18n} = useTranslation();
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');

  const handleChangeChild = (childSelectedId: any) => {
    const findChild = children.filter(
      (child: any) => child?.id === childSelectedId,
    );

    if (findChild.length > 0) {
      dispatch(changeChild(findChild[0]));
    }
  };

  const handleNotificationNavigation = async (screen: any, notification: any) => {
    try {
      setNotifModal(false);
      const notificationId = notification?.id;
      const notificationParseData = {
        ...notification,
        message: JSON.parse(notification.message),
      };

      await WsNotificationService.updateNotification(user, notificationId);
      const responseList = await WsNotificationService.getAllNotification(user.uuid);
      let allNotification = WsNotificationService.getRecentNotificationList(responseList);

      dispatch(setNotificationNumber(0));
      dispatch(setNotificationList([]));

      if (allNotification.length > 0) {
        dispatch(setNotificationNumber(allNotification.length));
        dispatch(setNotificationList(allNotification));
      }

      if (notificationParseData?.common?.tag === 'rdv') {
        if (notificationParseData?.message?.meetingType === 'NORMAL') {
          const creneauRdvEnfantParents = notificationParseData?.message?.creneauRdvs[0]?.creneauRdvEnfantParents;
          if (creneauRdvEnfantParents.length > 0) {
            if (creneauRdvEnfantParents[0]?.enfantId !== null && creneauRdvEnfantParents[0]?.enfantId !== 0) {
              handleChangeChild(creneauRdvEnfantParents[0]?.enfantId);
            }
          }

          navigation.navigate(screen.value, {
            screen: ROUTES.APPOINTMENT,
            initial: false,
            params: {
              screen: ROUTES.ALL_APPOINTMENT
            }
          });
        }
        else if (notificationParseData?.message?.meetingType === 'PRESET') {
          if (notificationParseData?.message?.classeId !== null && notificationParseData?.message?.classeId !== 0) {
            for (let i = 0; i < children.length; i++) {
              const classroomId = children[i]?.eleves[0]?.classe?.id;
              if (notificationParseData?.message?.classeId === classroomId) {
                handleChangeChild(children[i]?.id);
                break;
              }
            }
          }

          navigation.navigate(screen.value, {
            screen: ROUTES.APPOINTMENT,
            initial: false,
            params: {
              screen: ROUTES.PRESET_APPOINTMENT
            }
          });
        }
      }
      else {
        if (notificationParseData?.common?.tag === 'alertmessage') {
          if (notificationParseData?.message?.enfantId !== null && notificationParseData?.message?.enfantId !== 0) {
            handleChangeChild(notificationParseData?.message?.enfantId);
          }
          dispatch(setDataNotification(notificationParseData));
          dispatch(setAlertMessageHeader(true));
        }
        else if (notificationParseData?.common?.tag === 'imsday') {
          if (notificationParseData?.message?.enfantId !== null && notificationParseData?.message?.enfantId !== 0) {
            handleChangeChild(notificationParseData?.message?.enfantId);
          }
          navigation.navigate(screen.value);
        }
        else if( notificationParseData?.common?.tag === 'sondage') {
          if (notificationParseData?.message?.enfantId !== null && notificationParseData?.message?.enfantId !== 0) {
            const classrooms = notificationParseData?.message?.classes.split(',');
            let classroomsIds = classrooms.map((classroom:string) => parseInt(classroom));

            for (let i = 0; i < children.length; i++) {
              const classroomId = children[i]?.eleves[0]?.classe?.id;
              if(classroomsIds.includes(classroomId)){
                handleChangeChild(children[i]?.id);
                break;
              }
            }
          }

          navigation.jumpTo(screen.value, { screen: ROUTES.SURVEY });
        }
        else if (notificationParseData?.common?.tag === 'miniclubs') {
          if (notificationParseData?.message?.enfantId !== null && notificationParseData?.message?.enfantId !== 0) {
            handleChangeChild(notificationParseData?.message?.enfantId);
          }
          navigation.navigate(screen.value, { screen: ROUTES.MINI_CLUB });
        }
        else if (notificationParseData?.common?.tag === 'message_center') {
          if (notificationParseData?.message?.enfantId !== null && notificationParseData?.message?.enfantId !== 0) {
            handleChangeChild(notificationParseData?.message?.enfantId);
          }
          navigation.navigate(screen.value);
        }
        else if(notificationParseData?.common?.tag === 'documents'){
          if (notificationParseData?.message?.enfantId !== null && notificationParseData?.message?.enfantId !== 0) {
            handleChangeChild(notificationParseData?.message?.enfantId);
          }
          navigation.navigate(screen.value, { screen: ROUTES.SCHOOL_DOCUMENT });
        }
      }
    }
    catch (error) {
      console.log(error);
    }
  };

  const handleClearNotification = async () => {
    try {
      if(user !== null) {
        if (notificationList.length > 0) {
          await WsNotificationService.deleteAllNotification(user.uuid);
          dispatch(initializeNotification());
        }
        setNotifModal(false);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Modal visible={notifModal} animationType="slide" style={{marginTop: 50}}>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitle}>
                <Text style={styles.modalTitleText}>
                  {t('notification.title')}
                </Text>
              </View>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.gray}
                  onPress={() => {
                    setNotifModal(false);
                  }}
                />
              </TouchableWithoutFeedback>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.headerToolsNotification}>
                <View>
                  <SearchBox
                      searchValue={search}
                      setSearchValue={setSearch}
                      handleClearSearch={() => {}}
                      handleSubmitSearch={() => {}}
                  />
                </View>
                {/*<Pressable
                  onPress={() => handleClearNotification()}
                  style={{flexDirection: 'row'}}>
                  <MaterialIcons name="clear-all" size={20} color={COLORS.gray} />
                  <Text style={{color: COLORS.gray, marginLeft: 10}}>
                    {t('notification.clear')}
                  </Text>
                </Pressable>*/}
              </View>

              <ScrollView style={styles.notificationContent}>
                {notificationList.length === 0 && (
                  <Text
                    style={{
                      color: COLORS.gray,
                      justifyContent: 'center',
                      alignContent: 'center',
                    } as StyleSheet}>
                    {t('notification.empty_notification')}
                  </Text>
                )}

                {notificationList.length > 0 &&
                  notificationList.map((notification: any) => {
                   /* const notificationTag: any = i18n.language === 'en' ?
                        NOTIFICATION_TAG_EN.find((notif: any)=> notif?.tag === notification?.common.tag) :
                        NOTIFICATION_TAG_FR.find((notif: any)=> notif.tag === notification?.common.tag);*/

                    const notificationMsg: any =
                      i18n.language === 'en'
                        ? NOTIFICATION_MESSAGE_EN.find(
                            (notif: any) => notif?.tag === notification?.common.tag &&
                              notif.action === notification?.senderAction.toLowerCase(),
                          )
                        : NOTIFICATION_MESSAGE_FR.find(
                            (notif: any) => notif.tag === notification?.common.tag &&
                              notif.action === notification?.senderAction.toLowerCase(),
                          );

                    //console.log(JSON.stringify(notification))
                    const notificationNavigation: any = NOTIFICATION_NAGIVATION.find((notif: any) => notif.tag === notification?.common.tag);

                    let senderFrom: any = '';
                    if (notification?.roleSender === 'TEACHER') {
                      //${t('notification.from')}
                      senderFrom = `${notification?.nameSender}`;
                    }
                    else if(notification?.roleSender === 'ADMIN') {
                      senderFrom = t('notification.from_admin');
                    }
                    else {
                      senderFrom = t('notification.from_rdv');
                    }

                    let notificationDate: any = toDate(notification.dateSent);

                    return (
                      <TouchableOpacity
                        activeOpacity={0.5}
                        onPress={() =>
                          handleNotificationNavigation(
                            notificationNavigation,
                            notification,
                          )
                        }
                        key={notification.id}>
                        <View style={styles.notificationItem}>
                          <Text style={{color: COLORS.gray, fontWeight: '600'}}>
                            {notification?.title}
                          </Text>
                          <Text style={{color: COLORS.gray}}>
                            {senderFrom}{' '}
                          </Text>

                          <Text style={{color: COLORS.gray}}>
                            {notificationMsg?.value} | {``}
                            {i18n.language == 'en' ? `${format(notificationDate, 'MMM', {
                                  locale: enUS,
                                })} ${String(notificationDate.getDate()).padStart(
                                  2,
                                  '0',
                                )}, ${format(notificationDate, 'yyyy', {
                                  locale: enUS,
                                })}` : `${String(notificationDate.getDate()).padStart(
                                  2,
                                  '0',
                                )} ${format(notificationDate, 'MMM', {
                                  locale: fr,
                                })} ${format(notificationDate, 'yyyy', {
                                  locale: fr,
                                })}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  headerToolsNotification: {
    padding: 5,
    alignItems: 'flex-end',
    backgroundColor: COLORS.grayVeryLight,
    borderBottomColor: COLORS.grayLight,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  notificationContent: {
    flex: 1,
    marginTop: 25,
    paddingHorizontal: 10,
  },
  notificationItem: {
    borderBottomColor: COLORS.grayVeryLight,
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 15,
  },
});
