import {deleteRequest, getAllDiscussionTreadList, putRequest} from "../api/ApiManager";
import {useSelector} from "react-redux";
import {BASEURL_MSG_NOTIF} from "../api/appUrl";
import {getTime} from "date-fns";

class ConversationService {
    static getAllDiscussionList = async (selectedChild: any) => {
        const {user} = useSelector((state: any) => state.user);
        return await getAllDiscussionTreadList(user, selectedChild);
    };
    static getUserDiscussionList  = async (dataToSend: any) => {
        let discussionList: any = [];
        const discussionListReq: any = await putRequest(BASEURL_MSG_NOTIF, '/ws/chat/fildiscussions', dataToSend);
        if (discussionListReq !== undefined && discussionListReq !== '' && discussionListReq !== null) {
            discussionList = discussionListReq.sort(function (a: any, b: any) {
                return a.theDate - b.theDate;
            });
        }
        return discussionList;
    };
    static getChildDiscussionList = async (selectedChildID: number, classId: number, data: any) => {

        let discussionList: any = [];
        const discussionListReq: any = await putRequest(BASEURL_MSG_NOTIF, `/ws/chat/spaces/${classId}/${selectedChildID}`, data);
        if (discussionListReq !== undefined && discussionListReq !== '' && discussionListReq !== null) {
            discussionList = discussionListReq.sort(function (a: any, b: any) {
                return a[0]?.space.theDate - b[0]?.space.theDate;
            });
        }
        return discussionList;
    }

    static getLastMessageOfDiscussion = async (spaceId: number, data: any) => {
        let lastMessage: any = {};
        const lastMessageReq: any = await putRequest(BASEURL_MSG_NOTIF, `/ws/chat/messages/space/${spaceId}`, data);
        if (
            lastMessageReq !== undefined &&
            lastMessageReq !== '' &&
            lastMessageReq !== null &&
            lastMessageReq.length > 0
        ) {
            lastMessage = lastMessageReq.slice(-1);
        }
        return lastMessage;
    }
    static getMessageListOfDiscussion = async (discussionId: number, dataToSend: any) => {
        let discussionTreadMessageList: any = [];
        const discussionTreadMessageListReq: any = await putRequest(
            BASEURL_MSG_NOTIF,
            `/ws/chat/messages/space/${discussionId}`,
            dataToSend
        );
        if (
            discussionTreadMessageListReq !== undefined &&
            discussionTreadMessageListReq !== '' &&
            discussionTreadMessageListReq !== null &&
            discussionTreadMessageListReq.length > 0
        ) {
            discussionTreadMessageList = discussionTreadMessageListReq.sort(
                function (a: any, b: any) {
                    return a.theDate - b.theDate;
                },
            );
        }

        return discussionTreadMessageList;
    }
    static getAllDiscussionTreadList = async (selectedChild: any, user: any) => {
        const selectedChildId = selectedChild.id;

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

        let discussionList = await ConversationService.getUserDiscussionList(dataToSend);
        discussionList.reverse();

        let discussionListReq: any = [];
        if (discussionList.length > 0) {
            for (let i = 0; i < discussionList?.length; i++) {
                if (discussionList[i].enfantId === selectedChildId) {
                    let discussionTreadMessageList = await ConversationService.getMessageListOfDiscussion(discussionList[i].id, dataToSend);
                    discussionTreadMessageList.reverse();
                    if(discussionTreadMessageList.length > 0) {
                        const filDiscussion = {
                            ...discussionList[i],
                            lastMessage: discussionTreadMessageList[0]?.message,
                            theDateMessage: discussionTreadMessageList[0]?.theDate,
                        };

                        discussionListReq.push(filDiscussion);
                    }
                }
            }
        }

        discussionListReq = discussionListReq.sort(
            function (a: any, b: any) {
                return a.theDateMessage - b.theDateMessage;
            },
        );

        return discussionListReq.reverse();
    };
    static deleteDiscussionList = async (selectedChild:any, user: any, discussionTread:any, discussionTreadList:any) => {
        if(discussionTread !== null && discussionTread !== undefined){
            const {userDetails} = user;
            const dataToSend = {
                userId: user?.id,
                uuid: user?.uuid,
                personId: user?.userDetails?.personDetails?.person.id,
                nom: `${userDetails?.personDetails?.person?.nom} ${userDetails?.personDetails?.person?.prenom}`,
                role: user?.role,
                connexionDate: 0,
                fonction: '',
                genre: userDetails?.personDetails?.person?.sexe,
                photo: userDetails?.personDetails?.person?.photo,
                enfantNom: `${selectedChild?.person?.nom} ${selectedChild?.person?.prenom}`,
            }

            await deleteRequest(BASEURL_MSG_NOTIF, `/ws/chat/space/${discussionTread?.id}`, dataToSend);
            let filteredMessages = discussionTreadList.filter((discussion:any) => discussion.id !== discussionTread.id);
            filteredMessages = filteredMessages.sort(
                function (a: any, b: any) {
                    return a.theDateMessage - b.theDateMessage;
                },
            );

            return filteredMessages.reverse();
        }
    };
    static getOneDiscussionTreadList = async (discussionThreadSelect: any, user:any, selectedChild: any) => {
        let filDiscussion;
        if(!selectedChild !== null){
            if (discussionThreadSelect.enfantId === selectedChild.id) {
                const dataToSend = {
                    userId: user.id,
                    uuid: user.uuid,
                    personId: user?.userDetails?.personDetails?.person.id,
                    nom: `${user?.userDetails?.personDetails?.person.nom} ${user?.userDetails?.personDetails?.person.prenom}`,
                    role: user.role,
                    /*connexionDate: getTime(new Date()),
                    genre: user?.userDetails?.personDetails?.person.sexe,
                    enfantNom: `${selectedChild.person.nom} ${selectedChild.person.prenom}`,*/
                }

                const discussionTreadMessageListReq: any = await putRequest(
                    BASEURL_MSG_NOTIF,
                    `/ws/chat/messages/space/${discussionThreadSelect.id}`,
                    dataToSend
                );

                if (
                    discussionTreadMessageListReq !== undefined &&
                    discussionTreadMessageListReq !== '' &&
                    discussionTreadMessageListReq !== null &&
                    discussionTreadMessageListReq.length > 0
                ) {
                    const discussionTreadMessageList = discussionTreadMessageListReq.sort(
                        function (a: any, b: any) {
                            return a.theDate - b.theDate;
                        },
                    );
                    discussionTreadMessageList.reverse();

                    filDiscussion = {
                        ...discussionThreadSelect,
                        lastMessage: discussionTreadMessageList[0]?.message,
                        theDateMessage: discussionTreadMessageList[0]?.theDate,
                    };
                }

                //console.log(filDiscussion)
                return filDiscussion;
            }
        }
    };

    static getAllDiscussionTreadListByChild = async (selectedChild: any, user: any) => {


    }
}

export default ConversationService;
