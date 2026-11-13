import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {FlatList, Text, TouchableOpacity, View, StyleSheet} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {globalStyles} from "../style/Global";
import ViewThemed from "../components/ui/ViewThemed";
import {COLORS, IMAGES, ROUTES} from "../constants";
import Card from "../components/ui/Card";
import {BASEURL_IMG} from "../api/appUrl";
import {changeChild} from "../redux/features/child/childSlice";
import {useRouter} from "expo-router";
import {Image} from "expo-image";

type Child = {
    person?: { id?: number | string; nom?: string; prenom?: string; photo?: string | null };
    eleves?: Array<{ classe?: { nom?: string } }>;
};

// ✅ Carte extraite et mémoïsée : ne se re-rend pas quand la liste des
// enfants change de référence mais que cet élément précis est inchangé
const ChildCard = React.memo(function ChildCard({
                                                    child,
                                                    onPress,
                                                }: {
    child: Child;
    onPress: (child: Child) => void;
}) {
    const handlePress = useCallback(() => onPress(child), [onPress, child]);

    const photo = child?.person?.photo;
    const imageSource = photo ? {uri: `${BASEURL_IMG}/${photo}`} : IMAGES.avatar;

    return (
        <View style={styles.profileItemContainer}>
            <Card borderRaduis={6}>
                <TouchableOpacity onPress={handlePress}>
                    <View style={styles.profileItem}>
                        <View style={styles.profileImage}>
                            <Image
                                source={imageSource}
                                contentFit="cover"
                                style={styles.profileImageCover}
                                cachePolicy="memory-disk"
                                transition={100}
                            />
                        </View>
                        <Text style={styles.profileItemTitle}>
                            {child?.person?.nom} {child?.person?.prenom}
                        </Text>
                        <Text style={styles.profileClasse}>
                            {child.eleves?.[0]?.classe?.nom}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Card>
        </View>
    );
});

const ProfileChoice = () => {
    const dispatch = useDispatch();
    const {children} = useSelector((state: any) => state.child);
    const router = useRouter();

    // ✅ Fonction stable : ne recrée pas une nouvelle closure pour chaque
    // carte à chaque rendu du parent
    const handleSelectChildProfile = useCallback((child: any) => {
        dispatch(changeChild(child));
        router.push(ROUTES.HOME_DRAWER);
    }, [dispatch, router]);

    const renderItem = useCallback(({item}: {item: Child}) => (
        <ChildCard child={item} onPress={handleSelectChildProfile} />
    ), [handleSelectChildProfile]);

    const keyExtractor = useCallback((item: Child, index: number) => (
        String(item?.person?.id ?? index)
    ), []);

    const visibleChildren = useMemo(
        () => (children && children.length > 1 ? children : []),
        [children]
    );

    // ✅ Un seul enfant : pas de choix à faire, on sélectionne directement
    // son profil et on passe à l'accueil (sinon l'écran restait vide).
    const autoSelectedRef = useRef(false);
    useEffect(() => {
        if (children?.length === 1 && !autoSelectedRef.current) {
            autoSelectedRef.current = true;
            dispatch(changeChild(children[0]));
            router.replace(ROUTES.HOME_DRAWER);
        }
    }, [children, dispatch, router]);

    // ✅ Plus d'état "loading" factice : il n'y avait aucune opération
    // asynchrone derrière, seulement un re-rendu inutile qui retardait
    // l'affichage du contenu d'une frame.
    if (visibleChildren.length === 0) {
        return <ViewThemed style={globalStyles.container} />;
    }

    return (
        <ViewThemed style={globalStyles.container}>
            <FlatList
                data={visibleChildren}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                style={styles.profileContainer}
                contentContainerStyle={styles.containerProfileChoice}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews
            />
        </ViewThemed>
    );
};

export default ProfileChoice;

const styles = StyleSheet.create({
    profileContainer: {
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: '5%',
    },
    profileItemContainer: {
        width: 138,
        marginRight: 10,
        marginBottom: 20,
    },
    containerProfileChoice: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileItem: {
        width: 130,
        minHeight: 155,
        backgroundColor: COLORS.grayExtraLight,
        padding: 5,
    },
    profileImage: {
        alignItems: 'center',
        overflow: 'hidden',
        padding: 5,
    },
    profileImageCover: {
        width: 80,
        height: 80,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    profileItemTitle: {
        textAlign: 'center',
        fontWeight: '600',
        color: COLORS.gray,
    },
    profileClasse: {
        textAlign: 'center',
        color: COLORS.gray,
        textTransform: 'capitalize',
    },
});
