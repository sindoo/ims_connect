import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";

function RegisteredChildrenItem({data}: any) {
    return (
        <View style={styles.itemRegisteredContainer}>
            <Image
                source={
                    data?.person?.photo !== null && data?.person?.photo !== ''
                        ? {uri: `${BASEURL_IMG}/${data?.person?.photo}`}
                        : IMAGES.avatar
                }
                resizeMode="cover"
                style={styles.avatarImage}
            />
            <View style={styles.textContainer}>
                <Text style={styles.nameText}>
                    {data?.person?.nom} {data?.person?.prenom}
                </Text>
                {/* BUG corrige : "data?.eleves[0].classe.nom" ne protegeait que
              l'acces a "eleves" lui-meme. Quand "eleves" est un tableau
              vide (enfant sans inscription de classe active), "eleves[0]"
              vaut undefined et ".classe.nom" plantait
              (TypeError: Cannot read property 'classe' of undefined).
              Chainage optionnel complet jusqu'au bout : si une etape
              manque, le texte est simplement vide au lieu de crasher. */}
                <Text style={styles.classeText}>{data?.eleves?.[0]?.classe?.nom}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    itemRegisteredContainer: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 10,
    },
    avatarImage: {
        width: 40,
        height: 40,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        marginRight: 15,
        borderColor: COLORS.grayLight,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        color: COLORS.gray,
        fontWeight: '600',
    },
    classeText: {
        color: COLORS.gray,
    },
});

export default React.memo(RegisteredChildrenItem);
