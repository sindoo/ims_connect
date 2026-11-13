import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, TouchableOpacity, View} from 'react-native';
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

const ParticipantMessageItem = (props) => {
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
            style={styles.messageAnotherContainer}
            activeOpacity={1}
            onPress={() => {}}>
            <View style={styles.anotherImageContainer}>
                <View style={styles.anotherImage}>
                    <Image
                        source={
                            message?.userPhoto !== '' && message?.userPhoto !== null
                                ? {uri: `${BASEURL_IMG}/${message?.userPhoto}`}
                                : IMAGES.avatar
                        }
                        contentFit="cover"
                        style={styles.anotherImageCover}
                    />
                </View>
            </View>

            <View style={styles.anotherTextContainer}>
                <View style={styles.anotherText}>

                    {message.message !== '' && message.message !== null && (
                        <Text style={styles.anotherTextColor}>{message.message}</Text>
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
                                        style={{color: COLORS.white}}
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
                                    style={{color: COLORS.white}}
                                    onPress={() => handleDownload('document', message?.fichier)}>
                                    {message?.fichier}
                                </Text>
                            )
                        )}


                </View>
                <View style={styles.timeTextAnother}>
                    <Text style={styles.timeTextAnotherFont}>
                        {message?.userNom}, {displayDate}, {messageTime}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ParticipantMessageItem;

const styles = StyleSheet.create({
    messageAnotherContainer: {
        flexDirection: 'row',
        minHeight: 80,
        marginBottom: 20,
        //backgroundColor:'red',
    },
    anotherImageContainer: {
        flex: 1,
        //backgroundColor: 'green'
    },
    anotherImage: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        paddingBottom: 1,
    },
    anotherImageCover: {
        width: 45,
        height: 45,
        overflow: 'hidden',
        borderRadius: 40,
        borderWidth: 1,
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayVeryLight,
    },
    anotherTextContainer: {
        flex: 5,
        marginTop: 10,
        //backgroundColor: 'yellow',
    },
    anotherText: {
        flex: 3,
        padding: 10,
        borderRadius: 8,
        borderTopLeftRadius: 0,
        backgroundColor: COLORS.redIms,
    },
    anotherTextColor: {
        color: COLORS.white,
        letterSpacing: 1,
    },
    timeTextAnother: {
        flex: 1,
        marginTop: 4,
        paddingRight: 4,
        alignItems: 'flex-end',
        //backgroundColor:'green',
    },
    timeTextAnotherFont: {
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
