import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import MiniClubService from '../../../../services/MiniClubService';
import {
    setChildMiniClubList,
    updateMiniClubStatus
} from '../../../../redux/features/club/miniClubSlice';
import { BASEURL_IMG } from '../../../../api/appUrl';
import { globalStyles } from '../../../../style/Global';
import { COLORS } from '../../../../constants';
import FlatButton from '../../../../components/ui/FlatButton';
import RegisteredChildrenItem from '../../../../components/tabs/more/club/RegisteredChildrenItem';

// Constantes
const NOTIFICATION_DURATION = 4000;
const MAX_PARTICIPANTS_DISPLAY = 200;

function MiniClubDetails() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { registrationStatus, miniClubId } = useLocalSearchParams();

    // Sélecteurs memoïsés
    const { selectedChild } = useSelector((state: any) => state.child);
    const { user } = useSelector((state: any) => state.user);
    const miniClubUpdateSignal = useSelector((state: any) => state.miniclub.updateMiniClubStatus);

    const [miniClubDetails, setMiniClubDetails] = useState(null);
    const [registeredChildList, setRegisteredChildList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // États pour le Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const abortControllerRef = useRef<AbortController | null>(null);
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fonction pour afficher le snackbar
    const showSnackbar = useCallback((message: string, type: 'success' | 'error' = 'success', duration?: number) => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);

        // Si une durée est spécifiée, fermer automatiquement après
        if (duration) {
            setTimeout(() => {
                setSnackbarVisible(false);
            }, duration);
        }
    }, []);

    // Nettoyage des timeouts et requêtes
    useEffect(() => {
        return () => {
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Redirection avec délai
    const scheduleRedirectBack = useCallback(() => {
        if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
            router.back();
        }, NOTIFICATION_DURATION);
    }, []);

    // Données formatées memoïsées
    const formattedData = useMemo(() => {
        if (!miniClubDetails) return null;

        return {
            amount: new Intl.NumberFormat('fr-FR').format(miniClubDetails.prix),
            dateDebut: format(miniClubDetails.dateDebut, 'dd/MM/yyyy HH:mm'),
            dateFin: format(miniClubDetails.dateFin, 'dd/MM/yyyy HH:mm'),
        };
    }, [miniClubDetails]);

    // Vérifications memoïsées
    // NOTE : le "?? false" d'origine ne servait a rien - une comparaison
    // avec ">" renvoie toujours un booleen (jamais null/undefined), meme
    // quand miniClubDetails est undefined (undefined > number vaut false).
    // Supprime, comportement strictement identique.
    const isSubscriptionActive = useMemo(() => {
        return miniClubDetails?.dateFin > Date.now();
    }, [miniClubDetails]);

    // Statut calculé depuis les données réelles (et non le paramètre de route,
    // qui peut être obsolète ou différent selon l'origine de la navigation)
    const isChildRegistered = useMemo(() => {
        if (!miniClubDetails || !selectedChild?.person?.id) return registrationStatus === '1';
        return !!MiniClubService.getRegistrationInfo(selectedChild.person.id, miniClubDetails);
    }, [miniClubDetails, selectedChild, registrationStatus]);

    const isRegistrationActive = useMemo(() => {
        return isChildRegistered && isSubscriptionActive;
    }, [isChildRegistered, isSubscriptionActive]);

    const isFull = useMemo(() => {
        if (!miniClubDetails) return false;
        return miniClubDetails.inscritMiniClubs?.length >= miniClubDetails.placeLimit;
    }, [miniClubDetails]);

    // Liste des participants rendue de manière optimisée
    const renderedParticipants = useMemo(() => {
        const list = registeredChildList.slice(0, MAX_PARTICIPANTS_DISPLAY);
        return list.map((child: any) => (
            <RegisteredChildrenItem
                key={child?.person?.id || child?.id || Math.random()}
                data={child}
            />
        ));
    }, [registeredChildList]);

    // Charger les données
    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }

        try {
            // Annuler la requête précédente
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const miniClubDetailsSelected = await MiniClubService.getMiniClubById(
                miniClubId,
                abortControllerRef.current.signal
            );

            if (!miniClubDetailsSelected) {
                showSnackbar(t('more.mini_club_not_found'), 'error', NOTIFICATION_DURATION);
                return;
            }

            // Traiter les inscriptions - uniquement si nécessaire
            let registeredList = [];
            if (miniClubDetailsSelected.inscritMiniClubs?.length > 0) {
                registeredList = await MiniClubService.getAllRegistration(
                    miniClubDetailsSelected.inscritMiniClubs
                );
            }

            setRegisteredChildList(registeredList);
            setMiniClubDetails(miniClubDetailsSelected);

        } catch (error: any) {
            if (error?.name !== 'AbortError' && !error?.message?.includes('canceled')) {
                console.error('Error loading mini club details:', error);
                showSnackbar(t('common.error_loading'), 'error', NOTIFICATION_DURATION);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [miniClubId, showSnackbar, t]);

    // Rafraîchissement
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadData(false);
    }, [loadData]);

    // Inscription
    const handleSubscribe = useCallback(async () => {
        if (!selectedChild || !user || !miniClubDetails) {
            showSnackbar(t('common.error_occurred'), 'error', NOTIFICATION_DURATION);
            return;
        }

        setIsSubmitting(true);
        try {
            await MiniClubService.subscription(
                selectedChild.person.id,
                user,
                miniClubDetails
            );

            // Mettre à jour le cache
            const miniClubListFiltered = await MiniClubService.getChildClassMiniClubData(selectedChild);
            dispatch(setChildMiniClubList(miniClubListFiltered));
            dispatch(updateMiniClubStatus(Date.now()));

            showSnackbar(t('more.subscription_success'), 'success', NOTIFICATION_DURATION);
            scheduleRedirectBack();

        } catch (error) {
            console.error('Subscription error:', error);
            showSnackbar(t('more.subscription_error'), 'error', NOTIFICATION_DURATION);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedChild, user, miniClubDetails, dispatch, showSnackbar, t, scheduleRedirectBack]);

    // Désinscription
    const handleUnsubscribe = useCallback(async () => {
        if (!selectedChild || !miniClubDetails) {
            showSnackbar(t('common.error_occurred'), 'error', NOTIFICATION_DURATION);
            return;
        }

        setIsSubmitting(true);
        try {
            const subscriptionInfo = MiniClubService.getRegistrationInfo(
                selectedChild.person.id,
                miniClubDetails
            );

            if (subscriptionInfo) {
                await MiniClubService.unSubscription(subscriptionInfo);
            }

            // Mettre à jour le cache
            const miniClubListFiltered = await MiniClubService.getChildClassMiniClubData(selectedChild);
            dispatch(setChildMiniClubList(miniClubListFiltered));
            dispatch(updateMiniClubStatus(Date.now()));

            showSnackbar(t('more.unsubscription_success'), 'success', NOTIFICATION_DURATION);
            scheduleRedirectBack();

        } catch (error) {
            console.error('Unsubscription error:', error);
            showSnackbar(t('more.unsubscription_error'), 'error', NOTIFICATION_DURATION);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedChild, miniClubDetails, dispatch, showSnackbar, t, scheduleRedirectBack]);

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Rechargement silencieux au retour sur l'écran et à chaque signal
    // (notification reçue, inscription/désinscription)
    const firstFocusRef = useRef(true);
    useFocusEffect(
        useCallback(() => {
            if (firstFocusRef.current) {
                firstFocusRef.current = false;
                return;
            }
            loadData(false);
        }, [loadData])
    );

    const firstSignalRef = useRef(true);
    useEffect(() => {
        if (firstSignalRef.current) {
            firstSignalRef.current = false;
            return;
        }
        loadData(false);
    }, [miniClubUpdateSignal]);

    // Couleur du snackbar selon le type
    const snackbarColor = snackbarType === 'success' ?  COLORS.gray : COLORS.redIms;

    // Affichage du chargement
    if (loading) {
        return <Loading />;
    }

    if (!miniClubDetails) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('more.mini_club_not_found')}</Text>
            </View>
        );
    }

    // Déterminer le bouton à afficher
    const renderActionButton = () => {
        if (isRegistrationActive && !isFull) {
            return (
                <FlatButton
                    title={t('more.unsubscribe')}
                    fontWeight="400"
                    fontSize={16}
                    backgroundColor={COLORS.redIms}
                    paddingVertical={12}
                    borderRadius={20}
                    onPress={handleUnsubscribe}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                />
            );
        }

        if (isSubscriptionActive && !isFull) {
            return (
                <FlatButton
                    title={t('more.subscribe')}
                    fontWeight="400"
                    fontSize={16}
                    backgroundColor={COLORS.secondary}
                    paddingVertical={12}
                    borderRadius={20}
                    onPress={handleSubscribe}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                />
            );
        }

        if (isFull && isSubscriptionActive) {
            return (
                <FlatButton
                    title={t('more.mini_club_full')}
                    fontWeight="400"
                    fontSize={16}
                    backgroundColor={COLORS.gray}
                    paddingVertical={12}
                    borderRadius={20}
                    disabled={true}
                    onPress={() => {}}
                />
            );
        }

        // Activité terminée
        return (
            <>
                {/*<FlatButton
                    title={t('more.mini_club_finished')}
                    fontWeight="400"
                    fontSize={16}
                    backgroundColor={COLORS.gray}
                    paddingVertical={12}
                    borderRadius={20}
                    disabled={true}
                    onPress={() => {}}
                />*/}
            </>
        );
    };

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.secondary]}
                        tintColor={COLORS.secondary}
                    />
                }
            >
                {/* Contenu principal */}
                <View style={styles.topContent}>
                    {miniClubDetails.uriPublicite && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: `${BASEURL_IMG}/${miniClubDetails.uriPublicite}` }}
                                contentFit="cover"
                                style={styles.imageCover}
                                transition={300}
                            />
                        </View>
                    )}

                    <Text style={[globalStyles.titleH2, styles.title]}>
                        {miniClubDetails.title}
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('more.mini_club_price')} :</Text>
                        <Text style={styles.value}>{formattedData?.amount} FCFA</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('more.mini_club_date')} :</Text>
                        <Text style={styles.value}>
                            {formattedData?.dateDebut} - {formattedData?.dateFin}
                        </Text>
                    </View>

                    {miniClubDetails.details && (
                        <>
                            <Text style={styles.descriptionLabel}>
                                {t('more.mini_club_description')} :
                            </Text>
                            <Text style={styles.description}>
                                {miniClubDetails.details}
                            </Text>
                        </>
                    )}
                </View>

                {/* Liste des participants */}
                <View style={styles.registeredList}>
                    {registeredChildList.length > 0 && (
                        <>
                            <View style={styles.titleContainer}>
                                <Text style={styles.titleList}>
                                    {t('more.mini_club_registeredChild')} (
                                    {miniClubDetails.inscritMiniClubs?.length || 0}/{miniClubDetails.placeLimit})
                                </Text>
                            </View>

                            <ScrollView
                                style={styles.participantsContainer}
                                showsVerticalScrollIndicator={true}
                            >
                                {renderedParticipants}
                            </ScrollView>
                        </>
                    )}

                    {/* Boutons d'action */}
                    <View style={styles.buttonContainer}>
                        {renderActionButton()}
                    </View>
                </View>
            </ScrollView>

            {/* Snackbar react-native-paper */}
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={NOTIFICATION_DURATION}
                style={[styles.snackbar, { backgroundColor: snackbarColor }]}
                wrapperStyle={styles.snackbarWrapper}
                theme={{ colors: { surface: snackbarColor } }}
            >
                <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            </Snackbar>
        </>
    );
}

