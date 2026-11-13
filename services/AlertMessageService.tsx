import {getRequest} from "../api/ApiManager";

class AlertMessageService {
    static getAlertMessageById = async (alertMessageId: any) => {
        return await getRequest('', `/extra/alertmessage/${alertMessageId}`);
    };
}

export default AlertMessageService;
