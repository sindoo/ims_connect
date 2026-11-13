import React, {useMemo, useState} from 'react';
import {
    Keyboard,
    Modal,
    StyleSheet, Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {Image} from "expo-image";
import {COLORS, IMAGES, ROUTES} from '../../../constants';
import {BASEURL_IMG} from '../../../api/appUrl';
import {MaterialIcons} from '@expo/vector-icons';
import {useTranslation} from 'react-i18next';
import {request} from '../../../api/ApiManager';
import FlatButton from '../../../components/ui/FlatButton';
import * as yup from 'yup';
import {Formik} from 'formik';
import {globalStyles} from '../../../style/Global';
import {useDispatch, useSelector} from 'react-redux';
import {addNewDiscussionTreadToList} from '../../../redux/features/message/messageSlice';
import ViewThemed from "../../ui/ViewThemed";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";

const newMessageFormSchema = yup.object({
    messageObject: yup.string().required().min(3),
    messageText: yup.string().required(),
});

// fonctionList et classroomList sont désormais chargées UNE SEULE FOIS par
// l'écran parent (NewConservation) et passées en props, au lieu d'être
// re-fetchées par chaque ContactItem de la liste (N contacts = 2N requêtes
// réseau identiques auparavant).
function ContactItem({contact, fonctionList = [], classroomList = []}) {
    const [modal, setModal] = useState(false);
    const {t} = useTranslation();
    const [buttonStatus, setButtonStatus] = useState(false);
    const [statusAccountEmp, setStatusAccountEmp] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const {user} = useSelector((state: any) => state.user);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {teacherList} = useSelector((state: any) => state.employee);
    const {userDetails} = user;
    const dispatch = useDispatch();
    const [isEnabled, setIsEnabled] = useState(false);

    // Calcul synchrone (pas de useEffect + setState) : le texte s'affiche dès
    // le premier rendu, sans attendre un cycle de rendu supplémentaire, et se
    // recalcule seulement si contact/fonctionList changent réellement.
    const {contactFonction, contactRole} = useMemo(() => {
        const fonctionId = contact?.fonctions?.[0]?.fonctionId;
        if (!fonctionId) return {contactFonction: '', contactRole: ''};

        const fonctionFind: any = fonctionList.find((fonction: any) => fonction.id === fonctionId);
        return fonctionFind
            ? {contactFonction: fonctionFind.nom, contactRole: fonctionFind.role}
            : {contactFonction: '', contactRole: ''};
    }, [contact, fonctionList]);

    const classroomTeach = useMemo(() => {
        if (!teacherList.includes(contact)) return '';

        const classroomFind: any = classroomList.find(
            (classroom: any) => classroom.id === contact?.teacherClasses?.[0]?.classeId,
        );
        return classroomFind?.nom ?? '';
    }, [contact, classroomList, teacherList]);

    const handNewMessageContact = () => {
        setModal(true);
        setErrorMsg('');
        setStatusAccountEmp(true);
    };

    const handleChange = () => {
        setIsEnabled(previousState => !previousState);
    }

    return (
        <ViewThemed style={{...globalStyles.container}}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handNewMessageContact()}>
                <View style={styles.messageItemContainer}>
                    <View style={styles.messageImage}>
                        <Image
                            source={
                                contact.person.photo !== '' && contact.person.photo !== null
                                    ? {uri: `${BASEURL_IMG}/${contact.person.photo}`}
                                    : IMAGES.avatar
                            }
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            style={styles.messageImageCover}
                        />
                    </View>

                    <View style={styles.messageTextContainer}>
                        <Text style={styles.interlocutor}>{` ${contact?.person?.nom} ${contact?.person?.prenom}`}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Le contenu du Modal (formulaire Formik + TextInputs) n'est monté
                que quand l'utilisateur ouvre réellement ce contact : un
                <Modal visible={false}> garde son contenu monté en mémoire même
                caché, ce qui pour N contacts dans la liste veut dire N
                formulaires Formik actifs simultanément pour rien. */}
            {modal && (
                <Modal visible={modal} animationType="slide">
                    <SafeAreaProvider>
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.modalContainer}>
                                <Formik
                                    initialValues={{
                                        messageObject: '',
                                        messageText: '',
                                    }}
                                    validationSchema={newMessageFormSchema}
                                    onSubmit={(data: any, actions: any) => {
                                        setButtonStatus(true);
                                        if (data.messageObject && data.messageText && selectedChild !== null) {
                                            //console.log(data);

                                            const dataToSend = {
                                                userChatModel: {
                                                    userId: user?.id,
                                                    uuid: user?.uuid,
                                                    nom: `${userDetails?.personDetails?.person?.prenom} ${userDetails?.personDetails?.person?.nom}`,
                                                    role: user?.role,
                                                    personId: userDetails?.personDetails?.person?.id,
                                                    lastActivity: 0,
                                                    fonction: '',
                                                    genre: userDetails?.personDetails?.person?.sexe,
                                                    photo: userDetails?.personDetails?.person?.photo,
                                                },
                                                message: data.messageText.trim(),
                                                filDiscussions: [
                                                    {
                                                        id: null,
                                                        filRole: 'MESSAGERIE',
                                                        enfantId: selectedChild?.person?.id,
                                                        objet: data.messageObject.trim(),
                                                        uuid: user?.uuid,
                                                        filEtat: 'OPEN',
                                                        theDate: new Date().getTime(),
                                                        enfantPhoto: selectedChild?.person?.photo,
                                                        enfantNom: `${selectedChild?.person?.prenom} ${selectedChild?.person?.nom}`,
                                                        classeId: selectedChild?.eleves[0]?.classe?.id,
                                                        classeNom: selectedChild?.eleves[0]?.classe?.nom,
                                                        initiatorUserId: user?.id,
                                                        initiatorNom: `${userDetails?.personDetails?.person?.prenom} ${userDetails?.personDetails?.person?.nom}`,
                                                        initiatorPhoto: userDetails?.personDetails?.person?.photo,
                                                        initiatorRole: user?.role,
                                                        privee: isEnabled,
                                                    },
                                                ],
                                            };

                                            request('POST', '', '/ws/chat', dataToSend)
                                                .then(response => {
                                                    const filDiscussion = {
                                                        ...response.data[0]?.space,
                                                        lastMessage: data.messageText.trim(),
                                                        //theDateMessage: response.data[0]?.space.theDate,
                                                        lastMessageDate: response.data[0]?.space.theDate,
                                                        className: selectedChild?.eleves[0]?.classe?.nom,
                                                    };

                                                    dispatch(addNewDiscussionTreadToList(filDiscussion));
                                                    setModal(false);

                                                    router.push({
                                                        pathname: '/pages/message',
                                                        params: {
                                                            discussionThreadId: JSON.stringify(filDiscussion?.id),
                                                        }
                                                    });
                                                })
                                                .catch(error => {
                                                    setErrorMsg(t('message.send_error'));
                                                    console.log(JSON.stringify(error));
                                                    setButtonStatus(false);
                                                });
                                            setButtonStatus(false);
                                        } else {
                                            setButtonStatus(false);
                                        }
                                    }}>
                                    {formikProps => (
                                        <>
                                            <View style={styles.modalHeader}>
                                                <View style={styles.modalTitle}>
                                                    <Text style={styles.modalTitleText}>
                                                        {t('message.new_message_title')}
                                                    </Text>
                                                </View>
                                                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                                    <MaterialIcons
                                                        name="close"
                                                        size={22}
                                                        color={COLORS.gray}
                                                        onPress={() => {
                                                            setModal(false);
                                                        }}
                                                    />
                                                </TouchableWithoutFeedback>
                                            </View>

                                            <View style={styles.modalContent}>
                                                <View style={styles.interlocutorContainer}>
                                                    <View style={styles.messageItemContainer}>
                                                        <View style={styles.messageImage}>
                                                            <Image
                                                                source={
                                                                    contact.person.photo !== null &&
                                                                    contact.person.photo !== ''
                                                                        ? {
                                                                            uri: `${BASEURL_IMG}/${contact.person.photo}`,
                                                                        }
                                                                        : IMAGES.avatar
                                                                }
                                                                resizeMode="cover"
                                                                cachePolicy="memory-disk"
                                                                style={styles.messageImageCover}
                                                            />
                                                        </View>

                                                        <View style={styles.messageTextContainer}>
                                                            <Text style={styles.interlocutor}>
                                                                {contact?.person?.nom} {contact?.person?.prenom}
                                                            </Text>
                                                            <Text style={styles.messageText}>{contactFonction}</Text>
                                                            {classroomTeach !== '' && (
                                                                <Text style={styles.messageText}>{classroomTeach}</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>

                                                <View style={styles.formContainer}>
                                                    <View style={{...styles.textareaField, marginBottom: 15}}>
                                                        <Text style={styles.modalInputLabel}>
                                                            {t('message.objet')} *
                                                        </Text>
                                                        <TextInput
                                                            style={styles.inputModal}
                                                            placeholder={t('message.title_placeholder')}
                                                            placeholderTextColor={COLORS.grayLight}
                                                            onChangeText={formikProps.handleChange(
                                                                'messageObject',
                                                            )}
                                                            value={formikProps.values.messageObject}
                                                            onBlur={formikProps.handleBlur('messageObject')}
                                                        />
                                                        <Text style={{...globalStyles.errorText}}>
                                                            {formikProps.touched.messageObject &&
                                                                formikProps.errors.messageObject && (
                                                                    <Text>{t('login.required_field')}</Text>
                                                                )}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.fileIconTextarea}>
                                                        <View style={styles.textareaFieldMessage}>
                                                            <Text style={styles.modalInputLabel}>
                                                                {t('message.title')} *
                                                            </Text>
                                                            <TextInput
                                                                multiline
                                                                style={{...styles.inputModal, paddingVertical: 15}}
                                                                placeholder={t('message.title')}
                                                                placeholderTextColor={COLORS.grayLight}
                                                                onChangeText={formikProps.handleChange(
                                                                    'messageText',
                                                                )}
                                                                value={formikProps.values.messageText}
                                                                onBlur={formikProps.handleBlur('messageText')}
                                                            />
                                                            <Text
                                                                style={{
                                                                    ...globalStyles.errorText,
                                                                    marginBottom: 10,
                                                                }}>
                                                                {formikProps.touched.messageText &&
                                                                    formikProps.errors.messageText && (
                                                                        <Text>{t('login.required_field')}</Text>
                                                                    )}
                                                            </Text>
                                                        </View>

                                                    </View>

                                                    <View style={{marginBottom: 30, marginTop: 10}}>
                                                        <View style={{flexDirection: 'row', marginTop: -20, alignItems: 'center', alignContent: 'center', marginBottom: 10}}>
                                                            <Text style={{...styles.modalInputLabel, marginRight: 10, color: COLORS.gray}}>
                                                                {isEnabled ? t('message.conversation_private') : t('message.conversation_public') } :
                                                            </Text>
                                                            <Switch
                                                                trackColor={{false: COLORS.grayLight, true: COLORS.secondaryLight}}
                                                                thumbColor={isEnabled ? COLORS.secondary : COLORS.white}
                                                                ios_backgroundColor={COLORS.grayLight}
                                                                onValueChange={() => handleChange() }
                                                                value={isEnabled}
                                                            />
                                                        </View>
                                                        <Text style={{color: COLORS.gray, fontStyle: 'italic'}}>{isEnabled ? t('message.description_private_conversation') : t('message.description_public_conversation')}</Text>
                                                    </View>



                                                    <FlatButton
                                                        title={t('message.send_message')}
                                                        fontWeight="500"
                                                        fontSize={16}
                                                        backgroundColor={COLORS.secondary}
                                                        paddingVertical={12}
                                                        borderRadius={20}
                                                        //onPress={() => {}}
                                                        onPress={formikProps.handleSubmit}
                                                        disabled={buttonStatus}
                                                    />

                                                    {statusAccountEmp && (
                                                        <Text style={{color: COLORS.red, textAlign: "center", marginTop:30}}>
                                                            {errorMsg}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </>
                                    )}
                                </Formik>
                            </View>
                        </SafeAreaView>
                    </SafeAreaProvider>
                </Modal>
            )}
        </ViewThemed>
    );
}

// React.memo : évite de re-rendre chaque ContactItem quand le parent
// re-render pour une raison qui ne concerne pas ce contact précis (ex: la
// saisie dans le champ de recherche avant validation).
export default React.memo(ContactItem);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    messageItemContainer: {
        flexDirection: 'row',
        marginBottom: 23,
        //backgroundColor:'red'
    },
    messageImage: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
        paddingBottom: 1,
    },
    messageImageCover: {
        width: 50,
        height: 50,
        overflow: 'hidden',
        borderRadius: 50,
        borderWidth: 1,
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayVeryLight,
        paddingRight: 10,
    },
    messageTextContainer: {
        flex: 1,
        paddingLeft: 10,
    },
    interlocutor: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingTop: 12,
    },
    modalContainer: {
        flex: 1,
        padding: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
    },
    modalTitle: {
        flex: 1,
        alignItems: 'center',
    },
    modalTitleText: {
        fontSize: 18,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.secondary,
    },
    modalContent: {
        flex: 1,
        paddingTop: 20,
    },
    textareaField: {
        //flex: 3,
        height: 55,
        justifyContent: 'center',
        paddingLeft: 5,
        marginBottom: 10,
    },
    textareaFieldMessage: {
        flex: 3,
        minHeight: 55,
        justifyContent: 'center',
        paddingLeft: 5,
    },
    fileUploadContanier: {
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        //top:20,
        marginLeft: 5,
    },
    fileIconTextarea: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.grayVeryLight,
        color: COLORS.gray,
        padding: 10,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
    },
    modalInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingLeft: 2,
        paddingBottom: 5,
    },
    interlocutorContainer: {
        //flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    messageText: {
        //flex: 2,
        color: COLORS.gray,
        letterSpacing: 1,
    },
    formContainer: {
        flex: 1,
        marginTop: 10,
        //backgroundColor: 'green'
    },
});
