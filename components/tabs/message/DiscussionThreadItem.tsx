import React, {memo, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {format, getHours, getMinutes, isToday, isYesterday, toDate} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {BASEURL_IMG} from "../../../api/appUrl";
import {COLORS, IMAGES} from "../../../constants";
import {Image} from "expo-image";
import LetterAvatar from "../../ui/LetterAvatar";


const DiscussionThreadItem = memo(function DiscussionThreadItem({navigation, discussionThread}: any) {
  //const {navigation, discussionThread} = props;
  const {t, i18n} = useTranslation();
  const lastMessageDate: any = toDate(discussionThread?.lastMessageDate);
  const lastMessageTime = `${String(getHours(lastMessageDate)).padStart(
      2,
      '0',
  )}:${String(getMinutes(lastMessageDate)).padStart(2, '0')}`;
  const [displayDate, setDisplayDate] = useState('');
  const [discussionThreadStatus, setDiscussionThreadStatus] = useState(false);
  const locale = i18n.language === 'en' ? enUS : fr;

  useEffect(() => {
    const fetchData = () => {
      const theDay = format(lastMessageDate, 'P', {locale: locale});
      setDisplayDate(theDay);
      const dateToday = isToday(lastMessageDate);
      const dateYesterday = isYesterday(lastMessageDate);
      if (dateToday) {
        setDisplayDate(lastMessageTime);
      }
      if (dateYesterday) {
        setDisplayDate(t('message.yesterday'));
      }
    };
    fetchData();
  }, [discussionThread]);
  return (
      <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            /*navigation.navigate(ROUTES.MESSAGE_DETAILS, {
              discussionThread: discussionThread,
            })*/
          }}>
        <View style={styles.messageItemContainer}>
          {discussionThread?.initiatorRole === 'PARENT' ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'} as StyleSheet}>
                <LetterAvatar name={discussionThread?.className} size={65} />
              </View>
          ) : (
              <View style={styles.messageImage}>
                <Image
                    source={
                      discussionThread.initiatorPhoto !== '' &&
                      discussionThread.initiatorPhoto !== null
                          ? {uri: `${BASEURL_IMG}/${discussionThread?.initiatorPhoto}`}
                          : IMAGES.avatar
                    }
                    contentFit="cover"
                    style={styles.messageImageCover}
                />
              </View>
          )}

          <View style={styles.messageTextContainer}>
            <Text style={styles.interlocutor}>
              {discussionThread?.initiatorRole === 'PARENT' ? `${t('message.teachers')} ${discussionThread?.className}` : discussionThread.initiatorNom}
            </Text>
            <Text
                style={{
                  ...styles.messageText,
                  color: COLORS.gray,
                }}
                numberOfLines={1}
            >
              {t('message.title_placeholder')}: {discussionThread.objet}
            </Text>
            <Text
                style={{
                  ...styles.messageText,
                  color: COLORS.gray,
                }}
                numberOfLines={2}
            >
              {discussionThread.lastMessage}
            </Text>
          </View>

          <View style={styles.messageTimeContainer}>
            <Text style={styles.messageTime}>{displayDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
  );
});

export default DiscussionThreadItem;

const styles = StyleSheet.create({
  messageItemContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  messageImage: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
    paddingBottom: 1,
  },
  messageImageCover: {
    width: 65,
    height: 65,
    overflow: 'hidden',
    borderRadius: 50,
    borderWidth: 1,
    backgroundColor: COLORS.grayVeryLight,
    borderColor: COLORS.grayVeryLight,
  },
  messageTextContainer: {
    flex: 3,
    paddingLeft: 10,
  },
  interlocutor: {
    flex: 1,
    //fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: COLORS.gray,
    paddingTop: 5,
  },
  messageTimeContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  messageText: {
    flex: 8,
    letterSpacing: 1,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '400',
    paddingTop: 5,
    textAlign: 'right',
    color: COLORS.gray
  },
  messageTimeDay: {
    fontSize: 12,
    paddingTop: 5,
    textAlign: 'right',
  },

  newMessageStatus: {
    width: 13,
    height: 13,
    borderRadius: 10,
    marginTop: 5,
    marginRight: 8,
    backgroundColor: COLORS.secondary,
  },
});
