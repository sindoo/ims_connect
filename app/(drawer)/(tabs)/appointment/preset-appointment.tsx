import React, {useEffect, useState} from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
    StyleSheet,
    Modal,
    Keyboard,
    TouchableWithoutFeedback, TextInput, Pressable
} from "react-native";
import ViewThemed from "../../../../components/ui/ViewThemed";
import {globalStyles} from "../../../../style/Global";
import {COLORS} from "../../../../constants";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import AppointmentService from "../../../../services/AppointmentService";
import {setPresetAppointmentList} from "../../../../redux/features/appointment/appointmentSlice";
import AppointmentItemPreset from "../../../../components/tabs/appointment/AppointmentItemPreset";
import {MaterialIcons} from "@expo/vector-icons";
import DatePicker from "react-native-date-picker";
import {format} from "date-fns";
import {enUS} from "date-fns/locale";
import FlatButton from "../../../../components/ui/FlatButton";
import SelectField from "../../../../components/ui/SelectField";


const userData = [
    {
        id: 1,
        name: 'Jean kouadio',
        image: 'https://ivorymontessorisystem.com/media/upload/photo/Nicole.png',
    },
];
const PresetAppointment = () => {
    const [addModal, setAddModal] = useState(false);
    const [date, setDate] = useState(new Date());
    const [open, setOpen] = useState(false);
    const [startTime, setStartTime] = useState(new Date());
    const [openStartTime, setStartTimeOpen] = useState(false);
    const [endTime, setEndTime] = useState(startTime);
    const [openEndTime, setEndTimeOpen] = useState(false);
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {presetList} = useSelector((state: any) => state.appointment);
    const dispatch = useDispatch();

    const handleUserSelectChange = (item: any, index: number) => {
        console.log(item, index);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (selectedChild !== null) {
                    const presetAppointment = await AppointmentService.getAllPresetAppointment(selectedChild);
                    dispatch(setPresetAppointmentList(presetAppointment));
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        fetchData().catch(error => {
            console.log(error)
        });
    }, [selectedChild]);


    return (
        <ViewThemed style={{...globalStyles.container}}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}
                enabled={true}>
                <View style={styles.container}>
                    <ScrollView style={styles.listContainer}>
                        {presetList.length === 0 && (
                            <Text style={{textAlign: 'center', color: COLORS.gray} as StyleSheet}>
                                {t('appointment.empty_appointment')}
                            </Text>
                        )}

                        {presetList.length > 0 &&
                            presetList.map((presetAppointment: any, index: any) => (
                                <AppointmentItemPreset
                                    key={presetAppointment.id}
                                    data={presetAppointment}
                                />
                            ))}
                    </ScrollView>

                    <Modal
                        visible={addModal}
                        animationType="slide"
                        style={{marginTop: 100}}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitle}>
                                        <Text style={styles.modalTitleText}>
                                            {t('allAppointment.new_appointment')}
                                        </Text>
                                    </View>
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <MaterialIcons
                                            name="close"
                                            size={22}
                                            color={COLORS.gray}
                                            onPress={() => setAddModal(false)}
                                        />
                                    </TouchableWithoutFeedback>
                                </View>

                                <ScrollView style={styles.modalContent}>
                                    <View style={styles.inputField}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.child_field_label')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputModal}
                                            editable={false}
                                            value="Name"
                                        />
                                    </View>

                                    <View style={styles.inputField}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.employee_field_label')}
                                        </Text>
                                        <SelectField
                                            data={userData}
                                            placeholder={t('allAppointment.employee_placeholder')}
                                            onSelect={(item: any, index: number) =>
                                                handleUserSelectChange(item, index)
                                            }
                                        />
                                    </View>

                                    <View style={styles.inputField}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.title_field_label')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputModal}
                                            placeholder={t('allAppointment.title_placeholder')}
                                            onChangeText={() => {}}
                                        />
                                    </View>

                                    <View style={styles.inputField}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.description_field_label')}
                                        </Text>
                                        <TextInput
                                            multiline
                                            style={styles.inputModal}
                                            placeholder={t('allAppointment.description_placeholder')}
                                            onChangeText={() => {}}
                                        />
                                    </View>

                                    <View style={styles.inputField}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.date_field_label')}
                                        </Text>
                                        <Pressable onPress={() => setOpen(true)}>
                                            <Text style={styles.inputModal}>
                                                {format(date, 'P', {locale: enUS})}
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <DatePicker
                                        modal
                                        open={open}
                                        date={date}
                                        mode="date"
                                        locale="us"
                                        onConfirm={date => {
                                            setOpen(false);
                                            setDate(date);
                                        }}
                                        onCancel={() => {
                                            setOpen(false);
                                        }}
                                    />

                                    <View style={styles.inputField}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.startime_field_label')}
                                        </Text>
                                        <Pressable onPress={() => setStartTimeOpen(true)}>
                                            <Text style={styles.inputModal}>
                                                {format(startTime, 'p', {locale: enUS})}
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <DatePicker
                                        modal
                                        open={openStartTime}
                                        date={startTime}
                                        mode="time"
                                        locale="us"
                                        onConfirm={startTime => {
                                            setStartTimeOpen(false);
                                            setStartTime(startTime);
                                            setEndTime(startTime);
                                        }}
                                        onCancel={() => {
                                            setStartTimeOpen(false);
                                        }}
                                    />

                                    <View style={{...styles.inputField, marginBottom: 40}}>
                                        <Text style={styles.modalInputLabel}>
                                            {t('allAppointment.endtime_field_label')}
                                        </Text>
                                        <Pressable onPress={() => setEndTimeOpen(true)}>
                                            <Text style={styles.inputModal}>
                                                {format(endTime, 'p', {locale: enUS})}
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <DatePicker
                                        modal
                                        open={openEndTime}
                                        date={endTime}
                                        minimumDate={startTime}
                                        mode="time"
                                        locale="us"
                                        onConfirm={endTime => {
                                            setEndTimeOpen(false);
                                            setEndTime(endTime);
                                        }}
                                        onCancel={() => {
                                            setEndTimeOpen(false);
                                        }}
                                    />

                                    <FlatButton
                                        title={t('allAppointment.save_form')}
                                        fontWeight="500"
                                        fontSize={16}
                                        backgroundColor={COLORS.secondary}
                                        paddingVertical={12}
                                        borderRadius={20}
                                        onPress={() => {}}
                                        disabled
                                    />
                                    <View style={{marginTop: 20}} />
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                </View>
            </KeyboardAvoidingView>
        </ViewThemed>
    );
};

export default PresetAppointment;

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
        width: 50,
        height: 50,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        bottom: 5,
        right: 1,
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
});
