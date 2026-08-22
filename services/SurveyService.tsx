import {getRequest, putRequest} from "../api/ApiManager";
import {CONSTANT} from "../constants";

class SurveyService {
  static getAllSurvey = async (classId: number, userId: number) => {
    const surveyListReq = await getRequest(
        '',
        `/extra/sondage/parent/${userId}/classe/${classId}`,
    );
    return surveyListReq._embedded !== undefined
        ? surveyListReq._embedded.sondageDTOModelList
        : [];
  };
  static updateSurvey = async (selectedChild: any, user: any, userFCMToken:any, surveyResponse: any, data: any) => {
    const childPhoto = selectedChild.person.photo;
    const parentId = user.userDetails.personDetails.person.id;
    const parentUserId = user.id;
    const parentNom = `${user.userDetails.personDetails.person.nom} ${user.userDetails.personDetails.person.prenom}`;
    const parentSexe = user.userDetails.personDetails.person.sexe;

    let dataToSend = {};
    if (
        data?.sondageReponseDTOModel?.sondageId !== null &&
        data?.sondageReponseDTOModel?.sondageId > 0
    ) {
      dataToSend = {
        ...data.sondageReponseDTOModel,
        reponse: surveyResponse?.opinionSurvey,
      };
    } else {
      dataToSend = {
        parentId: parentId,
        enfantId: selectedChild.person.id,
        sondageId: data?.id,
        reponse: surveyResponse?.opinionSurvey,
        parentUserId: parentUserId,
        parentNom: parentNom,
        parentSexe: parentSexe,
        firebaseToken: userFCMToken,
        parentPhoto: childPhoto,
        common: CONSTANT.common,
      };
    }

    return await putRequest('', '/extra/sondage/avisparent', dataToSend);
  };
}
export default SurveyService;
