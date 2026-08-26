import React from 'react';
import {View, Text, Platform, StyleSheet, Pressable} from "react-native";
import {COLORS, IMAGES} from "../../../constants";
import {StatusBar} from "expo-status-bar";
import {ImageBackground} from "expo-image";
import {MaterialIcons} from "@expo/vector-icons";

const CustomHeaderWithButton = ({handleBackRoute, title, backRouteName}) => {
    return (
        <View
            style={
                Platform.OS === 'ios' ? styles.containerIOS : styles.containerAndroid
            }>
            <StatusBar value="auto" translucent backgroundColor="transparent" />
            <ImageBackground style={styles.header} source={IMAGES.headerBackground}>
                <Pressable
                    style={{marginLeft: 10, flexDirection: 'row'} as StyleSheet}
                    onPress={() => handleBackRoute(backRouteName)}>
                    <MaterialIcons
                        name="arrow-back"
                        size={26}
                        color={COLORS.secondary}
                    />
                    <View style={styles.headerTitle}>
                        <Text style={{...styles.headerText}}>{title}</Text>
                    </View>
                </Pressable>
            </ImageBackground>
        </View>
    );
};

export default CustomHeaderWithButton;

const styles = StyleSheet.create({
    containerIOS: {
        height: 75,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        marginTop: 0,
        //paddingTop: 15,
    },
    containerAndroid: {
        height: 75,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
        marginTop: 0,
        //paddingTop: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 0,
        height: '100%',
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayMedium,
    },
    headerText: {
        fontWeight: '500',
        fontSize: 20,
        color: COLORS.secondary,
        letterSpacing: 1,
        paddingLeft: 20,
        paddingRight: 20,
    },
    icon: {
        position: 'absolute',
        right: 20,
        paddingTop: 20,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    headerTitle: {
        //flexDirection: 'row',
    },
    headerImage: {
        width: 26,
        height: 26,
        marginHorizontal: 10,
    },
    avatarContainer: {
        position: 'absolute',
        right: 20,
        paddingTop: 0,
    },
    avatar: {
        width: 43,
        height: 43,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
});
