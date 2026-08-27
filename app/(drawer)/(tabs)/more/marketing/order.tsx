import React, {useEffect, useState} from 'react';
import {ScrollView, View, Text, StyleSheet} from "react-native";
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
            if(selectedChild !== null) {
                setLoading(true);
                const userProductList = await MarketingService.getUserProduct(selectedChild.person.id);
                dispatch(setUserOderList(userProductList));
                setLoading(false);
            }
            setLoading(false);
        };
        fetchData().catch(error => {
            setLoading(false);
            console.log(error);
        });
    }, [selectedChild]);

    if(loading) {
        return <Loading />;
    }
    return (
        <View style={globalStyles.container}>
            <ScrollView style={styles.listContainer}>
                {(userOrderList.length === 0 || false) && (
                    <View>
                        <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                            {t('more.empty_product')}
                        </Text>
                    </View>
                )}

                {userOrderList.length > 0 &&
                    userOrderList.map((data: any, index: number) => {
                        return (
                            <UserProductItem
                                key={index}
                                data={data?.produit}
                            />
                        );
                    })}
            </ScrollView>
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
});
