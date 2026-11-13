import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    Platform,
    StyleSheet,
    KeyboardAvoidingView,
    TextInput,
    TouchableOpacity,
    FlatList
} from "react-native";
import {useFocusEffect} from '@react-navigation/native';
import ViewThemed from "../../../../components/ui/ViewThemed";
import {globalStyles} from "../../../../style/Global";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {COLORS} from "../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import AppointmentItem from "../../../../components/tabs/appointment/AppointmentItem";
import AppointmentForm from "../../../../components/tabs/appointment/AppointmentForm";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import AppointmentService from "../../../../services/AppointmentService";
import {setAllAppointmentList} from "../../../../redux/features/appointment/appointmentSlice";
import * as yup from 'yup';
import FlatButton from "../../../../components/ui/FlatButton";

const newAppointmentFormSchema = yup.object({
    appointmentTitle: yup.string().required().min(3),
    appointmentDescription: yup.string().required().min(3),
});
const AppointmentHome = (props) => {
    const inputProps = {enterKeyHint: 'search'};
    const [addModal, setAddModal] = useState(false);
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {employeesClassList} = useSelector(
        (state: any) => state.employee,
    );
    const {allAppointmentList} = useSelector((state: any) => state.appointment);
    const [teacherDest, setTeacherDest] = useState<any>(null);
    const [search, setSearch] = useState('');
    // ✅ Initialisé directement depuis Redux (déjà disponible de façon
    // synchrone) au lieu de partir d'un tableau vide en attendant un faux
    // "loading" : le contenu s'affiche dès le premier rendu.
    const [appointmentList, setAppointmentList] = useState(allAppointmentList);
    const {snackbarShowMessage} = props;
    const dispatch = useDispatch();

    // Garde le même comportement qu'avant : la recherche ne filtre qu'à la
    // validation (onSubmitEditing), pas à chaque frappe. On resynchronise
    // simplement sur la liste Redux quand elle change, sans passer par un
    // état "loading" (aucune opération asynchrone n'a lieu ici).
    useEffect(() => {
        setAppointmentList(allAppointmentList);
    }, [allAppointmentList]);

    // ✅ Ce tab lisait uniquement "allAppointmentList" depuis Redux, sans
    // jamais la rafraîchir lui-même : la liste ne se mettait à jour que si
    // l'écran d'accueil (Home) avait été visité et avait relancé son propre
    // chargement. En rechargeant directement ici à chaque focus de l'onglet
    // (useFocusEffect), la liste des rendez-vous est à jour même si on
    // arrive sur cet onglet sans passer par l'accueil.
    const fetchAppointments = useCallback(async () => {
        if (!selectedChild) return;
        try {
            const allRdvListSort = await AppointmentService.getAllAppointment(selectedChild.person.id);
            dispatch(setAllAppointmentList(allRdvListSort || []));
        } catch (error) {
            console.log(error);
        }
    }, [selectedChild, dispatch]);

    useFocusEffect(
        useCallback(() => {
            fetchAppointments();
        }, [fetchAppointments])
    );

    const handleSearchAppointment = useCallback(() => {
        if (search !== '') {
            const searchLower = search.toLowerCase();
            const filterAppointmentList = allAppointmentList.filter((item: any) =>
                (item.objet ?? '').toLowerCase().includes(searchLower)
            );
            setAppointmentList(filterAppointmentList);
        } else {
            setAppointmentList(allAppointmentList);
        }
    }, [search, allAppointmentList]);

    const handleClearSearch = useCallback(() => {
        setSearch('');
        setAppointmentList(allAppointmentList);
    }, [allAppointmentList]);

    const handleOpenAddModal = useCallback(() => {
        setTeacherDest(null);
        setAddModal(true);
    }, []);

    const renderItem = useCallback(({item}: {item: any}) => (
        <AppointmentItem
            data={item}
            snackbarShowMessage={snackbarShowMessage}
        />
    ), [snackbarShowMessage]);

    const keyExtractor = useCallback((item: any, index: number) => (
        String(item?.id ?? index)
    ), []);

    return (
        <ViewThemed style={globalStyles.container}>
            <View style={styles.headerBar}>
                <View style={styles.headerButtonWrapper}>
                    <FlatButton
                        title={t('allAppointment.take_appointment')}
                        fontWeight="500"
                        fontSize={16}
                        backgroundColor={COLORS.secondary}
                        paddingVertical={10}
                        borderRadius={20}
                        onPress={handleOpenAddModal}
                        disabled={false}
                    />
                </View>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flexOne} enabled={true}>
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
                                onChangeText={setSearch}
                                onSubmitEditing={handleSearchAppointment}
                                inputMode={'search'}
                            />
                            <TouchableOpacity onPress={handleClearSearch}>
                                <MaterialIcons name="close" size={18} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        style={styles.listContainer}
                        data={appointmentList}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={7}
                        ListEmptyComponent={
                            <View>
                                <Text style={styles.emptyText}>
                                    {t('appointment.empty_appointment')}
                                </Text>
                            </View>
                        }
                    />
                </View>
            </KeyboardAvoidingView>

            {/* Hors de la FlatList : un Modal rendu dans le footer d'une liste virtualisée
                empêche l'ouverture du modal imbriqué "Dates réservées" sur iOS */}
            <AppointmentForm
                addModal={addModal}
                setAddModal={setAddModal}
                newAppointmentFormSchema={newAppointmentFormSchema}
                teacherDest={teacherDest}
                selectedChild={selectedChild}
                employeesClassList={employeesClassList}
                setTeacherDest={setTeacherDest}
                snackbarShowMessage={snackbarShowMessage}
            />
        </ViewThemed>
    );
};

