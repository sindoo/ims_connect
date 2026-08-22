import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from "react-native";
import {DrawerContentScrollView, DrawerItem, DrawerItemList} from "expo-router/drawer";
import {COLORS, IMAGES} from "../../constants";
import {BASEURL_IMG} from "../../api/appUrl";
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import {removeAuthToken} from "../../api/ApiManager";
import {changeChild, initializeChildValue} from "../../redux/features/child/childSlice";
import {initializeAllAppointment} from "../../redux/features/appointment/appointmentSlice";
import {initializeTeacherValue} from "../../redux/features/employee/employeeSlice";
import {initializeNotification} from "../../redux/features/notification/notificationSlide";
import {initializeDiscussion} from "../../redux/features/message/messageSlice";
import {logoutUser} from "../../redux/features/userSlice";
import { DrawerActions } from 'expo-router/react-navigation';
import DrawerHeaderItem from "./DrawerHeaderItem";
import {Image} from "expo-image";


const DrawerHeaderContent = (props) => {
    const {children, selectedChild} = useSelector((state: any) => state.child);
    const [childrenData, setChildrenData] = useState<any>([]);
    const [childrenSelected, setChildrenSelected] = useState<any>(null);
    const [childrenSelectedClass, setChildrenSelectedClass] = useState<any>(null);
    const [childList, setChildList] = useState(false);
    const {t} = useTranslation();
    const dispatch = useDispatch();
    //const navigation = useNavigation();
    const { navigation } = props;

    const handleIconChange = () => {
        setChildList(!childList);
    };

    const handleChangeChild = (childSelected: any) => {
        const findChild = children.filter(
            (child: any) => child?.person?.id === childSelected?.id,
        );

        if(findChild.length > 0){
            dispatch(changeChild(findChild[0]));
        }

        navigation.closeDrawer();
    };

    const onLogout = () => {
        removeAuthToken();
        dispatch(initializeChildValue());
        dispatch(initializeAllAppointment());
        dispatch(initializeTeacherValue());
        dispatch(initializeNotification());
        dispatch(initializeDiscussion());
        dispatch(logoutUser());
        navigation.closeDrawer();
    };

    useEffect(() => {
        try {
            const fetchData = () => {
                if (children.length > 0 && selectedChild !== null) {
                    const childrenSelect = selectedChild?.person;
                    const listChildWithoutSelected = children.filter(
                        (child: any) => child?.person?.id !== childrenSelect?.id,
                    );
                    const sibilings = listChildWithoutSelected.map((item: any) => {
                        return {...item?.person, classe: item?.eleves[0]?.classe.nom};
                    });
                    setChildrenData(sibilings);
                    setChildrenSelected(selectedChild?.person);
                    setChildrenSelectedClass(selectedChild?.eleves[0]?.classe.nom);
                } else {
                    setChildrenData([]);
                }
            };
            fetchData();
        }
        catch (error) {
            console.log(error);
        }

    }, [selectedChild]);

    return (
        <DrawerContentScrollView {...props} style={{flex: 1}}>
            <View style={styles.headerContainer}>
                <View style={styles.avatarContainer}>
                    {childrenSelected !== null && (
                        <Image
                            source={
                                childrenSelected?.photo !== ''
                                    ? {uri: `${BASEURL_IMG}/${childrenSelected?.photo}`}
                                    : IMAGES.avatar
                            }
                            style={styles.avatar}
                        />
                    )}
                </View>
                <View style={styles.headerTextContainer}>
                    {childrenSelected !== null && (
                        <Text style={styles.headerText}>
                            {childrenSelected?.prenom} {childrenSelected?.nom}
                        </Text>
                    )}
                    <Text style={styles.classroom}>{childrenSelectedClass}</Text>
                </View>

                <View style={styles.headerIcon}>
                    {childrenData.length > 0 && (
                        <TouchableOpacity onPress={handleIconChange}>
                            {childList ? (
                                <MaterialCommunityIcons
                                    name="chevron-up"
                                    size={28}
                                    style={styles.icon}
                                />
                            ) : (
                                <MaterialCommunityIcons
                                    name="chevron-down"
                                    size={28}
                                    style={styles.icon}
                                />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={styles.childListContainer}>
                {childList &&
                    childrenData.length > 0 &&
                    childrenData.map((child: any) => (
                        <DrawerHeaderItem key={child?.id} data={child}  handleChangeChild={handleChangeChild}/>
                    ))}
            </View>

            <DrawerItemList {...props} />

            <DrawerItem
                label={t('login.log_out')}
                icon={() => (
                    <MaterialIcons name="logout" size={24} color={COLORS.gray} />
                )}
                labelStyle={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: COLORS.gray,
                    marginLeft: 0,
                } as StyleSheet}
                onPress={() => onLogout()}
            />
        </DrawerContentScrollView>
    );
};

export default DrawerHeaderContent;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        marginTop: 10,
        paddingLeft: 18,
        paddingRight: 20,
    },
    avatarContainer: {
        flex: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    headerTextContainer: {
        flex: 5,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerText: {
        fontWeight: '700',
        color: COLORS.gray,
    },
    classroom: {
        color: COLORS.gray,
    },
    headerIcon: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    icon: {
        color: COLORS.gray,
    },
    childListContainer: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 15,
        marginBottom: 20,
        //borderBottomWidth:1,
        //borderBottomColor: COLORS.grayLight,
    },
});

