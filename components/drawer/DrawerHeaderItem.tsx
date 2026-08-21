import {StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import {COLORS, IMAGES} from "../../constants";
import {BASEURL_IMG} from "../../api/appUrl";
import {Image} from "expo-image";

type TDrawerHeaderItemProps = {
    key?: number | string;
    data: any,
    handleChangeChild: (data: any) => void,
}
const DrawerHeaderItem = ({data, handleChangeChild}: TDrawerHeaderItemProps) => {

    return (
        <TouchableOpacity onPress={() => handleChangeChild(data)} key={data?.id}>
            <View style={styles.itemContainer}>
                <View style={styles.itemAvatarContainer}>
                    <Image
                        source={
                            data?.photo !== ''
                                ? {uri: `${BASEURL_IMG}/${data?.photo}`}
                                : IMAGES.avatar
                        }
                        style={styles.itemAvatar}
                    />
                </View>
                <View style={styles.itemTextContainer}>
                    <Text style={styles.itemText}>
                        {data?.prenom} {data?.nom}
                    </Text>
                    <Text style={styles.itemText}>{data?.classe}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default DrawerHeaderItem;

const styles = StyleSheet.create({
    itemContainer: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: 15,
    },
    itemAvatarContainer: {
        flex: 1,
    },
    itemAvatar: {
        width: 35,
        height: 35,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    itemTextContainer: {
        flex: 4,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    itemText: {
        color: COLORS.gray,
    },
});
