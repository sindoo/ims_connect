import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, AppState, RefreshControl} from "react-native";
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from "../../../../style/Global";
import {COLORS, IMAGES} from "../../../../constants";
import ViewThemed from "../../../../components/ui/ViewThemed";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import {ImageBackground} from "expo-image";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import ImsDayInfoItem from "../../../../components/tabs/imsday/ImsDayInfoItem";
import ImsDayService from "../../../../services/ImsDayService";
import MenuYearService from "../../../../services/MenuYearService";
import {checkAppState, checkTokenExpired} from "../../../../services/GeneralService";
import WeekService from "../../../../services/WeekService";
import Loading from "../../../../components/ui/Loading";

const ImsDayHome = (props) => {
import {apiErrorMessage} from '../../../../api/ApiManager';
    const {snackbarShowMessage} = props;
    const {t} = useTranslation();
    const [imsDayList, setImsDayList] = useState<any>([]);
    const [imsDayInfo, setImsDayInfo] = useState<any>(null);
    const [menuJourList, setMenuJourList] = useState([]);
    const [menuCanteenList, setMenuCanteenList] = useState<any>([]);
    const [dishList, setDishList] = useState<any>([]);
    const [imsDayMenuData, setImsDayMenuData] = useState<any>(null);
    const [parentCommentStatus, setParentCommentStatus] = useState(false);
    const [index, setIndex] = useState(-1);
    const [weekData, setWeekData] = useState<any>([]);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state:any) => state.user);
    const [loading, setLoading] = useState(true);
    // ✅ Même mécanisme que home/index.tsx (HomeScreen) : distingue le tout
    // premier chargement des rechargements suivants (retour sur l'onglet,
    // changement d'enfant), pour n'afficher le <Loading/> plein écran
    // qu'une seule fois.
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [menuYearLoading, setMenuYearLoading] = useState(true);
    const [commentParent, setCommentParent] = useState<any>(null);
    const dispatch = useDispatch();
    const {stackStatus} = useSelector((state:any) => state.stackScreen);
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    const handleTextChange = useCallback((text: any) => {
        setCommentParent(text);
    }, []);

    const saveParentObservation = useCallback(async (index: number, comment: string) => {
        try {
            setParentCommentStatus(true);
            if (comment !== '' && imsDayInfo !== null) {
                const dataToSend = {
                    ...imsDayInfo,
                    commentaireParent: comment,
                };

                const response = await ImsDayService.getImsDay(imsDayInfo.id, dataToSend);
                setImsDayInfo(response);
                // ✅ On construit un nouveau tableau au lieu de muter
                // imsDayList en place : setImsDayList(imsDayList) avec la
                // même référence ne déclenchait pas forcément le re-rendu
                // attendu (React compare la référence de l'état).
                setImsDayList(prevList => {
                    const updatedList = [...prevList];
                    updatedList[index] = response;
                    return updatedList;
                });
                snackbarShowMessage(t('snackBar.sb_succes_save'));
            }
        }
        catch (error) {
            snackbarShowMessage(apiErrorMessage(error, t('snackBar.sb_error')));
            console.log(error);
            setParentCommentStatus(false);
        }
    }, [imsDayInfo, snackbarShowMessage, t]);

    // ✅ Logique de résolution du menu du jour factorisée : utilisée par
    // handleForward, handleBack et le chargement initial, elle évite de
    // dupliquer 3 fois la même suite d'appels.
    const resolveDayMenu = useCallback(async (imsDayInformation: any) => {
        const dayMenuFind: any = menuJourList.find(
            (menuJour: any) => menuJour.id === imsDayInformation?.menuJourId,
        );
        const weekFind = weekData.find(
            (week: any) => week.id == dayMenuFind?.semaineId,
        );

        if (dayMenuFind !== undefined && weekFind !== undefined) {
            const dayListMenuTab = MenuYearService.getMenuDayList(
                menuJourList,
                dayMenuFind,
                weekFind,
                menuCanteenList,
                dishList,
            );
            return dayListMenuTab.length > 0 ? dayListMenuTab[0] : null;
        }

        if (dayMenuFind === undefined) {
            const dayMenuFounded = await MenuYearService.getMenuJour(imsDayInformation?.menuJourId);
            const dayListMenuTab: any = MenuYearService.getMenuDayListWithoutWeek(
                dayMenuFounded,
                menuCanteenList,
                dishList,
            );
            return dayListMenuTab.length > 0 ? dayListMenuTab[0] : null;
        }

        return null;
    }, [menuJourList, weekData, menuCanteenList, dishList]);

    const handleForward = useCallback(async (index: number) => {
        setLoading(true);
        if (imsDayList.length > 0) {
            if (index + 1 <= imsDayList.length) {
                setIndex(index + 1);
                setParentCommentStatus(false);
                const imsDayInformation = imsDayList[index + 1];
                setImsDayInfo(imsDayInformation);
                setImsDayMenuData(await resolveDayMenu(imsDayInformation));
            } else {
                setIndex(imsDayList.length);
            }
        }
        setLoading(false);
    }, [imsDayList, resolveDayMenu]);

    const handleBack = useCallback(async (index: number) => {
        setLoading(true);
        if (imsDayList.length > 0) {
            if (index - 1 >= 0) {
                const imsDayInformation = imsDayList[index - 1];
                setImsDayInfo(imsDayInformation);
                setIndex(index - 1);
                setParentCommentStatus(false);
                setImsDayMenuData(await resolveDayMenu(imsDayInformation));
            }
            else {
                setIndex(0);
            }
        }
        setLoading(false);
    }, [imsDayList, resolveDayMenu]);

    // ✅ Regroupe la remise à vide de l'état (utilisée seulement quand il
    // n'y a réellement rien à afficher : aucun enfant sélectionné, ou
    // aucune journée IMS pour cet enfant) - jamais en préambule d'un
    // rechargement, pour ne pas faire disparaître le contenu déjà affiché.
    const resetImsDayState = useCallback(() => {
        setImsDayList([]);
        setImsDayInfo(null);
        setIndex(-1);
        setMenuCanteenList([]);
        setDishList([]);
        setImsDayMenuData(null);
    }, []);

    // ✅ Fonction de chargement extraite dans un useCallback (au lieu d'une
    // fonction anonyme déclarée à l'intérieur d'un useEffect) : elle peut
    // ainsi être réutilisée à la fois au montage et à chaque retour sur cet
    // onglet, via useFocusEffect ci-dessous.
    //
    // ✅ Rendu aussi fluide que home/index.tsx : on ne vide plus
    // imsDayList/imsDayInfo/... au tout début de chaque rechargement. Les
    // nouvelles valeurs remplacent directement les anciennes une fois
    // connues, donc le contenu déjà affiché reste visible pendant le
    // rechargement au lieu de disparaître puis réapparaître à chaque retour
    // sur l'onglet. Le vidage (resetImsDayState) n'intervient plus que dans
    // les cas où il n'y a réellement rien à montrer.
    const fetchImsDayData = useCallback(async () => {
        try {
            setLoading(true);
            // ✅ Remet aussi "menuYearLoading" à true à chaque rechargement
            // (pas seulement au tout premier rendu via useState(true)).
            // Sans ça, le petit indicateur de chargement du menu ne
            // réapparaissait plus lors des rechargements suivants (ex:
            // retour sur l'onglet), puisque menuYearLoading restait à
            // "false" depuis le chargement précédent.
            setMenuYearLoading(true);

            if(selectedChild !== null) {
                // ALL IMS DAY MENU LIST
                const childImsDayList = await ImsDayService.getChildImsDay(selectedChild.person.id);
                // CONNECTED CHILD IMS DAY LIST
                if (childImsDayList.length > 0) {
                    setImsDayList(childImsDayList);
                    const imsDayInformation = childImsDayList[childImsDayList.length - 1];
                    setImsDayInfo(imsDayInformation);
                    setIndex(childImsDayList.length - 1);
                    // ✅ Affichage immédiat de la journée IMS dès qu'elle est
                    // connue : le menu (ci-dessous) continue de charger en
                    // arrière-plan derrière son propre indicateur
                    // (menuYearLoading), sans bloquer le reste de l'écran.
                    setLoading(false);
                    setHasLoadedOnce(true);

                    // ✅ Ces 4 appels sont indépendants les uns des autres :
                    // ils étaient auparavant enchaînés en séquence (4
                    // allers-retours réseau l'un après l'autre). Les
                    // regrouper dans un seul Promise.all ramène ce temps
                    // au plus lent des 4 au lieu de leur somme.
                    const [menuJourListRequest, menuCanteenRequest, dishRequestList, weekListRequest] = await Promise.all([
                        MenuYearService.getMenuByDayList(),
                        MenuYearService.getMenuCanteen(),
                        MenuYearService.getPlatCanteen(),
                        WeekService.getAllWeekData(),
                    ]);
                    setMenuJourList(menuJourListRequest);
                    setMenuCanteenList(menuCanteenRequest);
                    setDishList(dishRequestList);
                    setWeekData(weekListRequest);

                    let dayMenuFind = menuJourListRequest.find(
                        (menuJour: any) => menuJour.id === imsDayInformation?.menuJourId,
                    );

                    if (dayMenuFind === undefined) {
                        dayMenuFind = await MenuYearService.getMenuJour(imsDayInformation?.menuJourId);
                    }

                    const weekFind = weekListRequest.find(
                        (week: any) => week.id == dayMenuFind?.semaineId,
                    );

                    // ✅ Le résultat est maintenant calculé puis appliqué en
                    // un seul setImsDayMenuData (au lieu d'être réparti dans
                    // des branches qui, pour certaines, ne l'appelaient pas
                    // du tout) : sa valeur reflète toujours le jour
                    // réellement résolu, sans dépendre d'un vidage préalable
                    // à "null" pour être correcte dans le cas où aucune
                    // correspondance n'est trouvée.
                    let resolvedMenu = null;
                    if (dayMenuFind !== undefined && weekFind !== undefined) {
                        const dayListMenuTab = MenuYearService.getMenuDayList(
                            menuJourListRequest,
                            dayMenuFind,
                            weekFind,
                            menuCanteenRequest,
                            dishRequestList,
                        );
                        resolvedMenu = dayListMenuTab.length > 0 ? dayListMenuTab[0] : null;
                    }
                    else if (dayMenuFind !== undefined) {
                        const dayListMenuTab = MenuYearService.getMenuDayListWithoutWeek(
                            dayMenuFind,
                            menuCanteenRequest,
                            dishRequestList,
                        );
                        resolvedMenu = dayListMenuTab.length > 0 ? dayListMenuTab[0] : null;
                    }
                    setImsDayMenuData(resolvedMenu);
                } else {
                    // Aucune journée IMS pour cet enfant : contrairement au
                    // cas ci-dessus, ce n'est pas un rafraîchissement mais
                    // une absence réelle de données, donc on vide l'état.
                    resetImsDayState();
                }
                setMenuYearLoading(false);
            } else {
                // Aucun enfant sélectionné : rien à afficher.
                resetImsDayState();
                setMenuYearLoading(false);
            }

            setLoading(false);
            setHasLoadedOnce(true);
            if(user !== null) {
                // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                //await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }

            checkTokenExpired(userToken, dispatch);
        }
        catch (error) {
            console.log(error);
            setLoading(false);
            setHasLoadedOnce(true);
            checkTokenExpired(userToken, dispatch);
        }
    }, [selectedChild, user, userToken, dispatch, resetImsDayState]);

    // ✅ REMPLACE l'ancien useEffect(() => {...}, [selectedChild]), qui ne
    // se relançait qu'au montage ou quand l'enfant sélectionné changeait.
    // Cet écran était jusqu'ici rafraîchi uniquement grâce à
    // "unmountOnBlur: true" dans _layout.tsx (qui démonte/remonte tout le
    // composant à chaque fois qu'on revient sur l'onglet - coûteux et
    // source d'un flash de <Loading/> à chaque retour). useFocusEffect
    // recharge les données à chaque focus de l'onglet SANS démonter le
    // composant. Si vous appliquez ce changement, pensez à retirer
    // "unmountOnBlur: true" pour "imsday/index" dans _layout.tsx : les deux
    // mécanismes combinés fonctionnent, mais unmountOnBlur devient inutile
    // et continue de provoquer un remount complet à chaque fois.
    useFocusEffect(
        useCallback(() => {
            fetchImsDayData();
        }, [fetchImsDayData])
    );

    // ✅ Séparé de la logique de chargement des données : cet abonnement à
    // l'état de l'application (premier plan/arrière-plan) n'a pas de lien
    // avec l'enfant sélectionné ni avec le focus de l'onglet, il ne doit
    // donc s'installer qu'une seule fois, au montage du composant.
    useEffect(() => {
        const subscription = checkAppState(appState, setCount);

        return () => {
            subscription.remove();
        };
    }, []);

    // ✅ Même logique que home/index.tsx (HomeScreen) : "loading" repasse à
    // true à chaque rechargement (retour sur l'onglet, changement
    // d'enfant), mais seul le tout premier chargement doit remplacer tout
    // l'écran par <Loading/>. Les rechargements suivants laissent le
    // contenu déjà affiché en place le temps que les nouvelles données
    // arrivent, au lieu de faire disparaître puis réapparaître tout
    // l'écran à chaque clic sur l'onglet.
    const initialLoading = loading && !hasLoadedOnce;

    if (initialLoading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={[globalStyles.container, styles.containerBorder]}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchImsDayData} />
                }
            >
                <ImageBackground
                    source={IMAGES.backgroundImageApp}
                    contentFit="cover"
                    style={styles.backgroundImage}>
                    <View style={styles.myImsDayContainer}>
                        {imsDayList.length === 0 && (
                            <Text style={styles.emptyImsDayText}>
                                {t('myDayAtIms.empty_ims_day')}
                            </Text>
                        )}

                        {imsDayInfo !== null && (
                            <ImsDayInfoItem
                                styles={styles}
                                index={index}
                                imsDayMenuData={imsDayMenuData}
                                imsDayInfo={imsDayInfo}
                                parentCommentStatus={parentCommentStatus}
                                setParentCommentStatus={setParentCommentStatus}
                                saveParentObservation={saveParentObservation}
                                handleBack={handleBack}
                                handleForward={handleForward}
                                size={imsDayList.length - 1}
                                commentParent={commentParent}
                                setCommentParent={setCommentParent}
                                handleTextChange={handleTextChange}
                                menuYearLoading={menuYearLoading}
                                setMenuYearLoading={setMenuYearLoading}
                                //handleTextChange={handleTextChange}
                            />
                        )}
                    </View>
                </ImageBackground>
            </ScrollView>
        </ViewThemed>
    );
};

