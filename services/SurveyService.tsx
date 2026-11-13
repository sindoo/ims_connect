import {getRequest, putRequest} from "../api/ApiManager";
import {CONSTANT} from "../constants";

class SurveyService {
  // Réponse déjà donnée par le parent connecté pour ce sondage : soit
  // `sondageReponseDTOModel` (réponse du parent, si le serveur la fournit),
  // soit l'entrée de `sondageReponses` qui lui appartient (parentUserId, et
  // enfant sélectionné quand il est renseigné).
  static getParentAnswer = (survey: any, user: any, selectedChild?: any) => {
    const dto = survey?.sondageReponseDTOModel;
    if (dto && typeof dto === 'object' && dto.reponse) {
      return dto;
    }
    const answers = Array.isArray(survey?.sondageReponses) ? survey.sondageReponses : [];
    const mine = answers.filter((answer: any) => answer?.parentUserId === user?.id);
    const childId = selectedChild?.person?.id;
    return (
        mine.find((answer: any) => childId !== undefined && answer?.enfantId === childId) ||
        mine[0] ||
        (dto && typeof dto === 'object' ? dto : null)
    );
  };

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

    const existingAnswer = SurveyService.getParentAnswer(data, user, selectedChild);

    let dataToSend = {};
    if (
        existingAnswer?.sondageId !== null &&
        existingAnswer?.sondageId > 0
    ) {
      dataToSend = {
        ...existingAnswer,
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
