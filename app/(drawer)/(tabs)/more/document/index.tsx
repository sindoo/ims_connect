import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
    Text, TouchableOpacity,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import DocumentService from "../../../../../services/DocumentService";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {COLORS} from "../../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import SchoolDocumentItem from "../../../../../components/tabs/more/document/SchoolDocumentItem";


function SchoolDocument() {
    const {t} = useTranslation();
    const inputProps = {enterKeyHint: 'search'};
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state: any) => state.user);
    const [schoolDocumentList, setSchoolDocumentList] = useState([]);
    const [documentListOrig, setDocumentListOrig] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    const handleSearchDocument = () => {
        if (search !== '') {
            setLoading(true);
            let filterDocumentList = schoolDocumentList.filter(function (item: any) {
                const itemLowerCase: any = item.nom;
                return itemLowerCase.toLowerCase().includes(search.trim().toLowerCase());
            });
            setSchoolDocumentList(filterDocumentList);
            setLoading(false);
        } else {
            setSchoolDocumentList(documentListOrig);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setSchoolDocumentList(documentListOrig);
    };

    const handleDelete = () => {};

    useEffect(() => {
        const fetchData = async () => {
            try {
                if(selectedChild !== null && user !== null) {
                    setLoading(true);
                    const documentListRequest: any = await DocumentService.getChildClassDocuments(selectedChild, user.id);
                    const documentList: any = Array.isArray(documentListRequest) ? documentListRequest : [];
                    setSchoolDocumentList(documentList);
                    setDocumentListOrig(documentList);
                    setLoading(false);
                }
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
            catch (error){
                console.log(error);
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
        };
        fetchData().catch(error => {
            console.log(error);
        });

    }, [selectedChild]);

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
                            onSubmitEditing={() => handleSearchDocument()}
                            inputMode={'search'}
                        />
                        <TouchableOpacity onPress={() => handleClearSearch()}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView style={{flex: 1, marginTop: 15}}>
                    {(schoolDocumentList.length === 0 || false) && (
                        <View>
                            <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                {t('more.empty_school_document')}
                            </Text>
                        </View>
                    )}

                    {schoolDocumentList.length > 0 &&
                        schoolDocumentList.map((document: any) => {
                            return (
                                <SchoolDocumentItem
                                    key={document.id}
                                    document={document}
                                    onDelete={handleDelete}
                                />
                            );
                        })}
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default SchoolDocument;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    documentToolsContainer: {
        paddingTop: 10,
        paddingBottom: 8,
        marginBottom: 10,
    },
    documentTools: {
        flexDirection: 'row',
        paddingLeft: 15,
        paddingRight: 15,
    },
    docSelectedNumber: {
        flex: 5,
        justifyContent: 'center',
    },
    docToolsButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
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
});
