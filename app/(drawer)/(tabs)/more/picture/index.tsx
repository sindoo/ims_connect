import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import PictureService from "../../../../../services/PictureService";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {globalStyles} from "../../../../../style/Global";
import {COLORS} from "../../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import ImageList from "../../../../../components/tabs/more/picture/ImageList";


function ChildPicture() {
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const [numberImageChecked, setNumberImageChecked] = useState(0);
    const [imageList, setImageList] = useState([]);
    const [pictureIdList, setPictureIdList] = useState([]);
    const [loading, setLoading] = useState(true);
    const {user, userToken} = useSelector((state: any) => state.user);
    const dispatch = useDispatch();

    const countImageSelected = (count: any) => {
        setNumberImageChecked(count);
    };

    const handleDeletePicture = async () => {
        try {
            if(selectedChild !== null && user !== null) {
                await PictureService.deletePicture(pictureIdList);
                const pictureList = await PictureService.getPictureData(selectedChild.person.id, user.id);
                setImageList(pictureList);
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if(selectedChild !== null && user !== null) {
                setLoading(true);
                const pictureList = await PictureService.getPictureData(selectedChild.person.id, user.id);
                setImageList(pictureList);
                setLoading(false);
            }
            setLoading(false);

            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => {
            console.log(error);
            //console.log(JSON.stringify(error))
            setLoading(false);
            checkTokenExpired(userToken, dispatch);
        });
    }, [selectedChild]);

    if (loading) {
        return <Loading />;
    }

    return (
        <>
            <View style={styles.container}>
                <View style={styles.imageToolsContainer}>
                    {numberImageChecked > 0 && (
                        <View style={styles.imageTools}>
                            <View style={styles.imageSelectedNumber}>
                                <Text style={{...globalStyles.titleH3, textAlign: 'center'} as StyleSheet}>
                                    {numberImageChecked} {t('imageChild.selected')}
                                </Text>
                            </View>
                            <View style={styles.imageToolsButton}>
                                <Pressable onPress={() => handleDeletePicture()}>
                                    <MaterialIcons
                                        name="delete"
                                        color={COLORS.secondary}
                                        size={26}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>
                <ScrollView style={{flex: 1}}>
                    <View>
                        {(imageList.length === 0 || false) && (
                            <View>
                                <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                    {t('more.empty_child_picture')}
                                </Text>
                            </View>
                        )}
                        {imageList.length > 0 && (
                            <ImageList
                                data={imageList}
                                numberImageChecked={numberImageChecked}
                                countImageSelected={countImageSelected}
                                pictureIdList={pictureIdList}
                                setPictureIdList={setPictureIdList}
                            />
                        )}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

export default ChildPicture;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    imageToolsContainer: {
        paddingTop: 10,
        paddingBottom: 8,
        marginBottom: 10,
        backgroundColor: COLORS.grayVeryLight,
    },
    imageTools: {
        flexDirection: 'row',
        paddingLeft: 15,
        paddingRight: 15,
    },
    imageSelectedNumber: {
        flex: 4,
        justifyContent: 'center',
    },
    imageToolsButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
