import React, {useSyncExternalStore} from 'react';
import {ActivityIndicator, Modal, StyleSheet, View} from 'react-native';
import {COLORS} from '../../constants';
import {getNotificationLoading, subscribeNotificationLoading} from '../../services/notificationService';

/**
 * Indicateur de chargement global : visible entre le tap sur une notification
 * (liste du téléphone) et l'affichage de la page concernée.
 */
const NotificationLoadingOverlay = () => {
    const loading = useSyncExternalStore(subscribeNotificationLoading, getNotificationLoading, getNotificationLoading);

    if (!loading) return null;

    return (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                </View>
            </View>
        </Modal>
    );
};

export default NotificationLoadingOverlay;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    card: {
        padding: 22,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        elevation: 6,
    },
});
