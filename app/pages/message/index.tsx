import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    StyleSheet,
    View,
    TouchableWithoutFeedback,
    TextInput,
    Keyboard,
    TouchableOpacity,
    ScrollView,
    Text,
    Alert,
} from 'react-native';
import {COLORS, IMAGES} from '../../../constants';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {putRequest, uploadFileRequest} from '../../../api/ApiManager';
import {BASEURL_IMG, BASEURL_MSG_NOTIF, BASEURL_SOCKET} from '../../../api/appUrl';
import EmployeeMessageItem from '../../../components/tabs/message/EmployeeMessageItem';
import ParentMessageItem from '../../../components/tabs/message/ParentMessageItem';
import ParticipantMessageItem from '../../../components/tabs/message/ParticipantMessageItem';
import ParentTwoMessageItem from "../../../components/tabs/message/ParentTwoMessageItem";
import {useDispatch, useSelector} from 'react-redux';
import {
    setDiscussionTreadList,
    updateDiscussionTreadList,
} from '../../../redux/features/message/messageSlice';
import {withSnackbar} from "../../../components/ui/SnackbarHOC";
import ConversationService from "../../../services/ConversationService";
import UtilitiesService from "../../../services//UtilitiesService";
import {Client, StompSubscription} from "@stomp/stompjs";
import LetterAvatar from "../../../components/ui/LetterAvatar";
import {pick, types} from "@react-native-documents/picker";
import Loading from "../../../components/ui/Loading";
import {Image} from "expo-image";
import {useLocalSearchParams} from "expo-router";

type PendingPublish = {destination: string; body: any};

