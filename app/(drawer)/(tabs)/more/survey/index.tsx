import React, {useEffect, useRef, useState} from 'react';
import {
    AppState,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import SurveyService from "../../../../../services/SurveyService";
import {checkAppState, checkTokenExpired} from "../../../../../services/GeneralService";
import {COLORS} from "../../../../../constants";
import {withSnackbar} from "../../../../../components/ui/SnackbarHOC";
import {MaterialIcons} from "@expo/vector-icons";
import Loading from "../../../../../components/ui/Loading";
import SurveyItem from "../../../../../components/tabs/more/survey/SurveyItem";

function Survey(props: any) {
    const {snackbarShowMessage} = props;
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state: any) => state.user);
    const {t} = useTranslation();
    const inputProps = {enterKeyHint: 'search'};
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [surveyList, setSurveyList] = useState([]);
    const [surveyListOrig, setSurveyListOrig] = useState([]);
    const dispatch = useDispatch();
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    const handleSearchSurvey = () => {
        if (search !== '') {
            setLoading(true);
            let filterSurveyList = surveyList.filter(function (item: any) {
                const itemLowerCase: any = item.nom;
                return itemLowerCase.toLowerCase().includes(search.trim().toLowerCase());
            });
            setSurveyList(filterSurveyList);
            setLoading(false);
        } else {
            setSurveyList(surveyListOrig);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setSurveyListOrig(surveyListOrig);
    };

    useEffect(() => {
        const fetchData = async () => {
            if(selectedChild  !== null && user !== null) {
                setLoading(true);
                const classId = selectedChild.eleves[0]?.classe?.id;
                const userId = user.id;
                if(classId !== undefined) {
                    const surveyListReq = await SurveyService.getAllSurvey(classId, userId);
                    setSurveyList(surveyListReq);
                    setSurveyListOrig(surveyListReq);
                    setLoading(false);
                }
            }
            setLoading(false);

            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => {
            console.log(error);
            setLoading(false);
            checkTokenExpired(userToken, dispatch);
        });

        const subscription = checkAppState(appState, count, setCount);
        return () => {
            subscription.remove();
        };
    }, [selectedChild, count]);

    if (loading) {
        return <Loading />;
    }

    return (
        <>
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
                                onSubmitEditing={() => handleSearchSurvey()}
                                inputMode={'search'}
                            />
                            <TouchableOpacity onPress={() => handleClearSearch()}>
                                <MaterialIcons name="close" size={18} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={{flex: 1, marginTop: 15}}>
                        {(surveyList.length === 0 || false) && (
                            <View>
                                <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                    {t('more.empty_survey')}
                                </Text>
                            </View>
                        )}

                        {surveyList.length > 0 &&
                            surveyList.map((survey: any) => {
                                return (
                                    <SurveyItem
                                        key={survey.id}
                                        survey={survey}
                                        setSurveyList={setSurveyList}
                                        setSurveyListOrig={setSurveyListOrig}
                                        snackbarShowMessage={snackbarShowMessage}
                                    />
                                );
                            })}
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>
        </>
    );
}

export default withSnackbar(Survey);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },

    documentToolsContainer: {
        paddingTop: 10,
        marginBottom: 10,
        paddingBottom: 8,
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
