import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    Platform,
    StyleSheet,
    KeyboardAvoidingView,
    TextInput,
    TouchableOpacity,
    ScrollView
} from "react-native";
import ViewThemed from "../../../../components/ui/ViewThemed";
import {globalStyles} from "../../../../style/Global";
import Loading from "../../../../components/ui/Loading";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {COLORS} from "../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import AppointmentItem from "../../../../components/tabs/appointment/AppointmentItem";
import AppointmentForm from "../../../../components/tabs/appointment/AppointmentForm";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import FloatingButton from "../../../../components/ui/FloatingButton";
import * as yup from 'yup';

const newAppointmentFormSchema = yup.object({
    appointmentTitle: yup.string().required().min(3),
    appointmentDescription: yup.string().required().min(3),
});
const AppointmentHome = (props) => {
    const inputProps = {enterKeyHint: 'search'};
    const [addModal, setAddModal] = useState(false);
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {teacherSelected, employeesClassList} = useSelector(
        (state: any) => state.employee,
    );
    const {allAppointmentList} = useSelector((state: any) => state.appointment);
    const [teacherDest, setTeacherDest] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [appointmentList, setAppointmentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const {snackbarShowMessage} = props;

    const handleSearchAppointment = () => {
        if (search !== '') {
            setLoading(true);
            let filterAppointmentList = allAppointmentList.filter(function (
                item: any,
            ) {
                const itemLowerCase: any = item.objet;
                return itemLowerCase.toLowerCase().includes(search.toLowerCase());
            });

            setAppointmentList(filterAppointmentList);
            setLoading(false);
        } else {
            setAppointmentList(allAppointmentList);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setAppointmentList(allAppointmentList);
    };

    useEffect(() => {
        const fetchData = () => {
            try {
                setLoading(true);
                setAppointmentList(allAppointmentList);
                setLoading(false);
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [allAppointmentList]);

    if (loading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={{...globalStyles.container}}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}} enabled={true}>
                <View style={styles.container}>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            {/* <MaterialIcons name="search" size={20} color={COLORS.gray} /> */}
                            {/* @ts-ignore*/}
                            <TextInput
                                style={styles.input}
                                placeholder={t('allAppointment.search')}
                                placeholderTextColor={COLORS.gray}
                                {...inputProps}
                                value={search}
                                onChangeText={(text: any) => setSearch(text)}
                                onSubmitEditing={() => handleSearchAppointment()}
                                inputMode={'search'}
                            />
                            <TouchableOpacity onPress={() => handleClearSearch()}>
                                <MaterialIcons name="close" size={18} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.listContainer}>
                        {appointmentList?.length > 0 &&
                            appointmentList.map((appointment: any) => (
                                <AppointmentItem
                                    key={appointment?.id}
                                    data={appointment}
                                    snackbarShowMessage={snackbarShowMessage}
                                />
                            ))}
                        {(appointmentList?.length === 0 || false) && (
                            <View>
                                <Text style={{textAlign: 'center'} as StyleSheet}>
                                    {t('appointment.empty_appointment')}
                                </Text>
                            </View>
                        )}

                        <AppointmentForm
                            addModal={addModal}
                            setAddModal={setAddModal}
                            newAppointmentFormSchema={newAppointmentFormSchema}
                            teacherDest={teacherDest}
                            selectedChild={selectedChild}
                            teacherSelected={teacherSelected}
                            employeesClassList={employeesClassList}
                            setTeacherDest={setTeacherDest}
                            snackbarShowMessage={snackbarShowMessage}
                        />
                    </ScrollView>

                    <View style={styles.floatinBtn}>
                        <FloatingButton
                            onPress={() => {
                                setTeacherDest(null);
                                setAddModal(true);
                            }}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ViewThemed>
    );
};

export default withSnackbar(AppointmentHome);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 15,
        backgroundColor: COLORS.white,
    },
    backgroundImage: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    // contentContainer: {
    //   flex: 1,
    //   justifyContent: 'center',
    //   alignItems: 'center',
    // },
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
