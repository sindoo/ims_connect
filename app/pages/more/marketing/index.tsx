import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Keyboard, ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {Image} from "expo-image";
import {TProductDetailsProps} from "../../../../lib/type/TMarketingProps";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import MarketingService from "../../../../services/MarketingService";
import {setUserOderList} from "../../../../redux/features/marketing/marketingSlice";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";
import {globalStyles} from "../../../../style/Global";
import FlatButton from "../../../../components/ui/FlatButton";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import {useLocalSearchParams} from "expo-router";
import Loading from "../../../../components/ui/Loading";

import {apiErrorMessage} from '../../../../api/ApiManager';
function ProductDetails({route, snackbarShowMessage}: TProductDetailsProps) {
    // @ts-ignore
    //const {data} = route.params;
    const [data, setData] = useState(null);
    const { productId} = useLocalSearchParams();
    const {t} = useTranslation();
    // ✅ Memoise le formatage : sans ça, "new Intl.NumberFormat(...)" etait
    // recree et le montant reformate a CHAQUE rendu (donc a chaque frappe
    // dans le champ quantite, qui met a jour un state sans rapport avec le
    // prix), au lieu d'une seule fois quand data.prix change reellement.
    const amount = useMemo(
        () => new Intl.NumberFormat('fr-FR').format(data !== null ? data.prix : 0),
        [data?.prix]
    );
    const [status, setStatus] = useState(false);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user} = useSelector((state: any) => state.user);
    const [quantity, setQuantity] = useState<string>('1');
    const dispatch = useDispatch();

    const handleQuantity = useCallback((text: string) => {
        setQuantity(text);
    }, []);

    // ✅ BUG CORRIGE : "setStatus(true)" etait pose avant la validation de la
    // quantite, mais seul le chemin "quantite valide" appelait
    // "setStatus(false)" a la fin. Si l'utilisateur saisissait une quantite
    // invalide (0, negative, ou superieure au stock), aucune erreur n'etait
    // levee (donc le catch ne se declenchait pas non plus) et "status"
    // restait bloque a "true" pour toujours : le bouton "Commander"
    // devenait alors definitivement desactive (disabled={status}), sans
    // aucun moyen de s'en sortir hormis quitter l'ecran. Restructure avec
    // un "finally" pour garantir que "status" est toujours remis a false.
    const handleOrder = useCallback(async () => {
        if (selectedChild === null || !data) return;
        setStatus(true);
        try {
            const parentId = user?.userDetails?.personDetails?.person?.id;
            const orderQuantity = parseInt(quantity, 10);
            if (orderQuantity > 0 && orderQuantity <= data?.quantite) {
                const dataOrder = {
                    product: data,
                    produitId: data.id,
                    quantite: orderQuantity,
                };
                await MarketingService.registerOrder(selectedChild.person.id, parentId, dataOrder);
                const userProductList = await MarketingService.getUserProduct(selectedChild.person.id);
                dispatch(setUserOderList(userProductList));
                snackbarShowMessage(t('snackBar.sb_succes_save'));
            }
        } catch (error) {
            snackbarShowMessage(apiErrorMessage(error, t('snackBar.sb_error')));
        } finally {
            setStatus(false);
        }
    }, [selectedChild, user, quantity, data, dispatch, t, snackbarShowMessage]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await  MarketingService.getProductById(productId.toString());
                setData(response);
            }
            catch (error) {
                console.log(error);
            }
        }

        fetchData().catch(error => {
            console.log(error)
        });
    }, [productId]);

    // ✅ Avant : tant que "data" etait null (pendant le chargement initial),
    // l'ecran n'affichait strictement RIEN (pas de <Loading/>, contrairement
    // a tous les autres ecrans de l'appli) - un ecran blanc le temps du
    // fetch. Ajout d'un indicateur de chargement coherent avec le reste de
    // l'appli.
    if (!data) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.container}>
                <View style={styles.topContent}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={
                                data?.photo !== '' && data?.photo !== null
                                    ? {uri: `${BASEURL_IMG}/${data?.photo}`}
                                    : IMAGES.noBookImage
                            }
                            contentFit="cover"
                            style={styles.imageCover}
                        />
                    </View>
                    <Text style={styles.titleCentered}>
                        {data?.nom}
                    </Text>
                    <View style={styles.rowSpaced}>
                        <View style={styles.flex1}>
                            <Text style={styles.labelSecondary}>
                                {t('more.mini_club_price')} :
                            </Text>
                        </View>
                        <View style={styles.flex3}>
                            <Text>{amount} FCFA</Text>
                        </View>
                    </View>
                    {data?.description !== '' && data?.description !== null && (
                        <>
                            <Text style={styles.descriptionLabel}>
                                {t('more.mini_club_description')} :
                            </Text>
                            <Text style={styles.description}>{data?.description}</Text>
                        </>
                    )}

                    <View style={styles.rowSpaced}>
                        <View style={styles.quantityLabelWrapper}>
                            <Text style={styles.labelSecondary}>
                                {t('more.product_quantity')} :
                            </Text>
                        </View>
                        <View style={styles.flex3}>
                            <TextInput
                                style={styles.input}
                                keyboardType={'numeric'}
                                onChangeText={handleQuantity}
                                value={quantity}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.registeredList}>
                    <View style={styles.buttonWrapper}>
                        <FlatButton
                            title={t('more.order_product')}
                            fontWeight="400"
                            fontSize={16}
                            backgroundColor={COLORS.secondary}
                            paddingVertical={12}
                            borderRadius={20}
                            onPress={handleOrder}
                            disabled={status}
                        />
                    </View>
                </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}

export default withSnackbar(ProductDetails);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    topContent: {
        marginTop: 15,
        paddingHorizontal: 15,
    },
    imageContainer: {
        marginBottom: 20,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        overflow: 'hidden',
    },
    imageCover: {
        width: '100%',
        height: 205,
        aspectRatio: 135 / 76,
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
    },
    participant: {
        flex: 1,
        paddingTop: 10,
    },
    input: {
        borderColor: COLORS.grayMedium,
        borderWidth: 1,
        width: 50,
        height: 30,
        padding: 0,
        paddingLeft: 10,
        color: COLORS.gray,
    },
    titleCentered: {
        ...globalStyles.titleH2,
        textAlign: 'center',
    },
    rowSpaced: {
        flexDirection: 'row',
        marginTop: 10,
    },
    flex1: {
        flex: 1,
    },
    flex3: {
        flex: 3,
    },
    quantityLabelWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    labelSecondary: {
        color: COLORS.secondary,
    },
    descriptionLabel: {
        color: COLORS.secondary,
        marginTop: 5,
    },
    description: {
        textAlign: 'justify',
    },
    buttonWrapper: {
        marginTop: 15,
        marginBottom: 20,
        paddingHorizontal: 15,
    },
});
