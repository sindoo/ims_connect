import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    TouchableWithoutFeedback,
    TextInput,
    Keyboard,
    TouchableOpacity,
    FlatList,
    Text,
    ActivityIndicator,
    Alert,
    Platform,
    AppState,
} from 'react-native';
import { KeyboardStickyView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { COLORS, IMAGES } from '../../../constants';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BASEURL_IMG } from '../../../api/appUrl';
import { putRequest, uploadFileRequest } from '../../../api/ApiManager';
import { globalStyles } from '../../../style/Global';
import EmployeeMessageItem from '../../../components/tabs/message/EmployeeMessageItem';
import ParentMessageItem from '../../../components/tabs/message/ParentMessageItem';
import ParticipantMessageItem from '../../../components/tabs/message/ParticipantMessageItem';
import ParentTwoMessageItem from '../../../components/tabs/message/ParentTwoMessageItem';
import { useDispatch, useSelector } from 'react-redux';
import {
    setDiscussionTreadList,
    updateDiscussionTreadList,
} from '../../../redux/features/message/messageSlice';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { withSnackbar } from '../../../components/ui/SnackbarHOC';
import ConversationService from '../../../services/ConversationService';
import Loading from '../../../components/ui/Loading';
import UtilitiesService from '../../../services/UtilitiesService';
import LetterAvatar from '../../../components/ui/LetterAvatar';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useStompClient } from '../../../hooks/useStompClient';
import { IMessage } from '@stomp/stompjs';

// Cache mémoire partagé entre toutes les instances de l'écran Conversation :
// les infos d'une classe (classeId) ne changent pas d'une conversation à
// l'autre, donc on évite de la re-télécharger à chaque fois qu'on rouvre une
// conversation de la même classe.
const classroomCache: Record<string, any> = {};

