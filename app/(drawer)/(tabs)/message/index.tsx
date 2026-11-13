import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, FlatList } from 'react-native';
import {
    StyleSheet,
    View,
    TouchableWithoutFeedback,
    TextInput,
    Keyboard,
    TouchableOpacity,
    Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../constants';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import DiscussionThreadItem from '../../../../components/tabs/message/DiscussionThreadItem';
import Loading from '../../../../components/ui/Loading';
import ConversationService from '../../../../services/ConversationService';
import { setDiscussionTreadList } from '../../../../redux/features/message/messageSlice';
import {
    checkAppState,
    checkTokenExpired,
    updateHeaderNotificationEveryWhere,
} from '../../../../services/GeneralService';
import { useStompClient } from '../../../../hooks/useStompClient';
import {router} from "expo-router";

function MessageCenter() {
    const inputProps = { enterKeyHint: 'search' as const };
    const { t } = useTranslation();
    const { discussionTreadList } = useSelector((state: any) => state.messageCenter);
    const { selectedChild } = useSelector((state: any) => state.child);
    const { user, userToken } = useSelector((state: any) => state.user);
    const [userDiscussionList, setUserDiscussionList] = useState<any[]>([]);
    // Si la liste est déjà en cache (Redux/redux-persist) au montage, on
    // l'affiche tout de suite sans passer par l'écran de chargement plein
    // écran : le réseau ne fait que rafraîchir en tâche de fond.
    const [loading, setLoading] = useState(discussionTreadList.length === 0);
    const [search, setSearch] = useState('');
    const dispatch = useDispatch();
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    // Référence toujours à jour vers la liste actuelle des discussions, pour
    // que le handler WebSocket (enregistré une fois par connexion) puisse
    // comparer les nouvelles données à l'état courant sans dépendre d'une
    // valeur figée au moment de l'abonnement (fermeture obsolète).
    const discussionTreadListRef = useRef<any[]>(discussionTreadList);
    useEffect(() => {
        discussionTreadListRef.current = discussionTreadList;
    }, [discussionTreadList]);

    // Callback pour les mises à jour de la liste de discussions
    const handleDiscussionListUpdate = useCallback(
        (updatedList: any[]) => {
            dispatch(setDiscussionTreadList(updatedList));
            // Pas besoin de setUserDiscussionList ici : le useEffect qui
            // synchronise userDiscussionList sur discussionTreadList (Redux)
            // s'en charge déjà, ça évite un rendu redondant.
        },
        [dispatch]
    );

    // Utiliser le hook STOMP
    const { subscribe, activate, unsubscribeAll, onConnect } = useStompClient({
        userToken,
        userUuid: user?.uuid,
    });

    // S'abonner aux espaces de discussion - enregistre un handler onConnect
    useEffect(() => {
        if (!user?.uuid || !selectedChild) return;

        activate();

        // Enregistrer un handler appelé à chaque (re)connexion
        const removeOnConnect = onConnect(async () => {
            try {
                // Publier la demande de liste des espaces
                const dataToSend = {
                    userId: user.id,
                    uuid: user.uuid,
                    personId: user?.userDetails?.personDetails?.person.id,
                    nom: `${user?.userDetails?.personDetails?.person.nom} ${user?.userDetails?.personDetails?.person.prenom}`,
                    role: user.role,
                    connexionDate: 0,
                    genre: user?.userDetails?.personDetails?.person.sexe,
                    enfantNom: `${selectedChild.person.nom} ${selectedChild.person.prenom}`,
                };

                // Publier via subscribe après connexion
                // Note: on utilise le client directement ici car on est déjà dans onConnect
                const { getClient } = require('../../../../hooks/useStompClient');
                // Ce require est juste pour éviter une erreur, mais on va plutôt
                // utiliser une approche différente

                // S'abonner aux espaces
                subscribe(
                    `/chat/utilisateur/${user.uuid}/spaces`,
                    async (message) => {
                        try {
                            const discussionList = JSON.parse(message.body)
                                .sort((a: any, b: any) => a.theDate - b.theDate)
                                .reverse();

                            if (discussionList.length === 0) {
                                handleDiscussionListUpdate([]);
                                return;
                            }

                            // Filtrer pour l'enfant sélectionné
                            const filteredList = discussionList.filter(
                                (d: any) => d.enfantId === selectedChild.id
                            );

                            // On évite de re-télécharger le dernier message des
                            // discussions qui n'ont pas changé depuis la dernière
                            // fois (même id, même theDate) : seules les
                            // discussions nouvelles ou mises à jour déclenchent
                            // un appel REST. Sans ça, un message dans UNE seule
                            // conversation relançait un fetch pour TOUTES les
                            // discussions affichées.
                            const cachedById = new Map(
                                discussionTreadListRef.current.map((d: any) => [d.id, d])
                            );

                            // Récupérer les derniers messages pour chaque discussion
                            const discussionListReq = await Promise.all(
                                filteredList.map(async (discussion: any) => {
                                    const cached = cachedById.get(discussion.id);
                                    if (
                                        cached &&
                                        cached.theDate === discussion.theDate &&
                                        cached.lastMessage !== undefined
                                    ) {
                                        return {
                                            ...discussion,
                                            lastMessage: cached.lastMessage,
                                            lastMessageDate: cached.lastMessageDate,
                                            className: selectedChild?.eleves[0]?.classe?.nom,
                                        };
                                    }

                                    const messagesReq = await ConversationService.getLastMessageOfDiscussion(
                                        discussion.id,
                                        {
                                            userId: user.id,
                                            uuid: user.uuid,
                                            personId: user?.userDetails?.personDetails?.person.id,
                                            nom: `${user?.userDetails?.personDetails?.person.nom} ${user?.userDetails?.personDetails?.person.prenom}`,
                                            role: user.role,
                                        }
                                    );

                                    return {
                                        ...discussion,
                                        lastMessage: messagesReq[0]?.message || '',
                                        lastMessageDate: messagesReq[0]?.theDate || 0,
                                        className: selectedChild?.eleves[0]?.classe?.nom,
                                    };
                                })
                            );

                            const sortedList = discussionListReq.sort(
                                (a: any, b: any) => b.lastMessageDate - a.lastMessageDate
                            );

                            handleDiscussionListUpdate(sortedList);
                        } catch (error) {
                            console.error('[MessageCenter] Error processing discussion list:', error);
                        }
                    },
                    `spaces-${selectedChild.id}`
                );
            } catch (error) {
                console.error('[MessageCenter] Error in onConnect:', error);
            }
        });

        return () => {
            removeOnConnect();
            unsubscribeAll();
        };
    }, [
        user?.uuid,
        selectedChild?.id,
        activate,
        subscribe,
        onConnect,
        unsubscribeAll,
        handleDiscussionListUpdate,
    ]);

    // Charger les données initiales
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedChild || !user) {
                setLoading(false);
                return;
            }

            // Idem : si on a déjà une liste en cache, pas d'écran de
            // chargement plein écran, on rafraîchit discrètement.
            const hasCachedList = discussionTreadList.length > 0;
            if (!hasCachedList) {
                setLoading(true);
            }

            try {
                const selectedChildId = selectedChild.id;
                const classId = selectedChild?.eleves[0]?.classe?.id;
                const data = {
                    userId: user.id,
                    uuid: user.uuid,
                    nom: `${user?.userDetails?.personDetails?.person.nom} ${user?.userDetails?.personDetails?.person.prenom}`,
                    personId: user?.userDetails?.personDetails?.person.id,
                    role: user.role,
                };

                const discussionListReq = await ConversationService.getChildDiscussionList(
                    selectedChildId,
                    classId,
                    data
                );

                const discussionListFormatted = await Promise.all(
                    discussionListReq.map(async (item: any) => {
                        const lastMessage = await ConversationService.getLastMessageOfDiscussion(
                            item?.space.id,
                            data
                        );
                        return {
                            ...item?.space,
                            lastMessage: lastMessage.length > 0 ? lastMessage[0].message : '',
                            lastMessageDate: lastMessage.length > 0 ? lastMessage[0].theDate : 0,
                            className: selectedChild?.eleves[0]?.classe?.nom,
                        };
                    })
                );

                const sortedList = discussionListFormatted.sort(
                    (a: any, b: any) => b.lastUpdate - a.lastUpdate
                );

                dispatch(setDiscussionTreadList(sortedList));
                setUserDiscussionList(sortedList);
            } catch (error) {
                console.error('[MessageCenter] Error fetching discussions:', error);
            } finally {
                setLoading(false);
            }

            // Mettre à jour les notifications
            if (user) {
                await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }

            checkTokenExpired(userToken, dispatch);
        };

        fetchData().catch((error) => {
            console.error('[MessageCenter] Error:', error);
            setLoading(false);
            checkTokenExpired(userToken, dispatch);
        });

        const subscription = checkAppState(appState, setCount);
        return () => {
            subscription.remove();
        };
    }, [selectedChild?.id, count]);

    // Synchroniser la liste locale avec Redux
    useEffect(() => {
        setUserDiscussionList(discussionTreadList);
    }, [discussionTreadList]);

    const handleSearchDiscussionTread = useCallback(() => {
        if (search.trim()) {
            setLoading(true);
            const filterDiscussionList = discussionTreadList.filter((item: any) => {
                const initiatorNom = item.initiatorNom?.toLowerCase() || '';
                const objet = item.objet?.toLowerCase() || '';
                const searchLower = search.toLowerCase();
                return initiatorNom.includes(searchLower) || objet.includes(searchLower);
            });
            setUserDiscussionList(filterDiscussionList);
            setLoading(false);
        } else {
            setUserDiscussionList(discussionTreadList);
        }
    }, [search, discussionTreadList]);

    const handleClearSearch = useCallback(() => {
        setSearch('');
        setUserDiscussionList(discussionTreadList);
    }, [discussionTreadList]);

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.searchToolbar}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={20} color={COLORS.gray} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('message.search')}
                            placeholderTextColor={COLORS.gray}
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={handleSearchDiscussionTread}
                            {...inputProps}
                        />
                        <TouchableOpacity onPress={handleClearSearch}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.editIconBox}>
                        <TouchableOpacity
                            onPress={() => {
                                router.push('/pages/message/new-conversation');
                            }}
                        >
                            <View style={styles.editIcon}>
                                <MaterialIcons name="comment" size={24} color={COLORS.white} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.messageListContainer}>
                    {userDiscussionList.length === 0 && (
                        <View style={{ flex: 1 }}>
                            <Text style={{ flex: 1, textAlign: 'center' }}>
                                {t('message.empty_message')}
                            </Text>
                        </View>
                    )}

                    {userDiscussionList.length > 0 && (
                        <FlatList
                            style={{ paddingLeft: 15, paddingRight: 15 }}
                            data={userDiscussionList}
                            keyExtractor={(item: any) => item.id.toString()}
                            onEndReachedThreshold={0}
                            initialNumToRender={12}
                            maxToRenderPerBatch={10}
                            windowSize={7}
                            renderItem={({ item }) => (
                                <DiscussionThreadItem
                                    key={`user-discussion-${item.id}`}
                                    discussionThread={item}
                                />
                            )}
                        />
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default MessageCenter;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
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
    editIconBox: {
        flex: 1,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editIcon: {
        width: 45,
        height: 45,
        backgroundColor: COLORS.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 80,
    },
    messageListContainer: {
        flex: 4,
        paddingBottom: 15,
        paddingTop: 30,
    },
});
