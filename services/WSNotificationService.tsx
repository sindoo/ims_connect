import {deleteRequest, getRequest, putRequest} from "../api/ApiManager";
import {BASEURL_MSG_NOTIF} from "../api/appUrl";
class WsNotificationService {
    static getAllNotification = async (userUuid: any) => {
        const allNotificationRequest:any = await getRequest(BASEURL_MSG_NOTIF, `/ws/notifications/utilisateur/${userUuid}`); //user.uuid
        if(Array.isArray(allNotificationRequest) && allNotificationRequest.length > 0) {
            let allNotificationList =  allNotificationRequest.sort(function (a: any, b: any) {
                return a.dateSent - b.dateSent;
            });
            return allNotificationList.reverse();
        }
        else {
            return [];
        }
    };
    static getUserNotificationById = async (notificationId: number) => {
        return await getRequest(BASEURL_MSG_NOTIF, `/ws/notifications/${notificationId}`);
    };
    static updateNotification = async (user:any, notificationId: number) => {
        const notificationReq:any = await putRequest(BASEURL_MSG_NOTIF, `/ws/notifications/utilisateur/${user.uuid}/read/${notificationId}`, {});
    };
    static deleteOldNotification = async (userUuid: any) => {
        const allNotificationRequest:any = await getRequest(BASEURL_MSG_NOTIF, `/ws/notifications/utilisateur/${userUuid}`); //user.uuid
        let allNotificationList =  allNotificationRequest.sort(function (a: any, b: any) {
            return a.dateSent - b.dateSent;
        });

        if(Array.isArray(allNotificationRequest) && allNotificationRequest.length > 0) {
            const dataList = allNotificationList.reverse();

            let today = new Date();
            today.setHours(0,0,0,0);
            const month = today.getMonth();
            today.setMonth(month - 1);
            const timestamp = today.getTime();
            const filteredList = dataList.filter((data:any) => data.dateSent < timestamp);
            let notificationTabId = [];

            if(filteredList.length > 0){
                for(let i=0; i<filteredList.length; i++){
                    notificationTabId.push(filteredList[i]?.id);
                }
                await deleteRequest(BASEURL_MSG_NOTIF, `/ws/notifications/utilisateur/${userUuid}/bouquet`, notificationTabId);
            }
        }
    };
    static getRecentNotificationList = (dataList:any) => {
        let today = new Date();
        today.setHours(0,0,0,0);
        const month = today.getMonth();
        today.setMonth(month - 1);
        const timestamp = today.getTime();

        const filteredList = dataList.filter((data:any) => data.dateSent >= timestamp &&  data.dateRead === null);

        let notificationList:any = [];
        let j=0;

        if(filteredList.length > 0){
            for(let i=0; i<filteredList.length; i++){
                if((j+1) === 20){
                    break;
                }
                else {
                    notificationList.push(filteredList[i]);
                    j++;
                }
            }
        }
        return notificationList;
    };
    static deleteAllNotification = async (userUuid: any) => {
        const allNotificationRequest:any = await getRequest(BASEURL_MSG_NOTIF, `/ws/notifications/utilisateur/${userUuid}`);
        let allNotificationList =  allNotificationRequest.sort(function (a: any, b: any) {
            return a.dateSent - b.dateSent;
        });

        const dataList = allNotificationList.reverse();
        let notificationTabId = [];
        if(dataList.length > 0){
            for(let i=0; i<dataList.length; i++){
                notificationTabId.push(dataList[i]?.id);
            }
            await deleteRequest(BASEURL_MSG_NOTIF, `/ws/notifications/utilisateur/${userUuid}/bouquet`, notificationTabId);
        }
    };
    static getAllHeaderNotification = async (userUuid: any) => {
        await WsNotificationService.deleteOldNotification(userUuid);
        const responseList = await WsNotificationService.getAllNotification(userUuid);
        return WsNotificationService.getRecentNotificationList(responseList);
    };
}
export default WsNotificationService;
