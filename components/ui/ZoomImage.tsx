import React, {useEffect, useState} from 'react';
import {Keyboard, Linking, Modal, StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS, IMAGES} from "../../constants";
import Loading from "./Loading";
import {Image} from "expo-image";
import {BASEURL_IMG} from "../../api/appUrl";

const ZoomImageBox = ({imageModal, setImageModal, pictureUri}) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <>
            <Modal
                visible={imageModal}
                animationType="slide"
                style={{marginTop: 100}}
                //transparent={true}
            >
                <SafeAreaProvider>
                    <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitle} />
                                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                        <MaterialIcons
                                            name="close"
                                            size={28}
                                            color={COLORS.gray}
                                            onPress={() => {
                                                setImageModal(false);
                                            }}
                                        />
                                    </TouchableWithoutFeedback>
                                </View>
                                <View style={styles.modalContent}>
                                    {loading && <Loading />}
                                    {pictureUri !== null && (
                                        <>
                                            <Image
                                                source={{uri: pictureUri}}
                                                style={styles.childPictureZoom}
                                                contentFit="contain"
                                            />
                                        </>
                                    )}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </SafeAreaView>
                </SafeAreaProvider>
            </Modal>
        </>
    );
};

export default ZoomImageBox;

const styles = StyleSheet.create({
    childPicture: {
        width: '100%',
        height: 108,
    },
    modalContainer: {
        //flex: 1,
        padding: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
        paddingRight: 10,
    },
    modalTitle: {
        flex: 1,
        alignItems: 'center',
    },
    modalContent: {
        //flex: 1,
        alignItems: "center",
        //justifyContent: "center"
    },
    childPictureZoom: {
        width: '95%',
        height: '80%',
        //height: '100%',
    },
});
