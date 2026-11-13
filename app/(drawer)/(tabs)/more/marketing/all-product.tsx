import React, {useCallback, useEffect, useState} from 'react';
import {
    FlatList,
    Keyboard,
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

    const handleTextChange = useCallback((text: string) => {
        setSearch(text);
    }, []);

    // NOTE : la recherche est un simple filtre synchrone sur des donnees
    // deja en memoire (aucun appel reseau) - le "setLoading(true/false)"
    // d'origine autour de ce filtre remplacait tout l'ecran par <Loading/>
    // pour une operation qui se termine instantanement, ce qui causait un
    // flash inutile a chaque recherche. Supprime : le filtre s'applique
    // directement, sans passer par l'ecran de chargement.
    const handleSubmitSearch = useCallback(() => {
        if (search !== '') {
            const filterProductList = productListData.filter((item: any) => {
                const itemLowerCase: any = item.nom;
                return itemLowerCase.toLowerCase().includes(search.trim().toLowerCase());
            });
            setProductSearchList(filterProductList);
        } else {
            setProductSearchList(productListData);
        }
    }, [search, productListData]);

    const handleClearSearch = useCallback(() => {
        setSearch('');
        setProductSearchList(productListData);
    }, [productListData]);

    useEffect(() => {
        const fetchData = async () => {
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

    const renderProductItem = useCallback(({item}: {item: TMarketing}) => (
        <ProductItem data={item} />
    ), []);
    const keyExtractorProduct = useCallback((item: TMarketing) => String(item.id), []);
    const ListEmptyComponent = useCallback(() => (
        <View>
            <Text style={styles.emptyText}>
                {t('more.empty_product')}
            </Text>
        </View>
    ), [t]);

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
                <FlatList
                    style={styles.listContainer}
                    data={productSearchList}
                    renderItem={renderProductItem}
                    keyExtractor={keyExtractorProduct}
                    ListEmptyComponent={ListEmptyComponent}
                />
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
    emptyText: {
        flex: 1,
        textAlign: 'center',
    },
});
