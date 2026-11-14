import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {COLORS} from '../../constants';
import {getOfflineReason, isOffline, OfflineReason, startNetworkMonitoring, subscribeConnectivity} from '../../api/connectivity';
import {pingServer} from '../../api/ApiManager';

// Intervalle de vérification du retour de la connexion, tant que le bandeau est affiché
const RETRY_INTERVAL_MS = 10000;

// Bandeau de connexion, placé dans le layout racine comme UpdateBanner :
// - "Pas de connexion Internet" dès que le téléphone perd le réseau (NetInfo)
//   ou qu'un appel API reste sans réponse sans réseau ;
// - "Serveur momentanément injoignable" si le réseau fonctionne mais que le
//   serveur ne répond pas.
// Il disparaît tout seul dès que le serveur répond de nouveau. Ne rend rien
// (0px) quand tout fonctionne.
function OfflineBanner() {
    const insets = useSafeAreaInsets();
    const {t} = useTranslation();
    const [offline, setOfflineState] = useState(isOffline());
    const [reason, setReason] = useState<OfflineReason>(getOfflineReason());

    useEffect(() => subscribeConnectivity((value, newReason) => {
        setOfflineState(value);
        setReason(newReason);
    }), []);

    // Détection instantanée de la perte / du retour du réseau
    useEffect(() => startNetworkMonitoring(() => {
        pingServer();
    }), []);

    // Tant qu'on est hors connexion, on vérifie régulièrement si elle est revenue
    useEffect(() => {
        if (!offline) return;
        const timer = setInterval(() => {
            pingServer();
        }, RETRY_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [offline]);

    if (!offline) return null;

    return (
        <View
            style={[styles.container, {paddingTop: insets.top + 8}]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            <MaterialIcons name={reason === 'server' ? 'cloud-off' : 'wifi-off'} size={18} color={COLORS.white} />
            <Text style={styles.text}>
                {reason === 'server' ? t('offlineBanner.server') : t('offlineBanner.message')}
            </Text>
        </View>
    );
}

export default OfflineBanner;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 8,
        paddingHorizontal: 20,
        backgroundColor: COLORS.gray,
    },
    text: {
        color: COLORS.white,
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
});
