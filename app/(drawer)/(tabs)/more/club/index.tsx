import React, {useEffect, useState} from 'react';
import {
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import MiniClubService from "../../../../../services/MiniClubService";
import {setChildMiniClubList} from "../../../../../redux/features/club/miniClubSlice";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {COLORS} from "../../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import {TMiniClub} from "../../../../../lib/type/TMiniClubProps";
import MiniClubItem from "../../../../../components/tabs/more/club/MiniClubItem";


function MiniClub(props) {
    const {t} = useTranslation();
    const inputProps = {enterKeyHint: 'search'};
    const [search, setSearch] = useState('');
    const [miniClubSearchList, setMiniClubSearchList] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {userToken} = useSelector((state:any) => state.user);
    const {childMiniClubList, updateMiniClubStatus} = useSelector((state: any) => state.miniclub);

    const handleSearch = () => {
        try {
            if (search !== '') {
                setLoading(true);
                let filterMiniClubList = childMiniClubList.filter(function (item: any) {
                    const itemLowerCase: any = item.title;
                    return itemLowerCase.toLowerCase().includes(search.toLowerCase());
                });
                setMiniClubSearchList(filterMiniClubList);
                setLoading(false);
            } else {
                setMiniClubSearchList(childMiniClubList);
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setMiniClubSearchList(childMiniClubList);
    };

    useEffect(() => {
        const fetchData = async () => {
           try {
               if(selectedChild !== null) {
                   setLoading(true);
                   const miniClubListFiltered = await MiniClubService.getChildClassMiniClubData(selectedChild);
                   setMiniClubSearchList(miniClubListFiltered);
                   dispatch(setChildMiniClubList(miniClubListFiltered));
                   setLoading(false);
               }
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
    }, [updateMiniClubStatus, selectedChild]);

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        {/* @ts-ignore*/}
                        <TextInput
                            style={styles.input}
                            placeholder={t('allAppointment.search')}
                            placeholderTextColor={COLORS.gray}
                            {...inputProps}
                            value={search}
                            onChangeText={(text: any) => setSearch(text)}
                            onSubmitEditing={() => handleSearch()}
                            inputMode={'search'}
                        />
                        <TouchableOpacity onPress={() => handleClearSearch()}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.miniClubList}>
                    {(miniClubSearchList.length === 0 || false) && (
                        <View>
                            <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                {t('more.empty_mini_club')}
                            </Text>
                        </View>
                    )}
                    {miniClubSearchList.length > 0 &&
                        miniClubSearchList.map((miniClub: TMiniClub) => (
                            <MiniClubItem
                                key={miniClub.id}
                                data={miniClub}
                            />
                        ))}
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default MiniClub;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    searchContainer: {
        padding: 10,
        paddingHorizontal: 15,
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
    miniClubList: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
});
