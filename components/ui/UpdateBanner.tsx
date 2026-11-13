import React, {useEffect, useState} from 'react';
import {Linking, Pressable, StyleSheet, Text} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {COLORS} from '../../constants';
import AppUpdateService from '../../services/AppUpdateService';

type UpdateInfo = {latestVersion: string; storeUrl: string};

// Bandeau "mise à jour disponible", placé dans le layout racine
// (app/_layout.tsx) juste au-dessus d'AppNav, donc tout en haut de l'écran
// physique — d'où l'usage de useSafeAreaInsets pour ajouter le padding
// nécessaire et ne pas passer sous l'encoche/la status bar. Ne rend rien
// tant qu'aucune mise à jour n'est détectée (voir
// AppUpdateService.checkForAppUpdate) : pas de flash ni de place réservée
// à vide quand l'app est déjà à jour.
function UpdateBanner() {
    const insets = useSafeAreaInsets();
    const {t} = useTranslation();
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

    useEffect(() => {
        // "isMounted" évite un setState après démontage si le composant
        // disparaissait avant la fin de la vérification (peu probable ici
        // puisque le layout racine ne se démonte jamais, mais reste une
        // sécurité peu coûteuse).
        let isMounted = true;
        AppUpdateService.checkForAppUpdate().then((info) => {
            if (isMounted) setUpdateInfo(info);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    if (!updateInfo) return null;

    return (
        <Pressable
            // "insets.top" pousse le contenu sous l'encoche/la status bar (le
            // bandeau est le tout premier élément affiché à l'écran, avant même
            // AppNav — voir _layout.tsx). Le "+ 10" garde le même espacement que
            // "paddingVertical: 10" prévoyait déjà pour le paddingTop, sans le
            // perdre en écrasant la valeur du StyleSheet.
            style={[styles.container, {paddingTop: insets.top + 10}]}
            onPress={() => Linking.openURL(updateInfo.storeUrl)}>
            <MaterialIcons name="system-update" size={20} color={COLORS.white} />
            <Text style={styles.text}>
                {t('updateBanner.message', {version: updateInfo.latestVersion})}
            </Text>
        </Pressable>
    );
}

export default UpdateBanner;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: COLORS.secondary,
    },
    text: {
        color: COLORS.white,
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
});
