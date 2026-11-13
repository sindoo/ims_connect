import {getRequest, postRequest} from "../api/ApiManager";
import UtilitiesService from "./UtilitiesService";
import {getTime} from "date-fns";
import {CONSTANT} from "../constants";

class MiniClubService {
  static getMiniClubById = async (miniClubId: string | string[], signal?: AbortSignal) => {
    return await getRequest(
        '',
        `/extra/miniclubs/${miniClubId}`,
        signal,
    );
  }
  static getChildClassMiniClubData = async (selectedChild: any) => {
    const miniClubListRequest: any = await getRequest('', '/extra/miniclubs');
    let miniClubList: any =
        miniClubListRequest._embedded !== undefined
            ? miniClubListRequest._embedded.miniClubDTOModelList
            : [];

    miniClubList = miniClubList.sort(function (a: any, b: any) {
      return a.dateDebut - b.dateFin;
    });
    miniClubList = miniClubList.reverse();
    const miniClubListFiltered: any = [];
    const selectedClasseId = selectedChild?.eleves[0]?.classe?.id;
    if (miniClubList.length > 0) {
      for (let i = 0; i < miniClubList.length; i++) {
        // MINI CLUB CLASSROOM
        // BUG corrige : la boucle for d'origine "push"-ait miniClubList[i]
        // a CHAQUE classeMiniClubs correspondant a la classe de l'enfant.
        // Si plusieurs entrees classeMiniClubs pointaient vers la meme
        // classe (doublon de configuration cote back), le meme mini-club
        // etait ajoute plusieurs fois dans la liste affichee (doublons a
        // l'ecran). Remplace par .some() : on ajoute le club une seule
        // fois des qu'une correspondance est trouvee (et on arrete de
        // parcourir des que trouve, plus rapide).
        const classConcerns: any = miniClubList[i]?.classeMiniClubs;
        if (classConcerns?.some((classConcern: any) => classConcern.classeId === selectedClasseId)) {
          miniClubListFiltered.push(miniClubList[i]);
        }
        // L'ancienne boucle construisait aussi "registeredListChildId" a
        // partir de miniClubList[i]?.inscritMiniClubs, mais ce tableau
        // n'etait jamais utilise (ni retourne, ni lu ensuite) : supprime,
        // ca evitait de reparcourir inutilement la liste des inscrits de
        // chaque mini-club a chaque appel.
      }
    }
    return miniClubListFiltered;
  };
  static getAllRegistration = async (data:any) => {
    const schoolChildrenList = await UtilitiesService.getChildren(data);
    if (data.length === 0) {
      return [];
    }
    // Remplace la double boucle O(n*m) (pour chaque inscription, on
    // reparcourait TOUTE la liste des enfants) par une Map person.id -> enfant
    // construite une seule fois, pour une recherche en O(1) par inscription.
    const childrenById = new Map(
        schoolChildrenList.map((child: any) => [child.person.id, child]),
    );
    const registeredList: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const child = childrenById.get(data[i].enfantId);
      if (child !== undefined) {
        registeredList.push(child);
      }
    }
    return registeredList;
  };
  static getRegistrationInfo = (selectedChildId: number, data: any) => {
    let information = null;
    if (data.inscritMiniClubs.length > 0) {
      const registration = data.inscritMiniClubs.find(
          (registration: any) =>
              registration.enfantId === selectedChildId,
      );
      if (registration !== undefined) {
        information = registration;
      }
    }
    return information;
  };
  static subscription = async (selectedChildId: number, user: any, data: any) => {
    const dataToSend = {
      miniClubId: data.id,
      dateSouscription: getTime(new Date()),
      parentId: user?.userDetails?.personDetails?.person?.id,
      enfantId: selectedChildId,
      common: CONSTANT.common,
    };

    //console.log(JSON.stringify(dataToSend))
    return await postRequest(
        '',
        `/extra/miniclubs/${data.id}/inscription`,
        dataToSend,
    );
  };
  static unSubscription = async (data: any) => {
    const dataToSend = {
      ...data,
      dateSouscription: getTime(new Date()),
    };
    return await postRequest(
        '',
        `/extra/miniclubs/${data.miniClubId}/desinscription`,
        dataToSend,
    );
  };
  static checkRegistration = (selectedChildId: number, data: any) => {
    let registered = false;
    if (data.inscritMiniClubs.length > 0) {
      const registration = data.inscritMiniClubs.find(
          (registration: any) =>
              registration.enfantId === selectedChildId,
      );
      if (registration !== undefined) {
        registered = true;
      }
    }
    return registered;
  };
}

export default MiniClubService;
