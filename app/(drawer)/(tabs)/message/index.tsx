import React, {useEffect, useRef, useState} from 'react';
import {
    StyleSheet,
    View,
    TouchableWithoutFeedback,
    TextInput,
    Keyboard,
    TouchableOpacity,
    ScrollView,
    Text,
    AppState,
    FlatList
} from 'react-native';
import TextEncodingPolyfill from 'text-encoding';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import ConversationService from "../../../../services/ConversationService";
import {setDiscussionTreadList} from "../../../../redux/features/message/messageSlice";
import {
    checkAppState,
    checkTokenExpired,
    updateHeaderNotificationEveryWhere
} from "../../../../services/GeneralService";
import Loading from "../../../../components/ui/Loading";
import {COLORS} from "../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import DiscussionThreadItem from "../../../../components/tabs/message/DiscussionThreadItem";


Object.assign(global, {
    TextEncoder: TextEncodingPolyfill.TextEncoder,
    TextDecoder: TextEncodingPolyfill.TextDecoder,
});

function MessageCenter({navigation}: {navigation: any}) {
    const inputProps = {enterKeyHint: 'search'};
    const {t} = useTranslation();
    const {discussionTreadList} = useSelector((state: any) => state.messageCenter);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state: any) => state.user);
    const [userDiscussionList, setUserDiscussionList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const dispatch = useDispatch();
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    const handleSearchDiscussionTread = () => {
        if (search !== '') {
            setLoading(true);
            let filterDiscussionList = discussionTreadList.filter(function (
                item: any,
            ) {
                let itemLowerCase: any = item.initiatorNom;
                if(itemLowerCase.toLowerCase().includes(search.toLowerCase())){
                    return true;
                }
                else {
                    itemLowerCase = item.objet;
                    return itemLowerCase.toLowerCase().includes(search.toLowerCase());
                }

            });
            setUserDiscussionList(filterDiscussionList);
            setLoading(false);
        } else {
            setUserDiscussionList(discussionTreadList);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setUserDiscussionList(discussionTreadList);
    };


    useEffect(() => {
        const fetchData = () => {
            //console.log('update');
            setUserDiscussionList(discussionTreadList);
        };
        fetchData();
    }, [discussionTreadList]);


    useEffect(() => {
        const fetchData = async () => {
            if(selectedChild !== null) {
                setLoading(true);
                const selectedChildId = selectedChild.id;
                const classId = selectedChild?.eleves[0]?.classe?.id;
                const data = {
                    userId: user.id,
                    uuid: user.uuid,
                    nom: `${user?.userDetails?.personDetails?.person.nom} ${user?.userDetails?.personDetails?.person.prenom}`,
                    personId: user?.userDetails?.personDetails?.person.id,
                    role: user.role,
                }
                const discussionListReq = await ConversationService.getChildDiscussionList(selectedChildId, classId, data);
                let discussionListFormatted: any = [];
                for(let i = 0; i < discussionListReq.length; i++) {
                    const lastMessage = await ConversationService.getLastMessageOfDiscussion(discussionListReq[i]?.space.id, data);
                    const discussion = {
                        ...discussionListReq[i]?.space,
                        lastMessage: lastMessage.length > 0 ? lastMessage[0].message : '',
                        lastMessageDate: lastMessage.length > 0 ? lastMessage[0].theDate : 0,
                        className: selectedChild?.eleves[0]?.classe?.nom,
                    };
                    discussionListFormatted.push(discussion);
                }

                discussionListFormatted = discussionListFormatted.sort(function (a: any, b: any) {
                    return a?.lastUpdate - b?.lastUpdate;
                });

                discussionListFormatted.reverse();
                dispatch(setDiscussionTreadList(discussionListFormatted));
                setUserDiscussionList(discussionListFormatted);
                setLoading(false);
            }
            setLoading(false);

            if(user !== null) {
                // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                //await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }

            checkTokenExpired(userToken, dispatch);
        };

        fetchData().catch(error => {
            console.log(JSON.stringify(error));
            setLoading(false);
            checkTokenExpired(userToken, dispatch);
        });

        const subscription = checkAppState(appState, setCount);
        return () => {
            subscription.remove();
        };

    }, [selectedChild]);


    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.searchToolbar}>
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={20} color={COLORS.gray} />
                        {/* @ts-ignore*/}
                        <TextInput
                            style={styles.input}
                            placeholder={t('message.search')}
                            placeholderTextColor={COLORS.gray}
                            value={search}
                            onChangeText={(text: any) => setSearch(text)}
                            onSubmitEditing={() => handleSearchDiscussionTread()}
                            {...inputProps}
                        />
                        <TouchableOpacity onPress={() => handleClearSearch()}>
                            <MaterialIcons name="close" size={18} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.editIconBox}>
                        <TouchableOpacity
                            onPress={() => {
                                //navigation.navigate(ROUTES.MESSAGE_CONTACT_NEW_MESSAGE)
                            }}>
                            <View style={styles.editIcon}>
                                <MaterialIcons name="comment" size={24} color={COLORS.white} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.messageListContainer}>
                    {(userDiscussionList.length === 0 || false) && (
                        <View style={{flex:1}}>
                            <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                {t('message.empty_message')}
                            </Text>
                        </View>
                    )}

                    {userDiscussionList.length > 0 && (
                        <>
                            <FlatList
                                style={{paddingLeft: 15, paddingRight: 15}}
                                data={userDiscussionList}
                                keyExtractor={(userDiscussion:any) => userDiscussion.id.toString()}
                                onEndReachedThreshold={0}
                                renderItem={({ item }) => {
                                    return (
                                        <DiscussionThreadItem
                                            key={`user-discussion${item.id}`}
                                            navigation={navigation}
                                            discussionThread={item}
                                        />
                                    )
                                }}
                            />
                        </>
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
        //backgroundColor:'red'
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
        //padding: 15,
        paddingBottom: 15,
        paddingTop: 30,
    },
    messageItemContainer: {
        flexDirection: 'row',
        marginBottom: 23,
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
        flex: 3,
        paddingLeft: 10,
    },
    interlocutor: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.gray,
        paddingTop: 5,
    },
    messageTimeContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    messageText: {
        flex: 8,
        letterSpacing: 1,
    },
    messageTime: {
        fontSize: 13,
        fontWeight: '600',
        paddingTop: 5,
        textAlign: 'right',
    },
    messageTimeDay: {
        fontSize: 12,
        paddingTop: 5,
        textAlign: 'right',
    },

    newMessageStatus: {
        width: 13,
        height: 13,
        borderRadius: 10,
        marginTop: 5,
        marginRight: 2,
        backgroundColor: COLORS.secondary,
    },
});