// Composant de chargement optimisé
function Loading() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
    );
}

export default MiniClubDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    topContent: {
        marginTop: 15,
        paddingHorizontal: 15,
    },
    imageContainer: {
        marginBottom: 20,
        overflow: 'hidden',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        backgroundColor: COLORS.grayVeryLight,
    },
    imageCover: {
        width: '100%',
        height: 205,
        aspectRatio: 135 / 76,
    },
    title: {
        textAlign: 'center',
        marginBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    label: {
        flex: 1,
        color: COLORS.secondary,
        fontWeight: '500',
    },
    value: {
        flex: 3,
        color: COLORS.gray,
    },
    descriptionLabel: {
        color: COLORS.secondary,
        marginTop: 10,
        fontWeight: '500',
    },
    description: {
        textAlign: 'justify',
        color: COLORS.gray,
        marginTop: 2,
        lineHeight: 20,
    },
    registeredList: {
        marginTop: 15,
    },
    titleContainer: {
        borderBottomColor: COLORS.grayMedium,
        borderBottomWidth: 1,
        marginHorizontal: 15,
        paddingBottom: 10,
    },
    titleList: {
        color: COLORS.secondary,
        fontWeight: '500',
    },
    participantsContainer: {
        paddingHorizontal: 15,
        paddingTop: 5,
        maxHeight: 200,
    },
    buttonContainer: {
        marginTop: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.white,
    },
    errorText: {
        color: COLORS.gray,
        fontSize: 16,
        textAlign: 'center',
    },
    snackbar: {
        backgroundColor: COLORS.gray,
        marginBottom: 20,
        marginHorizontal: 15,
        zIndex: 999,
        elevation: 4,
    },
    snackbarWrapper: {
        bottom: 0,
        position: 'absolute',
    },
    snackbarText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
