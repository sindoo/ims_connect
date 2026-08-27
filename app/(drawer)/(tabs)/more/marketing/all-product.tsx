import React, {useEffect, useState} from 'react';
import {
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {TMarketing, TMarketingProps} from "../../../../../lib/type/TMarketingProps";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import MarketingService from "../../../../../services/MarketingService";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {globalStyles} from "../../../../../style/Global";
import SearchBox from "../../../../../components/ui/SearchBox";
import {COLORS} from "../../../../../constants";
import ProductItem from "../../../../../components/tabs/more/marketing/ProductItem";


function ProductList({navigation}: TMarketingProps) {
    const {t} = useTranslation();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [productListData, setProductListData] = useState<any>([]);
    const [productSearchList, setProductSearchList] = useState([]);
    const {userToken} = useSelector((state:any) => state.user);
    const dispatch = useDispatch();

    const handleTextChange = (text:string) => {
        setSearch(text);
    }
    const handleSubmitSearch = () => {
        if (search !== '') {
            setLoading(true);
            let filterProductList = productListData.filter(function (item: any) {
                const itemLowerCase: any = item.nom;
                return itemLowerCase.toLowerCase().includes(search.trim().toLowerCase());
            });
            setProductSearchList(filterProductList);
            setLoading(false);
        } else {
            setProductSearchList(productListData);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setProductSearchList(productListData);
    };

    useEffect(() => {
        const fetchData = async () => {
            //setLoading(true);
            try {
                const productListList = await MarketingService.getAllProduct();
                setProductListData(productListList);
                setProductSearchList(productListList);

                setLoading(false);

                checkTokenExpired(userToken, dispatch);
            }
            catch (error) {
                console.log(error);
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={globalStyles.container}>
                <SearchBox
                    paddingHorizontal={10}
                    searchValue={search}
                    setSearchValue={setSearch}
                    handleClearSearch={handleClearSearch}
                    handleSubmitSearch={handleSubmitSearch}
                />
                <ScrollView style={styles.listContainer}>
                    {(productSearchList.length === 0 || false) && (
                        <View>
                            <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                {t('more.empty_product')}
                            </Text>
                        </View>
                    )}
                    {productSearchList.length > 0 &&
                        productSearchList.map((product: TMarketing) => {
                            return (
                                <ProductItem
                                    key={product.id}
                                    data={product}
                                />
                            );
                        })}
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default ProductList;

const styles = StyleSheet.create({
    searchContainer: {
        padding: 10,
    },
    searchBar: {
        flexDirection: 'row',
        marginTop: 10,
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: COLORS.grayVeryLight,
        borderRadius: 6,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 3,
        fontSize: 16,
        borderRadius: 0,
        color: COLORS.gray,
        marginLeft: 4,
    },
    listContainer: {
        flex: 1,
        padding: 10,
        paddingTop: 15,
    },
});
