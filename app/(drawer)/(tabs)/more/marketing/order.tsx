import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, View, Text, StyleSheet} from "react-native";
import {TMarketingProps} from "../../../../../lib/type/TMarketingProps";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import MarketingService from "../../../../../services/MarketingService";
import {setUserOderList} from "../../../../../redux/features/marketing/marketingSlice";
import {globalStyles} from "../../../../../style/Global";
import Loading from "../../../../../components/ui/Loading";
import UserProductItem from "../../../../../components/tabs/more/marketing/UserProductItem";


function Order({navigation}: TMarketingProps) {
    const {t} = useTranslation();
    const {userOrderList} = useSelector((state: any) => state.marketing);
    const {selectedChild} = useSelector((state: any) => state.child);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchData = async () => {
            if (selectedChild !== null) {
                const userProductList = await MarketingService.getUserProduct(selectedChild.person.id);
                dispatch(setUserOderList(userProductList));
            }
            setLoading(false);
        };
        fetchData().catch(error => {
            setLoading(false);
            console.log(error);
        });
    }, [selectedChild]);

    const renderOrderItem = useCallback(({item}: {item: any}) => (
        <UserProductItem data={item?.produit} />
    ), []);
    // ✅ Utilise l'id reel de la commande plutot que l'index du tableau
    // comme cle : avec l'index, un reordonnancement/ajout/suppression dans
    // userOrderList pouvait faire reutiliser le mauvais composant pour la
    // mauvaise commande (React se base sur la cle pour la reconciliation).
    const keyExtractorOrder = useCallback((item: any, index: number) => (
        item?.id != null ? String(item.id) : `order-${index}`
    ), []);
    const ListEmptyComponent = useCallback(() => (
        <View>
            <Text style={styles.emptyText}>
                {t('more.empty_product')}
            </Text>
        </View>
    ), [t]);

    if(loading) {
        return <Loading />;
    }
    return (
        <View style={globalStyles.container}>
            <FlatList
                style={styles.listContainer}
                data={userOrderList}
                renderItem={renderOrderItem}
                keyExtractor={keyExtractorOrder}
                ListEmptyComponent={ListEmptyComponent}
            />
        </View>
    );
}

export default Order;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        padding: 10,
        paddingTop: 20,
    },
    emptyText: {
        flex: 1,
        textAlign: 'center',
    },
});
