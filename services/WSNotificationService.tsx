import {deleteRequest, getRequest, putRequest} from "../api/ApiManager";
import {BASEURL_MSG_NOTIF} from "../api/appUrl";
class WsNotificationService {
    static getAllNotification = async (userUuid: any) => {
        const allNotificationRequest:any = await getRequest('', `/ws/notifications/utilisateur/${userUuid}/all`); //user.uuid
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
    static getUserNotificationById = async (notificationId: string|undefined) => {
        return await getRequest('', `/ws/notifications/${notificationId}`);
    };
    static updateNotification = async (user: any, notificationId: string | undefined) => {
        const notificationReq:any = await putRequest('', `/ws/notifications/utilisateur/${user.uuid}/read/${notificationId}`, {});
    };
    // ✅ Méthode pour marquer une notification comme lue
    static markNotificationAsRead = async (userUuid: string, notificationId: string) => {
        try {
            await putRequest('', `/ws/notifications/utilisateur/${userUuid}/read/${notificationId}`, {});
            console.log(`✅ Notification ${notificationId} marquée comme lue`);
            return true;
        } catch (error) {
            console.log('Erreur marquage notification:', error);
            return false;
        }
    };
    static deleteOldNotification = async (userUuid: any) => {
        const allNotificationRequest:any = await getRequest('', `/ws/notifications/utilisateur/${userUuid}`); //user.uuid
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
                await deleteRequest('', `/ws/notifications/utilisateur/${userUuid}/bouquet`, notificationTabId);
            }
        }
    };
    static subtractOneMonth = (date: Date) => {
        const result = new Date(date);
        const originalDay = result.getDate();

        // Soustraction du mois
        result.setMonth(result.getMonth() - 1);

        // Si le jour a sauté vers le mois suivant (ex: 31 mars devenu 3 mars),
        // setDate(0) repositionne au dernier jour du mois précédent (28/29 fév ou 30 avr).
        if (result.getDate() !== originalDay) {
            result.setDate(0);
        }

        return result;
    }
    static getRecentNotificationList = (dataList:any) => {
        /*let today = new Date();
        today.setHours(0,0,0,0);
        const month = today.getMonth();
        today.setMonth(month - 1);
        const timestamp = today.getTime();*/

        // Exemple d'utilisation :
        let today = new Date();
        let timestamp = WsNotificationService.subtractOneMonth(today);
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
        const allNotificationRequest:any = await getRequest('', `/ws/notifications/utilisateur/${userUuid}`);
        let allNotificationList =  allNotificationRequest.sort(function (a: any, b: any) {
            return a.dateSent - b.dateSent;
        });

        const dataList = allNotificationList.reverse();
        let notificationTabId = [];
        if(dataList.length > 0){
            for(let i=0; i<dataList.length; i++){
                notificationTabId.push(dataList[i]?.id);
            }
            await deleteRequest('', `/ws/notifications/utilisateur/${userUuid}/bouquet`, notificationTabId);
        }
    };
    static getAllHeaderNotification = async (userUuid: any) => {
        await WsNotificationService.deleteOldNotification(userUuid);
        const responseList = await WsNotificationService.getAllNotification(userUuid);
        return WsNotificationService.getRecentNotificationList(responseList);
    };
}
export default WsNotificationService;
