import React, {memo, useMemo} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';

type CardProps = {
    borderRaduis?: number;
    marginBottom?: number;
    children?: React.ReactNode;
};

function Card({borderRaduis, marginBottom, children}: CardProps) {
    // ✅ Style mémoïsé : évite de créer un nouvel objet (spread + valeurs)
    // à chaque rendu. Sur l'écran de choix de profil, ce composant est
    // instancié une fois par enfant dans une liste : sans mémoïsation,
    // chaque re-rendu du parent recréait un objet de style par carte.
    const cardStyle = useMemo<ViewStyle>(() => ({
        ...styles.card,
        borderRadius: borderRaduis,
        marginBottom: marginBottom,
    }), [borderRaduis, marginBottom]);

    // ✅ Suppression du <View> interne "cardContent" : il n'appliquait
    // aucun style (les deux lignes étaient commentées) et n'ajoutait
    // qu'un niveau de hiérarchie supplémentaire à mesurer/layout par React
    // Native pour chaque carte affichée.
    return <View style={cardStyle}>{children}</View>;
}

// ✅ React.memo : si borderRaduis/marginBottom/children ne changent pas,
// la carte ne se re-rend pas quand son parent se re-rend (utile quand
// Card est répétée dans une liste, comme dans ProfileChoice).
export default memo(Card);

const styles = StyleSheet.create({
    card: {
        elevation: 3,
        backgroundColor: '#fff',
        shadowOffset: {width: 1, height: 1},
        shadowColor: '#333',
        shadowOpacity: 0.3,
        shadowRadius: 2,
        marginHorizontal: 4,
        marginVertical: 6,
    },
});