const Conversation = ({route, navigation, snackbarShowMessage}: {route: any, navigation: any, snackbarShowMessage: any}) => {
    const {discussionThreadId} = useLocalSearchParams();
    const {user} = useSelector((state: any) => state.user);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {discussionTreadList} = useSelector((state: any) => state.messageCenter);
    const {t} = useTranslation();

    const [classroomTeach, setClassroomTeach] = useState('');
    const [loading, setLoading] = useState(false);
    const [messageList, setMessageList] = useState<any[]>([]);
    const [userMessage, setUserMessage] = useState<string>('');
    const [sendButtonStatus, setSendButtonStatus] = useState(true);
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingFileStatus, setSavingFileStatus] = useState(false);

    const scrollViewRef: any = useRef(null);
    const dispatch = useDispatch();

    // Client STOMP + souscription : un seul et même client pour tout le cycle
    // de vie de l'écran (au lieu d'un `new Client(...)` recréé à chaque rendu).
    const clientRef = useRef<Client | null>(null);
    const subscriptionRef = useRef<StompSubscription | null>(null);
    // Messages en attente d'envoi tant que la connexion WebSocket n'est pas
    // encore établie (remplace l'ancien pattern "activate() à chaque envoi").
    const pendingPublishesRef = useRef<PendingPublish[]>([]);
    const savingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Discussion sélectionnée : dérivée de la liste Redux + de l'id de la route.
    // Se met à jour automatiquement quand discussionTreadList change (ex: après
    // un dispatch(updateDiscussionTreadList(...)) suite à un nouveau message),
    // sans dépendre d'un effet qui se redéclenchait lui-même.
    const discussionThread = useMemo(
        () => discussionTreadList.find((thread: any) => thread.id.toString() === discussionThreadId),
        [discussionTreadList, discussionThreadId],
    );
    const statusFil = discussionThread?.filEtat === 'CLOS';

    const handleContentChange = useCallback((text: string) => {
        setUserMessage(text);
        setSendButtonStatus(text === '');
    }, []);

    // Payload utilisé pour récupérer les messages d'un fil (conserve le préfixe
    // t('message.parent') utilisé par cet endpoint, distinct du userChatModel
    // utilisé pour l'envoi/upload).
    const buildFetchMessagesPayload = useCallback(() => ({
        userId: user?.id,
        uuid: user?.uuid,
        nom: `${t('message.parent')} ${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
        personId: user?.userDetails?.personDetails?.person.id,
        role: user?.role,
        photo: user?.userDetails?.personDetails?.person.photo,
    }), [user, t]);

    const buildUserChatModel = useCallback(() => ({
        userId: user?.id,
        uuid: user?.uuid,
        nom: `${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
        personId: user?.userDetails?.personDetails?.person.id,
        role: user?.role,
        photo: user?.userDetails?.personDetails?.person.photo,
    }), [user]);

    const fetchMessageList = useCallback(async (thread: any) => {
        if (!thread || !selectedChild || !user) {
            return [];
        }
        const messagesReq: any = await putRequest(
            '',
            `/ws/chat/messages/space/${thread.id}`,
            buildFetchMessagesPayload(),
        );
        if (!messagesReq) {
            return [];
        }
        return [...messagesReq].sort((a: any, b: any) => a.theDate - b.theDate);
    }, [selectedChild, user, buildFetchMessagesPayload]);

    const deleteDiscussionListAlert = useCallback(() => {
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
                        if (selectedChild !== null && user !== null && discussionThread) {
                            const discussionTreadListRes = await ConversationService.deleteDiscussionList(selectedChild, user, discussionThread, discussionTreadList);
                            dispatch(setDiscussionTreadList(discussionTreadListRes));
                            //navigation.navigate(ROUTES.MESSAGE);
                        }
                    } catch (error) {
                        snackbarShowMessage(t('snackBar.sb_error_delete'));
                        console.log(error);
                    }
                },
            },
        ]);
    }, [t, selectedChild, user, discussionThread, discussionTreadList, dispatch, snackbarShowMessage]);

    // Publie un message sur le socket. Si la connexion n'est pas encore établie,
    // le message est mis en attente et envoyé dès que `onConnect` se déclenche
    // (au lieu de recréer un client et de rappeler activate() à chaque envoi).
    const publish = useCallback((destination: string, body: any) => {
        const client = clientRef.current;
        if (client?.connected) {
            client.publish({destination, body: JSON.stringify(body), skipContentLengthHeader: true});
        } else {
            pendingPublishesRef.current.push({destination, body});
            client?.activate();
        }
    }, []);

    const selectFile = useCallback(async () => {
        try {
            const [doc] = await pick({
                type: [types.images, types.pdf, types.doc, types.csv, types.docx, types.pptx, types.ppt],
            });

            const formData: any = new FormData();
            formData.append('fichier', {
                uri: doc.uri,
                type: doc.type,
                name: doc.name,
            });

            setSavingFileStatus(true);

            const response = await uploadFileRequest('POST', '', '/ws/chat/fichier/mobile', formData);

            const messageDto = {
                id: null,
                userId: user.id,
                userUuid: user.uuid,
                filDiscussionId: discussionThread?.id,
                message: '',
                theDate: new Date().getTime(),
                userNom: `${user?.userDetails?.personDetails?.person.prenom} ${user?.userDetails?.personDetails?.person.nom}`,
                userPhoto: user?.userDetails?.personDetails?.person?.photo,
                roleUser: 'PARENT',
                fichier: response.data,
                typeFichier: doc.type?.includes('image') ? 'image' : 'document',
                nomFichier: doc.name,
            };

            publish('/app/chat/sendMessage', {
                userChatModel: buildUserChatModel(),
                message: messageDto,
            });

            setTimeout(() => {
                scrollViewRef?.current?.scrollToEnd({animated: true});
                setSavingFileStatus(false);
            }, 3500);
        } catch (err) {
            setSavingFileStatus(false);
            console.log(err);
        }
    }, [user, discussionThread, publish, buildUserChatModel]);

    const sendMessage = useCallback(() => {
        try {
            if (userMessage !== '' && userMessage.length > 1 && selectedChild !== null && user !== null && discussionThread) {
                setSavingStatus(true);
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

                publish('/app/chat/sendMessage', {
                    userChatModel: buildUserChatModel(),
                    message: messageDto,
                });

                setUserMessage('');
                setSendButtonStatus(true);

                if (savingTimeoutRef.current) {
                    clearTimeout(savingTimeoutRef.current);
                }
                savingTimeoutRef.current = setTimeout(() => {
                    scrollViewRef?.current?.scrollToEnd({animated: true});
                    setSavingStatus(false);
                }, 2000);
            }
        } catch (error) {
            console.log(error);
            setSavingStatus(false);
        }
    }, [userMessage, selectedChild, user, discussionThread, publish, buildUserChatModel]);

    // Chargement des messages + du nom de la classe à chaque changement de fil
    // de discussion sélectionné (uniquement quand l'id change, pas à chaque
    // mise à jour superficielle de l'objet venant de Redux).
    useEffect(() => {
        if (!discussionThread) {
            return;
        }
        let isActive = true;
        setLoading(true);

        const loadThreadData = async () => {
            const [classroom, messages] = await Promise.all([
                UtilitiesService.getClassroomById(discussionThread.classeId),
                fetchMessageList(discussionThread),
            ]);

            if (!isActive) {
                return;
            }
            if (classroom !== undefined) {
                setClassroomTeach(classroom.nom);
            }
            setMessageList(messages);
            setLoading(false);
        };

        loadThreadData().catch(error => {
            console.log(error);
            if (isActive) {
                setLoading(false);
            }
        });

        return () => {
            isActive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discussionThread?.id]);

    // Connexion WebSocket dédiée au fil sélectionné : un seul client, une seule
    // souscription. Désabonnement + désactivation systématiques à la sortie de
    // l'écran ou au changement de fil/enfant/utilisateur.
    useEffect(() => {
        if (!discussionThread || !user?.uuid || !selectedChild) {
            return;
        }

        const client = new Client({
            brokerURL: `${BASEURL_SOCKET}/ws`,
            connectHeaders: {},
            debug: (str: string) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            forceBinaryWSFrames: true,
            appendMissingNULLonIncoming: true,
        });

        client.onConnect = () => {
            if (!subscriptionRef.current) {
                subscriptionRef.current = client.subscribe(
                    `/chat/utilisateur/${user.uuid}/message`,
                    async () => {
                        try {
                            const response = await ConversationService.getOneDiscussionTreadList(discussionThread, user, selectedChild);
                            if (response !== undefined) {
                                dispatch(updateDiscussionTreadList(response));
                                const updatedMessages = await fetchMessageList(discussionThread);
                                setMessageList(updatedMessages);
                                setUserMessage('');
                                scrollViewRef?.current?.scrollToEnd({animated: true});
                            }
                        } catch (error) {
                            console.log('souscription ligne ' + error);
                        }
                    },
                );
            }

            // Envoi des messages mis en file d'attente pendant que la connexion
            // n'était pas encore établie.
            pendingPublishesRef.current.forEach(({destination, body}) => {
                client.publish({destination, body: JSON.stringify(body), skipContentLengthHeader: true});
            });
            pendingPublishesRef.current = [];
        };

        client.activate();
        clientRef.current = client;

        return () => {
            subscriptionRef.current?.unsubscribe();
            subscriptionRef.current = null;
            client.deactivate();
            clientRef.current = null;
        };
    }, [discussionThread, user, selectedChild, dispatch, fetchMessageList]);

    // Nettoyage du timer d'envoi en attente au démontage de l'écran.
    useEffect(() => {
        return () => {
            if (savingTimeoutRef.current) {
                clearTimeout(savingTimeoutRef.current);
            }
        };
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.interlocutorContainer}>
                    <View style={styles.messageImage}>
                        {discussionThread?.initiatorRole === 'PARENT' ? (
                            <LetterAvatar name={discussionThread?.className} size={65} />
                        ) : (
                            <Image
                                source={
                                    discussionThread?.initiatorPhoto !== '' && discussionThread?.initiatorPhoto !== null
                                        ? {uri: `${BASEURL_IMG}/${discussionThread?.initiatorPhoto}`}
                                        : IMAGES.avatar
                                }
                                contentFit="cover"
                                style={styles.messageImageCover}
                            />
                        )}
                    </View>
                    <View style={styles.messageTextContainer}>
                        <Text style={styles.interlocutor}>
                            {discussionThread?.initiatorRole === 'PARENT' ? `${t('message.to_teachers')}` : discussionThread?.initiatorNom}
                        </Text>
                        <Text style={styles.messageText}>
                            {discussionThread?.initiatorRole === 'PARENT' ? discussionThread?.className : discussionThread?.initiatorRole}
                        </Text>
                        {discussionThread?.initiatorRole === 'TEACHER' && (
                            <Text style={styles.messageText}>{classroomTeach}</Text>
                        )}
                    </View>

                    <TouchableOpacity onPress={deleteDiscussionListAlert} activeOpacity={0.8}>
                        <MaterialCommunityIcons
                            name="dots-vertical"
                            size={28}
                            color={COLORS.secondary}
                        />
                    </TouchableOpacity>
                </View>

                <View style={{paddingLeft: 20, paddingRight: 20, marginTop: 15}}>
                    <Text>
                        {t('message.objet')} : {discussionThread?.objet}
                    </Text>
                </View>

                <View style={styles.messageListContainer}>
                    <View style={styles.conversationContainer}>
                        <ScrollView
                            style={{paddingLeft: 15, paddingRight: 15}}
                            ref={scrollViewRef}
                        >
                            {messageList?.length > 0 &&
                                messageList.map((message: any) => {
                                    if (message.userId === user.id && message.roleUser === 'PARENT') {
                                        return <ParentMessageItem key={message.id} message={message} parentChoice={1} />;
                                    }
                                    if (message.userId !== user.id && message.roleUser === 'PARENT') {
                                        return <ParentTwoMessageItem key={message.id} message={message} />;
                                    }
                                    if (message.roleUser === 'TEACHER') {
                                        return <EmployeeMessageItem key={message.id} message={message} />;
                                    }
                                    if (message.roleUser === 'ADMIN') {
                                        return <ParticipantMessageItem key={message.id} message={message} />;
                                    }
                                    return null;
                                })}
                        </ScrollView>
                    </View>

                    {/*TEXTAREA TO SEND NEEW MESSAGE*/}
                    <View style={styles.textareaContainer}>
                        <View style={styles.textareaFieldContainer}>
                            <View style={styles.fileUploadContanier}>
                                {savingFileStatus ? <Loading size="small" /> : (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => selectFile()}
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
                                {savingStatus ? <Loading size="small" /> : (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        disabled={sendButtonStatus}
                                        onPress={sendMessage}
                                    >
                                        <MaterialCommunityIcons
                                            name="send"
                                            size={28}
                                            color={statusFil ? COLORS.grayVeryLight : (
                                                sendButtonStatus ? COLORS.grayLight : COLORS.secondary
                                            )}
                                            disabled
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

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
        paddingBottom: 4,
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
        marginBottom: 60,
    },
    textareaContainer: {
        width: '100%',
        height: 70,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 25,
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
});
