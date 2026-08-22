import {getRequest, putRequest} from "../api/ApiManager";
class ImsDayService {
    static getChildImsDay = async (selectedChildId: number) => {
        const imsDayListReq: any = await getRequest('', `/extra/imsday/enfant/${selectedChildId}`);
        const imsDayList: any =
            imsDayListReq?._embedded !== undefined
                ? imsDayListReq?._embedded?.imsDayDTOModelList
                : [];
        let allImsDayList = [];
        if(imsDayList.length > 0) {
            allImsDayList = imsDayList.sort(function (a: any, b: any) {
                return a.theDate - b.theDate;
            });
        }
        return allImsDayList;
    };
    static getImsDay = async (imsDayId: number, dataToSend: any) => {
        return await putRequest('', `/extra/imsday/${imsDayId}`, dataToSend);
    };
}
export default ImsDayService;
