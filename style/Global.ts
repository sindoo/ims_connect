import {StyleSheet} from 'react-native';
import {COLORS} from "../constants";

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    content: {
        flex: 1,
        //backgroundColor: 'red'
    },
    dayMenuContainer: {
        //flex:1,
        paddingTop: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        letterSpacing: 1,
        textAlign: 'center',
        color: COLORS.gray,
        marginBottom: 10,
    },
    periodMenu: {
        textAlign: 'center',
        //color: COLORS.grayLight,
        color: COLORS.secondary,
    },
    detailsContainer: {
        marginTop: 5,
    },
    imageMenu: {
        alignItems: 'center',
        overflow: 'hidden',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    imageMenuCover: {
        width: '100%',
        height: 210,
        aspectRatio: 135 / 76,
    },
    infoMenuContainer: {
        padding: 10,
    },
    titleH2: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingBottom: 10,
    },
    titleH3: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
    },
    entreeDish: {
        color: COLORS.gray,
        marginBottom: 5,
    },
    dish: {
        color: COLORS.gray,
        marginBottom: 5,
    },
    dessert: {
        color: COLORS.gray,
        marginBottom: 5,
    },
    paragraph: {
        color: COLORS.gray,
    },
    errorText: {
        color: 'crimson',
        marginTop: 5,
        marginLeft: 5,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    loading2 : {
        flex:1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        top: 2,
        zIndex: 10,
        backgroundColor: COLORS.white,
    },

    drawerLinkItem: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.gray,
        marginLeft: 5,
    },
});
