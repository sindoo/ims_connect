import {getRequest} from "../api/ApiManager";

class DocumentService {
    static getChildClassDocuments = async (selectedChild: any, userId: number) => {
        return await getRequest(
            '',
            `/extra/documents/classe/${selectedChild?.eleves[0]?.classe?.id}/fichiers/${userId}`,
        );
    };
}

export default DocumentService;
