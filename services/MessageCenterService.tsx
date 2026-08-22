import {Client} from '@stomp/stompjs';
import {BASEURL_MSG_NOTIF, BASEURL_SOCKET} from '../api/appUrl';
import {getRequest} from '../api/ApiManager';

export function MessageCenterService() {
  //const dispatch = useDispatch();
  const connectToWebSocket = () => {
    return new Client({
      brokerURL: `${BASEURL_SOCKET}/ws`,
      connectHeaders: {},
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
    });
  };

  const onConnect = (client: any, dataTosend: any, user: any) => {
    let listTreadDiscussion: any = [];
    client.onConnect = (frame: any) => {
      console.log(frame);
      //LISTEN ALL SPACES AND GET USER CONNECTED SPACES
      client.publish({
        destination: '/app/chat/spaces',
        body: JSON.stringify(dataTosend),
        skipContentLengthHeader: true,
      });

      client.subscribe(
        `/chat/utilisateur/${user.uuid}/spaces`,
        async (discussionThread: any) => {
          let discussionList: any = JSON.parse(discussionThread.body);
          discussionList = discussionList.sort(function (a: any, b: any) {
            return a.theDate - b.theDate;
          });
          discussionList.reverse();

          listTreadDiscussion = discussionList;

          let discussionListReq: any = [];
          if (discussionList.length > 0) {
            for (let i = 0; i < discussionList?.length; i++) {
              const discussionTreadMessageListReq: any = await getRequest(
                '',
                `/ws/chat/space/${discussionThread.id}/messages`,
              );
              const discussionTreadMessageList =
                discussionTreadMessageListReq.sort(function (a: any, b: any) {
                  return a.theDate - b.theDate;
                });
              discussionTreadMessageList.reverse();

              const filDiscussion = {
                ...discussionList[i],
                lastMessage: discussionTreadMessageList[0]?.message,
                theDateMessage: discussionTreadMessageList[0]?.theDate,
              };
              discussionListReq.push(filDiscussion);
            }
            // setUserDiscussionList(discussionListReq);
          }
        },
        {'Content-Type': 'application/json'},
      );

      //userSpaces.unsubscribe();
    };
    client.activate();
    return listTreadDiscussion;
  };

  return {
    connectToWebSocket: connectToWebSocket(),
    onConnect: onConnect,
  };
}