function Conversation({
                          navigation,
                          snackbarShowMessage,
                      }: {
    navigation: any;
    snackbarShowMessage: any;
}) {
    const { discussionThreadId } = useLocalSearchParams();
    const [classroomTeach, setClassroomTeach] = useState('');
    const { user, userToken } = useSelector((state: any) => state.user);
    const { selectedChild } = useSelector((state: any) => state.child);
    const { discussionTreadList } = useSelector((state: any) => state.messageCenter);
    // Démarre à true : sans ça, le tout premier rendu (avant que le
    // useEffect de chargement n'ait pu s'exécuter) affiche brièvement l'écran
    // vide (header, liste sans messages) avant que le loading ne s'affiche à
    // son tour juste après — d'où le flash de contenu avant le spinner.
    const [loading, setLoading] = useState(true);
    const [messageList, setMessageList] = useState<any[]>([]);
    const { t } = useTranslation();
    const [userMessage, setUserMessage] = useState<string>('');
    const [sendButtonStatus, setSendButtonStatus] = useState(true);
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingFileStatus, setSavingFileStatus] = useState(false);
    const [statusFil, setStatusFil] = useState(false);
    const [scrollHeight, setScrollHeight] = useState(0);
    const scrollViewRef = useRef<FlatList>(null);
    // Mémorise l'id du dernier thread réellement chargé, pour ne montrer le
    // loading plein écran que lors d'un vrai changement de conversation (voir
    // le useEffect "Charger les données initiales" plus bas).
    const loadedThreadIdRef = useRef<string | number | null>(null);
    const dispatch = useDispatch();

    // Hauteur animée du clavier (négative pendant l'ouverture) : sert à
    // réduire dynamiquement l'espace visible de la liste de messages pour
    // qu'elle ne se retrouve jamais masquée sous la zone de saisie collée
    // au clavier (KeyboardStickyView), au lieu d'être poussée au-dessus.
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const animatedConversationStyle = useAnimatedStyle(() => ({
        paddingBottom: Math.abs(keyboardHeight.value),
    }));

    // Trouver le thread de discussion
    const discussionThread = useMemo(
        () => discussionTreadList.find((thread: any) => thread.id.toString() === discussionThreadId),
        [discussionTreadList, discussionThreadId]
    );

    // Utiliser le hook STOMP optimisé
    const {
        subscribe,
        publish,
        unsubscribeAll,
        activate,
        deactivate,
        onConnect,
    } = useStompClient({
        userToken,
        userUuid: user?.uuid,
    });

    // Fonction pour récupérer la liste des messages
    // Renvoie null en cas d'échec réseau (à distinguer d'une conversation vide : [])
    // pour que les appelants ne remplacent jamais la liste affichée par une liste vide
    // suite à une simple coupure réseau (ex: retour au premier plan de l'app).
    //
    // Dépendance volontairement réduite à discussionThread?.id (et non l'objet
    // discussionThread entier) : cet objet est recréé par Redux à chaque message
    // (updateDiscussionTreadList), donc le garder en dépendance recréait cette
    // fonction en permanence, ce qui redéclenchait le useEffect de chargement
    // initial (loading plein écran) à chaque envoi de message alors que l'id
    // de la conversation, lui, ne change pas.
    const updateMessageList = useCallback(async (): Promise<any[] | null> => {
        if (!discussionThread || !selectedChild || !user) return null;

        try {
            const dataToSend = {
                userId: user.id,
                uuid: user.uuid,
                nom: `${t('message.parent')} ${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
                personId: user?.userDetails?.personDetails?.person.id,
                role: user.role,
                photo: user?.userDetails?.personDetails?.person.photo,
            };

            const response = await putRequest(
                '',
                `/ws/chat/messages/space/${discussionThread.id}`,
                dataToSend
            );

            if (response !== undefined && response !== null && response !== '') {
                return response.sort((a: any, b: any) => a.theDate - b.theDate);
            }
            return [];
        } catch (error) {
            console.error('[Conversation] Error updating message list:', error);
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discussionThread?.id, selectedChild, user, t]);

    // Callback pour les nouveaux messages
    const handleNewMessage = useCallback(
        async (message: IMessage) => {
            if (!discussionThread || !selectedChild || !user) return;

            try {
                const response = await ConversationService.getOneDiscussionTreadList(
                    discussionThread,
                    user,
                    selectedChild
                );

                if (response !== undefined) {
                    dispatch(updateDiscussionTreadList(response));
                    const discussionTreadMessageList = await updateMessageList();
                    if (discussionTreadMessageList !== null) {
                        setMessageList(discussionTreadMessageList);
                    }
                    setUserMessage('');
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            } catch (error) {
                console.error('[Conversation] Error handling new message:', error);
            }
        },
        // Même logique que updateMessageList : ne pas dépendre de l'objet
        // discussionThread entier pour éviter de recréer ce callback (et donc
        // de réabonner le WebSocket) à chaque message.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [discussionThread?.id, selectedChild, user, dispatch, updateMessageList]
    );

    // S'abonner au canal de messages - enregistre un handler onConnect
    useEffect(() => {
        if (!discussionThread || !user?.uuid || !selectedChild) return;

        // Activer le client
        activate();

        // Enregistrer un handler qui sera appelé à chaque connexion
        const removeOnConnect = onConnect(() => {
            // Cette fonction sera appelée à chaque (re)connexion
            subscribe(
                `/chat/utilisateur/${user.uuid}/message`,
                handleNewMessage,
                `message-${discussionThread.id}`
            );
        });

        // Cleanup : se désabonner, puis fermer réellement la connexion.
        // unsubscribeAll() seul ne suffit pas : le WebSocket sous-jacent
        // restait ouvert indéfiniment après avoir quitté l'écran.
        return () => {
            removeOnConnect();
            unsubscribeAll();
            deactivate();
        };
    }, [
        discussionThread?.id,
        user?.uuid,
        selectedChild?.id,
        activate,
        subscribe,
        handleNewMessage,
        onConnect,
        unsubscribeAll,
        deactivate,
    ]);

    // Charger les données initiales
    useEffect(() => {
        const fetchData = async () => {
            if (!discussionThread || !selectedChild || !user) return;

            // discussionTreadList (Redux) est régulièrement recréée en entier par
            // les mises à jour WebSocket de la liste des conversations (index.tsx),
            // parfois avec un état transitoire où le thread courant en est
            // temporairement absent. Ça fait passer discussionThread par
            // `undefined` puis revenir avec le même id, ce qui redéclenche ce
            // useEffect. On ne montre donc le loading plein écran que lors d'un
            // vrai changement de conversation, pas quand on retrouve la même.
            const isSameThreadAsBefore = loadedThreadIdRef.current === discussionThread.id;
            if (!isSameThreadAsBefore) {
                setLoading(true);
            }

            try {
                // Les deux appels sont indépendants : on les lance en parallèle
                // plutôt qu'en série, et on réutilise le cache classroom quand
                // c'est possible pour éviter un aller-retour réseau inutile.
                const classroomId = discussionThread.classeId;
                const classroomPromise = classroomCache[classroomId]
                    ? Promise.resolve(classroomCache[classroomId])
                    : UtilitiesService.getClassroomById(classroomId).then((res: any) => {
                        if (res !== undefined) {
                            classroomCache[classroomId] = res;
                        }
                        return res;
                    });

                const [classRequest, discussionTreadMessageList] = await Promise.all([
                    classroomPromise,
                    updateMessageList(),
                ]);

                if (classRequest !== undefined) {
                    setClassroomTeach(classRequest.nom);
                }

                setMessageList(discussionTreadMessageList ?? []);
                setStatusFil(discussionThread?.filEtat === 'CLOS');
                loadedThreadIdRef.current = discussionThread.id;
            } catch (error) {
                console.error('[Conversation] Error fetching data:', error);
            } finally {
                if (!isSameThreadAsBefore) {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [discussionThread?.id, selectedChild?.id, user?.id, updateMessageList]);

    // Filet de sécurité : loading démarre désormais à true pour éviter le
    // flash de contenu avant l'écran de chargement (voir plus haut). Si le
    // thread ne se résout jamais (id invalide, course avant que Redux soit
    // peuplé), l'effet ci-dessus ne passera jamais loading à false puisque son
    // garde-fou retourne avant. On évite donc de rester bloqué indéfiniment
    // sur le spinner en le désactivant après quelques secondes dans ce cas
    // précis.
    useEffect(() => {
        if (discussionThread) return;

        const timeout = setTimeout(() => {
            setLoading(false);
        }, 8000);

        return () => clearTimeout(timeout);
    }, [discussionThread]);

    // Garder le dernier message visible quand le clavier s'ouvre
    // (la zone visible se réduit une fois la KeyboardAvoidingView appliquée)
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const showSub = Keyboard.addListener(showEvent, () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });

        return () => showSub.remove();
    }, []);

    // Retenter le chargement des messages au retour au premier plan.
    // Juste après un retour de background, le réseau (et le WebSocket)
    // peut ne pas être encore totalement rétabli : la requête REST lancée
    // trop tôt échoue alors avec un Network Error. On laisse donc un court
    // délai avant de retenter, sans jamais vider la liste déjà affichée
    // si cette nouvelle tentative échoue aussi (cf. updateMessageList).
    useEffect(() => {
        const appStateRef = { current: AppState.currentState };

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            const cameToForeground =
                !!appStateRef.current.match(/background|inactive/) && nextAppState === 'active';
            appStateRef.current = nextAppState;

            if (cameToForeground && discussionThread) {
                setTimeout(async () => {
                    const refreshed = await updateMessageList();
                    if (refreshed !== null) {
                        setMessageList(refreshed);
                    }
                }, 800);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [discussionThread?.id, updateMessageList]);

    const handleContentChange = (text: string) => {
        setUserMessage(text);
        setSendButtonStatus(text.trim() === '');
    };

    // Extrait pour ne pas recréer une closure JSX à chaque rendu du FlatList
    const renderMessageItem = useCallback(({ item: message }: { item: any }) => {
        if (message.userId === user?.id && message.roleUser === 'PARENT') {
            return <ParentMessageItem message={message} parentChoice={1} />;
        } else if (message.userId !== user?.id && message.roleUser === 'PARENT') {
            return <ParentTwoMessageItem message={message} />;
        } else if (message.roleUser === 'TEACHER') {
            return <EmployeeMessageItem message={message} />;
        } else if (message.roleUser === 'ADMIN') {
            return <ParticipantMessageItem message={message} />;
        }
        return null;
    }, [user?.id]);

    const selectFile = async () => {
        if (!discussionThread || !user || !selectedChild) return;

        try {
            const [doc] = await pick({
                type: [types.images, types.pdf, types.doc, types.csv, types.docx, types.pptx, types.ppt],
            });

            const formData = new FormData();
            formData.append('fichier', {
                uri: doc.uri,
                type: doc.type,
                name: doc.name,
            });

            setSavingFileStatus(true);
            const response = await uploadFileRequest('POST', '', '/ws/chat/fichier/mobile', formData);

            const userChatModel = {
                userId: user.id,
                uuid: user.uuid,
                nom: `${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
                personId: user?.userDetails?.personDetails?.person.id,
                role: user.role,
                photo: user?.userDetails?.personDetails?.person.photo,
            };

            const messageDto = {
                id: null,
                userId: user.id,
                userUuid: user.uuid,
                filDiscussionId: discussionThread.id,
                message: '',
                theDate: new Date().getTime(),
                userNom: `${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
                userPhoto: user?.userDetails?.personDetails?.person?.photo,
                roleUser: 'PARENT',
                fichier: response.data,
                typeFichier: doc.type?.includes('image') ? 'image' : 'document',
                nomFichier: doc.name,
            };

            // Publier via le hook (le hook gère automatiquement le queueing)
            publish('/app/chat/sendMessage', {
                userChatModel,
                message: messageDto,
            });

            setTimeout(async () => {
                // Filet de sécurité : messageList ne se met normalement à jour
                // que via le push WebSocket (handleNewMessage). Si ce push
                // n'arrive pas (connexion instable, reconnexion en cours...),
                // le fichier envoyé ne serait jamais visible dans la liste
                // malgré un envoi réussi côté serveur. On revérifie donc via
                // REST, indépendamment du WebSocket.
                const refreshed = await updateMessageList();
                if (refreshed !== null) {
                    setMessageList(refreshed);
                }
                scrollViewRef.current?.scrollToEnd({ animated: true });
                setSavingFileStatus(false);
            }, 2000);
        } catch (err) {
            if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
                // L'utilisateur a simplement fermé le sélecteur sans choisir de fichier
                // (bouton retour, geste de fermeture...) : ce n'est pas une erreur.
            } else {
                console.error('[Conversation] Error sending file:', err);
            }
            setSavingFileStatus(false);
        }
    };

    const sendMessage = async () => {
        if (!userMessage.trim() || userMessage.length < 2) return;
        if (!selectedChild || !user || !discussionThread) return;

        setSavingStatus(true);

        const userChatModel = {
            userId: user.id,
            uuid: user.uuid,
            nom: `${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
            personId: user?.userDetails?.personDetails?.person.id,
            role: user.role,
            photo: user?.userDetails?.personDetails?.person.photo,
        };

        const messageDto = {
            id: null,
            userId: user.id,
            userUuid: user.uuid,
            filDiscussionId: discussionThread.id,
            message: userMessage,
            theDate: new Date().getTime(),
            userNom: `${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
            userPhoto: user?.userDetails?.personDetails?.person?.photo,
            roleUser: 'PARENT',
        };


        // Publier via le hook (le hook gère automatiquement le queueing)
        publish('/app/chat/sendMessage', {
            userChatModel,
            message: messageDto,
        });

        setUserMessage('');
        setSendButtonStatus(true);

        setTimeout(async () => {
            // Même filet de sécurité que selectFile() : messageList ne dépend
            // sinon que du push WebSocket pour se mettre à jour.
            const refreshed = await updateMessageList();
            if (refreshed !== null) {
                setMessageList(refreshed);
            }
            scrollViewRef.current?.scrollToEnd({ animated: true });
            setSavingStatus(false);
        }, 1000);
    };

    const deleteDiscussionListAlert = () => {
        Alert.alert(t('message.delete_discussion_title'), t('message.message_discussion'), [
            {
                text: t('message.cancel_btn'),
                onPress: () => {},
                style: 'cancel',
            },
            {
                text: t('message.confirm_btn'),
                onPress: async () => {
                    try {

                        if (selectedChild && user && discussionThread) {
                            const discussionTreadListRes = await ConversationService.deleteDiscussionList(
                                selectedChild,
                                user,
                                discussionThread,
                                discussionTreadList
                            );
                            dispatch(setDiscussionTreadList(discussionTreadListRes));
                            navigation?.goBack();
                        }
                    } catch (error) {
                        snackbarShowMessage(t('snackBar.sb_error_delete'));
                        console.error('[Conversation] Error deleting discussion:', error);
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={globalStyles.loading}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.interlocutorContainer}>
                    <View style={styles.messageImage}>
                        {discussionThread?.initiatorRole === 'PARENT' ? (
                            <LetterAvatar name={discussionThread?.className} size={65} />
                        ) : (
                            <Image
                                source={
                                    discussionThread?.initiatorPhoto
                                        ? { uri: `${BASEURL_IMG}/${discussionThread.initiatorPhoto}` }
                                        : IMAGES.avatar
                                }
                                contentFit="cover"
                                style={styles.messageImageCover}
                            />
                        )}
                    </View>
                    <View style={styles.messageTextContainer}>
                        <Text style={styles.interlocutor}>
                            {discussionThread?.initiatorRole === 'PARENT'
                                ? t('message.to_teachers')
                                : discussionThread?.initiatorNom}
                        </Text>
                        <Text style={styles.messageText}>
                            {discussionThread?.initiatorRole === 'PARENT'
                                ? discussionThread?.className
                                : discussionThread?.initiatorRole}
                        </Text>
                        {discussionThread?.initiatorRole === 'TEACHER' && (
                            <Text style={styles.messageText}>{classroomTeach}</Text>
                        )}
                        <View style={styles.closeContainerStatus}>
                            {discussionThread?.filEtat === "CLOS" && (
                                <Text style={styles.closeStatus}>{t('message.conversation_close')}</Text>
                            )}
                        </View>
                    </View>
                    {discussionThread?.initiatorUserId === user?.id && (
                        <TouchableOpacity onPress={deleteDiscussionListAlert} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="dots-vertical" size={28} color={COLORS.secondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ paddingLeft: 20, paddingRight: 20, marginTop: 15 }}>
                    <Text>
                        {t('message.objet')} : {discussionThread?.objet}
                    </Text>
                </View>

                {/* Liste des messages */}
                <View style={styles.messageListContainer}>
                    <Animated.View style={[styles.conversationContainer, animatedConversationStyle]}>
                        <FlatList
                            style={{ paddingLeft: 15, paddingRight: 15 }}
                            ref={scrollViewRef}
                            data={messageList}
                            keyExtractor={(message: any) => message.id.toString()}
                            renderItem={renderMessageItem}
                            onContentSizeChange={(width, height) => setScrollHeight(height)}
                            initialNumToRender={15}
                            maxToRenderPerBatch={10}
                            windowSize={7}
                        />
                    </Animated.View>

                    {/* Zone de saisie */}
                    <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
                        <View style={styles.textareaContainer}>
                            <View style={styles.textareaFieldContainer}>
                                <View style={styles.fileUploadContanier}>
                                    {savingFileStatus ? (
                                        <Loading size="small" />
                                    ) : (
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={selectFile}
                                            disabled={statusFil}
                                        >
                                            <MaterialIcons
                                                name="attach-file"
                                                size={28}
                                                color={statusFil ? COLORS.grayVeryLight : COLORS.grayLight}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.textareaField}>
                                    <TextInput
                                        multiline
                                        style={styles.inputModal}
                                        placeholder={t('conversationMessage.title')}
                                        placeholderTextColor={statusFil ? COLORS.grayVeryLight : COLORS.gray}
                                        value={userMessage}
                                        editable={!statusFil}
                                        onChangeText={handleContentChange}
                                    />
                                </View>

                                <View style={styles.sendButtonContainer}>
                                    {savingStatus ? (
                                        <Loading size="small" />
                                    ) : (
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            disabled={sendButtonStatus}
                                            onPress={sendMessage}
                                        >
                                            <MaterialCommunityIcons
                                                name="send"
                                                size={28}
                                                color={
                                                    statusFil
                                                        ? COLORS.grayVeryLight
                                                        : sendButtonStatus
                                                            ? COLORS.grayLight
                                                            : COLORS.secondary
                                                }
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </KeyboardStickyView>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

export default withSnackbar(Conversation);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 15,
        backgroundColor: COLORS.white,
    },
    interlocutorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 15,
        marginRight: 15,
        minHeight: 70,
    },
    messageImage: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        paddingBottom: 1,
    },
    messageImageCover: {
        width: 70,
        height: 70,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayVeryLight,
    },
    messageTextContainer: {
        flex: 1,
        paddingLeft: 10,
    },
    interlocutor: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingTop: 3,
    },
    messageText: {
        flex: 1,
        color: COLORS.gray,
        letterSpacing: 1,
    },
    messageListContainer: {
        flex: 4,
        paddingBottom: 15,
        top: 25,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: COLORS.grayExtraLight,
    },
    conversationContainer: {
        flexGrow: 1,
        flex: 1,
        borderTopColor: COLORS.grayExtraLight,
        paddingBottom: 20,
    },
    textareaContainer: {
        width: '100%',
        height: 70,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textareaFieldContainer: {
        flexDirection: 'row',
        width: '95%',
        height: 70,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 10,
        paddingTop: 5,
        paddingBottom: 5,
        elevation: 2,
        backgroundColor: COLORS.white,
        borderColor: COLORS.grayMedium,
        borderWidth: 1,
    },
    fileUploadContanier: {
        flex: 1,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: COLORS.grayVeryLight,
    },
    textareaField: {
        flex: 7,
        height: 55,
        justifyContent: 'center',
        paddingLeft: 10,
    },
    sendButtonContainer: {
        flex: 1,
        height: 55,
        justifyContent: 'center',
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.white,
        color: COLORS.gray,
        padding: 10,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
    },
    closeContainerStatus: {
        flexDirection: "row",
        marginTop: 1
    },
    closeStatus: {
        color: COLORS.white,
        backgroundColor: COLORS.redIms,
        padding: 2,
        paddingHorizontal: 7,
        fontSize: 11,
        fontWeight: 400,
        borderRadius: 5,
    },
});
