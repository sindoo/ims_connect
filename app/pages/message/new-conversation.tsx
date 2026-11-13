import {
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {COLORS} from '../../../constants';
import {MaterialIcons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import ContactItem from '../../../components/tabs/message/ContactItem';
import {useDispatch, useSelector} from 'react-redux';
import React, {useEffect, useState} from 'react';
import Loading from "../../../components/ui/Loading";
import EmployeeService from "../../../services/EmployeeService";
import UtilitiesService from "../../../services/UtilitiesService";
import {getEmployeesTeacher} from "../../../redux/features/employee/employeeSlice";

function NewConservation(props) {
    const inputProps = {enterKeyHint: 'search'};
    const {t} = useTranslation();
    const {selectedChild, children} = useSelector((state: any) => state.child);
    const {employeesClassList} = useSelector((state: any) => state.employee);
    const [search, setSearch] = useState('');
    const [contactList, setContactList] = useState([]);
    // fonctionList/classroomList : chargées une seule fois ici et passées en
    // props à chaque ContactItem, au lieu d'être re-fetchées par chaque item
    // de la liste (voir ContactItem.tsx).
    const [fonctionList, setFonctionList] = useState([]);
    const [classroomList, setClassroomList] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleSearchContact = () => {
        if (search !== '') {
            setLoading(true);
            let filterContactList = employeesClassList.filter(function (item: any) {
                const itemLowerCase: any = item.person.nom.concat(
                    ` ${item.person.prenom}`,
                );
                return itemLowerCase.toLowerCase().includes(search.toLowerCase());
            });
            setContactList(filterContactList);
            setLoading(false);
        } else {
            setContactList(employeesClassList);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setContactList(employeesClassList);
    };

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            if (selectedChild === null) {
                setLoading(false);
                return;
            }

            // Si la liste de contacts est déjà en cache (Redux), on l'affiche
            // immédiatement sans écran de chargement, et on la rafraîchit en
            // tâche de fond via le fetch ci-dessous.
            const hasCachedContacts = employeesClassList.length > 0;
            if (hasCachedContacts) {
                setContactList(employeesClassList);
            } else {
                setLoading(true);
            }

            try {
                // Les 3 appels sont indépendants : on les lance en parallèle
                // plutôt qu'en série, ce qui divise à peu près par 2 le temps
                // d'attente réseau avant l'affichage du contenu.
                const [employeesRes, fonctionListLoad, classroomListLoad] = await Promise.all([
                    EmployeeService.getChildClassEmployees(selectedChild),
                    EmployeeService.getEmployeesProfession(),
                    UtilitiesService.getAllClassrooms(),
                ]);

                if (cancelled) return;

                setContactList(employeesRes.employeesClassList);
                setFonctionList(fonctionListLoad);
                setClassroomList(classroomListLoad);
                dispatch(getEmployeesTeacher({
                        employees: employeesRes.employees,
                        teacher: employeesRes.teacher,
                        teacherList: employeesRes.teacherList,
                        employeesClassList: employeesRes.employeesClassList,
                    }),
                );
            } catch (error) {
                console.error('[NewConservation] Error fetching data:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [selectedChild]);

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.searchToolbar}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={20} color={COLORS.gray} />
                        {/* @ts-ignore*/}
                        <TextInput
                            style={styles.input}
                            placeholder={t('message.search')}
                            {...inputProps}
                            value={search}
                            onChangeText={(text: any) => setSearch(text)}
                            onSubmitEditing={() => handleSearchContact()}
                            inputMode={'search'}
                        />
                        <TouchableOpacity onPress={() => handleClearSearch()}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.messageListContainer}>
                    <FlatList
                        style={{paddingLeft: 15, paddingRight: 15}}
                        data={contactList}
                        keyExtractor={(employee: any) => employee.person.id.toString()}
                        renderItem={({item}) => (
                            <ContactItem
                                contact={item}
                                fonctionList={fonctionList}
                                classroomList={classroomList}
                            />
                        )}
                        ListEmptyComponent={
                            <View>
                                <Text style={{textAlign: 'center'}}>
                                    {t('contactNewMessage.empty_contact')}
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default NewConservation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 15,
        backgroundColor: COLORS.white,
    },
    searchToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBar: {
        flex: 6,
        flexDirection: 'row',
        padding: 6,
        marginLeft: 15,
        marginRight: 15,
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
    messageListContainer: {
        flex: 4,
        paddingBottom: 15,
        paddingTop: 30,
    },
    messageItemContainer: {
        flexDirection: 'row',
        marginBottom: 23,
    },
    messageImage: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        paddingBottom: 1,
    },
    messageImageCover: {
        width: 50,
        height: 50,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayVeryLight,
        paddingRight: 10,
    },
    messageTextContainer: {
        flex: 1,
        paddingLeft: 10,
    },
    interlocutor: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingTop: 12,
    },
    messageText: {
        // flex: 3,
        // letterSpacing: 1,
    },
});