export default withSnackbar(ImsDayHome);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    containerBorder: {
        borderTopColor: COLORS.greyMedium,
        borderTopWidth: 1,
    },
    backgroundImage: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    myImsDayContainer: {
        paddingTop: 15,
    },
    emptyImsDayText: {
        textAlign: 'center',
        color: COLORS.gray,
    },
    imsDayHeader: {
        flex: 1,
        flexDirection: 'row',
    },
    previousButton: {
        flex: 1,
        paddingLeft: 15,
        justifyContent: 'center',
    },
    imsDayHeaderTitle: {
        flex: 4,
    },
    nextButton: {
        flex: 1,
        paddingRight: 15,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    howIateContainer: {
        padding: 10,
        paddingTop: 20,
    },
    napTimeContainer: {
        padding: 10,
        paddingTop: 20,
    },
    imsDayItem: {
        flex: 1,
        flexDirection: 'row',
    },
    imsDayItemText: {
        flex: 1,
        //height: 80,
    },
    imsDayItemImage: {
        flex: 1,
        alignItems: 'center',
        overflow: 'hidden',
    },
    dayItemImageCover: {
        width: '100%',
        height: 80,
    },
    bowelContainer: {
        padding: 10,
        paddingTop: 20,
    },
    injuriesContainer: {
        padding: 10,
        paddingTop: 20,
    },
    parentComment: {
        padding: 10,
        paddingTop: 20,
        marginBottom: 15,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
        color: COLORS.gray,
    },
    imsDayWhatIneed: {
        //flex: 1,
        //flexDirection: 'row',
        paddingTop: 10,
        paddingLeft: 15,
        paddingRight: 15,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
});