export default withSnackbar(AppointmentHome);

const styles = StyleSheet.create({
    flexOne: {
        flex: 1,
    },
    headerBar: {
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: COLORS.grayExtraLight,
    },
    headerButtonWrapper: {
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
    },
    container: {
        flex: 1,
        paddingTop: 0,
        backgroundColor: COLORS.white,
    },
    backgroundImage: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    floatinBtn: {
        width: 43,
        height: 43,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        bottom: 3,
        right: 12,
        elevation: 2,
        backgroundColor: COLORS.secondary,
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
    listContainer: {
        flex: 1,
        padding: 10,
        paddingTop: 15,
    },
    modalContainer: {
        flex: 1,
        padding: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
    },
    modalTitle: {
        flex: 1,
        alignItems: 'center',
    },
    modalTitleText: {
        fontSize: 18,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.secondary,
    },
    modalContent: {
        flex: 1,
        paddingTop: 20,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 10,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
    },
    inputField: {
        marginBottom: 15,
    },
    modalInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.grayLight,
        paddingLeft: 2,
        paddingBottom: 5,
    },

    dropdown3BtnStyle: {
        width: '100%',
        backgroundColor: COLORS.white,
        paddingHorizontal: 0,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: COLORS.grayMedium,
    },
    dropdown3BtnChildStyle: {
        flex: 1,
        flexDirection: 'row',
        //justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    dropdown3BtnImage: {
        width: 35,
        height: 35,
        resizeMode: 'cover',
        borderRadius: 35,
    },
    dropdown3BtnTxt: {
        flex: 1,
        color: COLORS.gray,
        textAlign: 'left',
        fontSize: 16,
        marginHorizontal: 12,
    },
    dropdown3DropdownStyle: {
        backgroundColor: COLORS.white,
    },
    dropdown3RowStyle: {
        borderColor: COLORS.grayVeryLight,
        borderBottomColor: COLORS.grayVeryLight,
        //height: 50,
    },
    dropdown3RowChildStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    dropdownRowImage: {
        width: 35,
        height: 35,
        resizeMode: 'cover',
        borderRadius: 35,
    },
    dropdown3RowTxt: {
        color: COLORS.gray,
        textAlign: 'center',
        fontSize: 16,
        marginHorizontal: 12,
    },
});
