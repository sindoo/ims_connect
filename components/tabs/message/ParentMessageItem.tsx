import React, {useEffect, useState} from 'react';
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {COLORS, IMAGES} from '../../../constants';
import {BASEURL_IMG} from '../../../api/appUrl';
import {Image} from "expo-image";
import {
    format,
    getHours,
    getMinutes,
    isToday,
    isYesterday,
    toDate,
} from 'date-fns';
import {useTranslation} from 'react-i18next';
import {fr, enUS} from 'date-fns/locale';

const ParentMessageItem = ({ message, parentChoice=1 } : { message: any, parentChoice?: number}) => {
    const {t, i18n} = useTranslation();
    const messageDate: any = toDate(message.theDate);
    const messageTime = `${String(getHours(messageDate)).padStart(
        2,
        '0',
    )}:${String(getMinutes(messageDate)).padStart(2, '0')}`;
    const [displayDate, setDisplayDate] = useState('');
    const locale = i18n.language === 'en' ? enUS : fr;

    useEffect(() => {
        const theDay = format(messageDate, 'P', {locale: locale});
        setDisplayDate(theDay);

        const dateToday = isToday(messageDate);
        const dateYesteerday = isYesterday(messageDate);
        if (dateToday) {
            setDisplayDate(t('message.today'));
        }
        if (dateYesteerday) {
            setDisplayDate(t('message.yesterday'));
        }
    }, []);

    return (
        <TouchableOpacity
            style={styles.messageReceiverContainer}
            activeOpacity={1}
            onPress={() => {}}>
            <View style={styles.receiverTextContainer}>
                <View style={parentChoice === 1 ? styles.receiverOneText : styles.receiverTwoText}>
                    {message.message !== '' && message.message !== null && (
                        <Text style={styles.receiverTextColor}>{message.message}</Text>
                    )}

                    {message?.typeFichier !== '' &&
                        message?.typeFichier !== null &&
                        message?.typeFichier === 'image' && (
                            <>
                                <Image
                                    source={{uri: `${BASEURL_IMG}/${message?.fichier}`}}
                                    contentFit="cover"
                                    style={styles.imageInMessage}
                                />
                                <Text
                                    style={{color: COLORS.white}}
                                    onPress={() =>
                                        Linking.openURL(`${BASEURL_IMG}/${message?.fichier}`)
                                    }>
                                    {message?.nomFichier}
                                </Text>
                            </>
                        )}

                    {message?.typeFichier !== '' &&
                        message?.typeFichier !== null &&
                        message?.typeFichier === 'document' &&
                        message?.fichier !== '' &&
                        message?.fichier !== null && (
                            <Text
                                style={{color: COLORS.white}}
                                onPress={() =>
                                    Linking.openURL(`${BASEURL_IMG}/${message?.fichier}`)
                                }>
                                {message?.fichier}
                            </Text>
                        )}
                </View>
                <View style={styles.timeTextReceiver}>
                    <Text style={styles.timeTextSendFont}>
                        {message?.userNom}, {message?.userPrenom} {displayDate}, {messageTime}
                    </Text>
                </View>
            </View>

            <View style={styles.receiverImageContainer}>
                <View style={styles.senderImage}>
                    <Image
                        source={
                            message?.userPhoto !== '' && message?.userPhoto !== null
                                ? {uri: `${BASEURL_IMG}/${message?.userPhoto}`}
                                : IMAGES.avatar
                        }
                        resizeMode="cover"
                        style={styles.senderImageCover}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ParentMessageItem;

const styles = StyleSheet.create({
    messageSenderContainer: {
        flexDirection: 'row',
        minHeight: 80,
        marginBottom: 20,
    },
    senderImageContainer: {
        flex: 1,
    },
    senderImage: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        paddingBottom: 1,
    },
    senderImageCover: {
        width: 45,
        height: 45,
        overflow: 'hidden',
        borderRadius: 40,
        borderWidth: 1,
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayVeryLight,
    },
    senderTextContainer: {
        flex: 5,
        marginTop: 10,
        //backgroundColor: 'yellow',
    },
    senderText: {
        flex: 3,
        padding: 10,
        borderRadius: 8,
        borderTopLeftRadius: 0,
        backgroundColor: COLORS.secondaryLight,
    },
    senderTextColor: {
        color: COLORS.black,
        letterSpacing: 1,
    },
    timeTextSend: {
        flex: 1,
        marginTop: 4,
        paddingRight: 4,
        alignItems: 'flex-end',
        //backgroundColor:'green',
    },
    timeTextSendFont: {
        fontSize: 13,
    },

    messageReceiverContainer: {
        flexDirection: 'row',
        minHeight: 80,
        marginBottom: 20,
    },
    receiverImageContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    receiverImage: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        paddingBottom: 1,
    },
    receiverImageCover: {
        width: 45,
        height: 45,
        overflow: 'hidden',
        borderRadius: 40,
        borderWidth: 1,
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayVeryLight,
    },
    receiverTextContainer: {
        flex: 5,
        marginTop: 10,
    },
    receiverOneText: {
        flex: 3,
        padding: 10,
        borderRadius: 8,
        borderTopRightRadius: 0,
        backgroundColor: COLORS.secondary,
    },
    receiverTwoText: {
        flex: 3,
        padding: 10,
        borderRadius: 8,
        borderTopRightRadius: 0,
        backgroundColor: COLORS.primaryDark,
    },
    receiverTextColor: {
        color: COLORS.white,
        letterSpacing: 1,
    },

    timeTextReceiver: {
        flex: 1,
        marginTop: 4,
        paddingLeft: 4,
        alignItems: 'flex-start',
    },
    timeTextReceiverFont: {
        fontSize: 12,
    },
    imageInMessage: {
        width: '100%',
        height: 200,
        //overflow: 'hidden',
        //borderRadius: 40,
        //borderWidth: 1,
        //backgroundColor: COLORS.grayVeryLight,
        //borderColor: COLORS.grayVeryLight,
    },
});
