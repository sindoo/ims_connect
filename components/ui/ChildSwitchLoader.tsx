import React, {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {ActivityIndicator, Modal, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {COLORS} from '../../constants';
import {getPendingRequests} from '../../api/activity';
import {getNotificationLoading, subscribeNotificationLoading} from '../../services/notificationService';

// Durée minimale d'affichage (évite un simple flash)
const MIN_VISIBLE_MS = 600;
// Sécurité : le chargeur ne reste jamais plus longtemps que ça
const MAX_VISIBLE_MS = 8000;
const CHECK_INTERVAL_MS = 150;
// Nombre de vérifications consécutives sans requête en cours avant de masquer
// (laisse le temps à l'écran de lancer ses appels après le changement)
const IDLE_CHECKS_TO_HIDE = 2;

/**
 * Indicateur de chargement global affiché quand l'utilisateur change d'enfant,
 * quelle que soit la page : il reste visible tant que les données de l'écran
 * (requêtes API en cours) se chargent, puis disparaît.
 * Il bloque aussi les interactions pendant ce temps, pour éviter d'agir sur
 * des données encore affichées de l'enfant précédent.
 */
const ChildSwitchLoader = () => {
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const childId = selectedChild?.id ?? null;
    const childFirstName = selectedChild?.person?.prenom ?? '';
    const previousChildIdRef = useRef<any>(childId);
    const [visible, setVisible] = useState(false);
    // Le chargement des notifications a déjà son propre indicateur
    const notificationLoading = useSyncExternalStore(
        subscribeNotificationLoading,
        getNotificationLoading,
        getNotificationLoading,
    );

    useEffect(() => {
        const previousId = previousChildIdRef.current;
        previousChildIdRef.current = childId;

        // Premier choix d'enfant (connexion) ou même enfant mis à jour : rien à faire
        if (previousId == null || childId == null || String(previousId) === String(childId)) {
            return;
        }

        setVisible(true);
        const startedAt = Date.now();
        let idleChecks = 0;

        const timer = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            idleChecks = getPendingRequests() === 0 ? idleChecks + 1 : 0;

            if ((elapsed >= MIN_VISIBLE_MS && idleChecks >= IDLE_CHECKS_TO_HIDE) || elapsed >= MAX_VISIBLE_MS) {
                clearInterval(timer);
                setVisible(false);
            }
        }, CHECK_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [childId]);

    if (!visible || notificationLoading) return null;

    return (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
            <View style={styles.backdrop} accessibilityRole="progressbar">
                <View style={styles.card}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                    <Text style={styles.text}>
                        {childFirstName
                            ? t('childSwitch.loading_child', {name: childFirstName})
                            : t('childSwitch.loading')}
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

export default ChildSwitchLoader;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    card: {
        alignItems: 'center',
        paddingVertical: 22,
        paddingHorizontal: 28,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        elevation: 6,
        maxWidth: '80%',
    },
    text: {
        marginTop: 12,
        color: COLORS.gray,
        fontSize: 14,
        textAlign: 'center',
    },
});
