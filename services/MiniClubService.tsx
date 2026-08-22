import {getRequest, postRequest} from "../api/ApiManager";
import UtilitiesService from "./UtilitiesService";
import {getTime} from "date-fns";
import {CONSTANT} from "../constants";

class MiniClubService {
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
    const registeredListChildId: any = [];
    if (miniClubList.length > 0) {
      for (let i = 0; i < miniClubList.length; i++) {
        // MINI CLUB CLASSROOM
        const classConcerns: any = miniClubList[i]?.classeMiniClubs;
        if (classConcerns.length > 0) {
          for (let j = 0; j < classConcerns.length; j++) {
            if (
                classConcerns[j].classeId ===
                selectedChild?.eleves[0]?.classe?.id
            ) {
              miniClubListFiltered.push(miniClubList[i]);
            }
          }
        }

        //MINI REGISTERED LIST
        const registered = miniClubList[i]?.inscritMiniClubs;
        if (registered.length > 0) {
          for (let j = 0; j < registered.length; j++) {
            registeredListChildId.push(registered[j].enfantId);
          }
        }
      }
    }
    return miniClubListFiltered;
  };
  static getAllRegistration = async (data:any) => {
    let registeredList = [];
    const schoolChildrenList = await UtilitiesService.getChildren(data);
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
