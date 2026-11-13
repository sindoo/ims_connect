import React, {useEffect, useState} from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {COLORS, IMAGES} from '../../../constants';
import {
    format,
    getHours,
    getMinutes,
    isToday,
    isYesterday,
    toDate,
} from 'date-fns';
import {BASEURL_IMG} from '../../../api/appUrl';
import {enUS, fr} from 'date-fns/locale';
import {useTranslation} from 'react-i18next';
import {Image} from "expo-image";
import Loading from "../../ui/Loading";
import FileDownloadService, {MessageFileType} from "../../../services/FileDownloadService";

const EmployeeMessageItem = (props) => {
    const {message} = props;
    const {t, i18n} = useTranslation();
    const messageDate: any = toDate(message.theDate);
    const messageTime = `${String(getHours(messageDate)).padStart(
        2,
        '0',
    )}:${String(getMinutes(messageDate)).padStart(2, '0')}`;
    const [displayDate, setDisplayDate] = useState('');
    const locale = i18n.language === 'en' ? enUS : fr;
    // Un seul état suffit : un message donné n'a jamais qu'une seule pièce
    // jointe (image OU document, jamais les deux à la fois), donc les deux
    // blocs ci-dessous ne peuvent pas être en téléchargement en même temps.
    const [downloading, setDownloading] = useState(false);

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

    // Remplace l'ancien Linking.openURL (qui se contentait d'ouvrir le
    // fichier dans le navigateur) par un vrai téléchargement + enregistrement
    // sur l'appareil — voir FileDownloadService pour le détail par type de
    // fichier (image -> galerie, document -> feuille de partage native).
    const handleDownload = async (fileType: MessageFileType, suggestedName?: string) => {
        if (!message?.fichier || downloading) return;
        setDownloading(true);
        await FileDownloadService.downloadMessageFile(
            `${BASEURL_IMG}/${message.fichier}`,
            fileType,
            suggestedName,
        );
        setDownloading(false);
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.messageSenderContainer}>
            <View style={styles.senderImageContainer}>
                <View style={styles.senderImage}>
                    <Image
                        source={
                            message?.userPhoto !== '' && message?.userPhoto !== null
                                ? {uri: `${BASEURL_IMG}/${message?.userPhoto}`}
                                : IMAGES.avatar
                        }
                        contentFit="cover"
                        style={styles.senderImageCover}
                    />
                </View>
            </View>

            <View style={styles.senderTextContainer}>
                <View style={styles.senderText}>
                    {message.message !== '' && message.message !== null && (
                        <Text style={styles.senderTextColor}>{message.message}</Text>
                    )}

                    {message?.typeFichier !== '' &&
                        message?.typeFichier !== null &&
                        message?.typeFichier === 'image' && (
                            <>
                                <Image
                                    source={{uri: `${BASEURL_IMG}/${message?.fichier}`}}
                                    resizeMode="cover"
                                    style={styles.imageInMessage}
                                />
                                {downloading ? (
                                    <Loading size="small" />
                                ) : (
                                    <Text
                                        style={{color: COLORS.secondary}}
                                        onPress={() => handleDownload('image', message?.nomFichier)}>
                                        {message?.nomFichier}
                                    </Text>
                                )}
                            </>
                        )}

                    {message?.typeFichier !== '' &&
                        message?.typeFichier !== null &&
                        message?.typeFichier === 'document' &&
                        message?.fichier !== '' &&
                        message?.fichier !== null && (
                            downloading ? (
                                <Loading size="small" />
                            ) : (
                                <Text
                                    style={{color: COLORS.secondary}}
                                    onPress={() => handleDownload('document', message?.fichier)}>
                                    {message?.fichier}
                                </Text>
                            )
                        )}
                </View>

                <View style={styles.timeTextSend}>
                    <Text style={styles.timeTextSendFont}>
                        {message?.userNom}, {displayDate}, {messageTime}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default EmployeeMessageItem;

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
