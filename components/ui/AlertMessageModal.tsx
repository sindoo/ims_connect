import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {format, toDate} from 'date-fns';
import {enUS, fr} from 'date-fns/locale';
import {toZonedTime} from 'date-fns-tz';
import {COLORS, TIME_ZONE_ABIDJAN} from '../../constants';
import {setAlertMessageHeader} from '../../redux/features/alertmessage/alertMessageSlide';
import FlatButton from './FlatButton';
import Loading from './Loading';
import AlertMessageService from '../../services/AlertMessageService';

/**
 * Modale globale d'alerte : montée une seule fois à la racine de l'app, elle
 * s'affiche par-dessus l'écran courant dès que `alertMessage.openAlert`
 * passe à true (notification reçue ou ouverte).
 */
const AlertMessageModal = () => {
    const {t, i18n} = useTranslation();
    const dispatch = useDispatch();
    const {openAlert, dataNotification} = useSelector((state: any) => state.alertMessage);
    const scale = useRef(new Animated.Value(0.8)).current;

    // Détail complet de l'alerte, récupéré via /extra/alertmessage/{id}
    const [alertMessage, setAlertMessage] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const notificationMessage = dataNotification;
    // `message` peut arriver en objet ou en chaîne JSON selon la source
    // (FCM, liste de notifications). L'id du détail est `message.alertMessageId` :
    // `notification.id` est l'id de la notification (d'où l'ancien 404).
    const notificationContent = useMemo(() => {
        const raw = notificationMessage?.message;
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }
        return raw && typeof raw === 'object' ? raw : null;
    }, [notificationMessage?.message]);

    const alertMessageId =
        notificationContent?.alertMessageId ??
        notificationMessage?.alertMessageId ??
        notificationMessage?.alertmessageId ??
        notificationMessage?.idAlertMessage;

    // Repli sur le titre de la notification si le détail n'est pas disponible.
    const fallbackTitle: string = dataNotification?.title || '';

    const alertTitle: string = alertMessage?.nom || fallbackTitle;
    // Corps vide (ou détail introuvable) : message d'erreur, jamais de contenu technique.
    // Ordre : détail de l'alerte → `body` de la notification → message d'erreur.
    const alertBody: string =
        (alertMessage?.message || '').trim() ||
        (typeof dataNotification?.body === 'string' ? dataNotification.body.trim() : '') ||
        t('home.alert_load_error');

    const dateLabel = useMemo(() => {
        if (!dataNotification?.dateSent) return '';
        const date = toZonedTime(toDate(dataNotification.dateSent), TIME_ZONE_ABIDJAN);
        return format(date, 'PPp', {locale: i18n.language === 'en' ? enUS : fr});
    }, [dataNotification?.dateSent, i18n.language]);

    useEffect(() => {
        if (openAlert) {
            // Aide au diagnostic : structure réelle de l'alerte reçue
            console.log('🚨 Alerte affichée:', JSON.stringify(dataNotification), 'id détail:', alertMessageId);
            scale.setValue(0.8);
            Animated.spring(scale, {toValue: 1, friction: 5, tension: 80, useNativeDriver: true}).start();
        }
    }, [openAlert, scale]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!openAlert) {
            setAlertMessage(null);
            return;
        }
        if (alertMessageId === undefined || alertMessageId === null) return;

        let cancelled = false;
        setLoading(true);
        AlertMessageService.getAlertMessageById(alertMessageId)
            .then(response => {
                if (!cancelled) setAlertMessage(response);
            })
            .catch(error => console.log('Erreur chargement alerte:', error?.response?.status, error?.response?.data))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [openAlert, alertMessageId]);

    const handleClose = useCallback(() => {
        dispatch(setAlertMessageHeader(false));
    }, [dispatch]);

    if (!openAlert) return null;

    return (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <Animated.View style={[styles.card, {transform: [{scale}]}]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('home.alert_notification')}</Text>
                        <TouchableOpacity onPress={handleClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <MaterialIcons name="close" size={22} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loading}>
                            <Loading size="small" />
                        </View>
                    ) : (
                        <>
                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                {!!alertTitle && <Text style={styles.title}>{alertTitle}</Text>}
                                {!!dateLabel && (
                                    <Text style={styles.date}>{`${t('more.post_alert_message')} ${dateLabel}`}</Text>
                                )}
                                <Text style={styles.message}>{alertBody}</Text>
                            </ScrollView>

                            <View style={styles.footer}>
                                <FlatButton
                                    title={t('home.alert_notification_close')}
                                    fontWeight="400"
                                    fontSize={16}
                                    backgroundColor={COLORS.redIms}
                                    paddingVertical={12}
                                    borderRadius={20}
                                    onPress={handleClose}
                                />
                            </View>
                        </>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

export default AlertMessageModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    card: {
        maxHeight: '80%',
        padding: 15,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.secondary,
    },
    content: {
        flexGrow: 0,
        marginTop: 10,
    },
    title: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray,
        marginBottom: 6,
    },
    date: {
        textAlign: 'center',
        fontSize: 13,
        color: COLORS.gray,
        marginBottom: 10,
    },
    message: {
        color: COLORS.gray,
        textAlign: 'justify',
    },
    loading: {
        minHeight: 120,
        justifyContent: 'center',
    },
    footer: {
        marginTop: 20,
        marginBottom: 5,
    },
});
