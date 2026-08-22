import {getRequest} from "../api/ApiManager";

class UtilitiesService {
    static getAllClassrooms = async () => {
        const classListRequest: any = await getRequest('', '/corebase/classes');
        return classListRequest._embedded !== undefined
            ? classListRequest._embedded?.classeDTOModelList
            : [];
    };
    static getClassroomById = async (classId: number) => {
        return await getRequest('', `/corebase/classes/${classId}`);
    };
    static getChildImageRights = async () => {
        const imageRightListRequest: any = await getRequest(
            '',
            '/corebase/imageright',
        );
        return imageRightListRequest._embedded !== undefined
                ? imageRightListRequest._embedded.droitImageDTOModelList
                : [];
    };
    static getChildren = async (data: any) => {
        let registeredList = [];
        const schoolChildrenListRequest = await getRequest('', '/corebase/enfants');
        const schoolChildrenList: any = schoolChildrenListRequest._embedded !== undefined
                ? schoolChildrenListRequest._embedded.enfantDTOModelList
                : [];
        if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < schoolChildrenList.length; j++) {
                    if (schoolChildrenList[j].person.id === data[i].enfantId) {
                        registeredList.push(schoolChildrenList[j]);
                    }
                }
            }
        }

        return registeredList;
    };
}

export default UtilitiesService;
