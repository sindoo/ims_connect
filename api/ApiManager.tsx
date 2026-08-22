import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {BASEURL_MSG_NOTIF} from './appUrl';

// LOCAL CONFIG
const AXIOS_BASEURL = 'https://ivorymontessorisystem.com/imsv3/api/v1'; // GOOD

// AWS CONFIG
//axios.defaults.baseURL = 'https://ivorymontessorisystem.com:8443/api/v1';
//const AXIOS_BASEURL = "https://ivorymontessorisystem.com:8443/api/v1"; // GOOD

axios.defaults.headers.post['Content-Type'] = 'application/json';

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const setAuthToken = (token: string) => {
  AsyncStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  AsyncStorage.removeItem('authToken');
};

export const request = async (
  method: any,
  baseURL: any,
  url: any,
  data: any,
) => {
  let headers = {};
  const token = await getAuthToken();
  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }

  //console.log(baseURL);

  return axios({
    method: method,
    headers: headers,
    url: url,
    data: data,
    baseURL: baseURL == '' ? AXIOS_BASEURL : baseURL,
  });
};

export const uploadFileRequest = async (
  method: any,
  baseURL: any,
  url: any,
  data: any,
) => {
  //let headers = { 'Content-Type': 'multipart/form-data' };
  let headers = {
    Accept: 'application/json',
    'Content-Type': 'multipart/form-data',
  };
  const token = await getAuthToken();
  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }

  return axios({
    method: method,
    headers: headers,
    url: url,
    data: data,
    baseURL: baseURL == '' ? AXIOS_BASEURL : baseURL,
  });
};

export const getRequest = async (baseURL: any, url: any) => {
  let headers = {};
  const token = await getAuthToken();
  const completeURL = baseURL === '' ? AXIOS_BASEURL + url : baseURL + url;

  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }
  const config = {
    headers: headers,
  };
  const response = await axios.get(completeURL, config);
  return response.data;
};

export const postRequest = async (
  baseURL: any = AXIOS_BASEURL,
  url: any,
  data: any,
) => {
  let headers = {};
  const token = await getAuthToken();
  const completeURL = baseURL === '' ? AXIOS_BASEURL + url : baseURL + url;

  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }
  const config = {
    headers: headers,
  };
  const response = await axios.post(completeURL, data, config);
  return response.data;
};

export const putRequest = async (
  baseURL: any = AXIOS_BASEURL,
  url: any,
  data: any,
) => {
  let headers = {};
  const token = await getAuthToken();
  const completeURL = baseURL === '' ? AXIOS_BASEURL + url : baseURL + url;

  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }
  const config = {
    headers: headers,
  };
  const response = await axios.put(completeURL, data, config);
  return response.data;
};

export const deleteRequest = async (
  baseURL: any = AXIOS_BASEURL,
  url: any,
  data: any,
) => {
  let headers = {};
  const token = await getAuthToken();
  //const completeURL = baseURL === "" ? AXIOS_BASEURL+url : baseURL+url;

  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }
  const response = await axios({
    method: 'DELETE',
    headers: headers,
    url: url,
    data: data,
    baseURL: baseURL == '' ? AXIOS_BASEURL : baseURL,
  });
  //const response = await axios.put(completeURL, data, config);
  return response.data;
};

export const getAllAppointmentList = (
  allAppointmentListReq: any,
  selectedChild: any,
) => {
  if (selectedChild !== null) {
    let allRdvListChildSelected: any = [];
    if (allAppointmentListReq.length > 0) {
      for (let i = 0; i < allAppointmentListReq.length; i++) {
        const appointment: any = allAppointmentListReq[i];

        if (
          appointment.meetingType === 'PRESET' &&
          (appointment.meetingStatus === 'CONFIRM' ||
            appointment.meetingStatus === 'PARTIAL_CONFIRM')
        ) {
          if (appointment?.creneauRdvs.length > 0) {
            for (let j = 0; j < appointment?.creneauRdvs.length; j++) {
              if (
                appointment?.creneauRdvs[j]?.creneauRdvEnfantParents?.length > 0
              ) {
                if (
                  appointment.creneauRdvs[j]?.creneauRdvEnfantParents[0]
                    ?.enfantId === selectedChild.person.id
                ) {
                  allRdvListChildSelected.push(appointment);
                }
              }
            }
          }
        } else if (appointment.meetingType === 'NORMAL') {
          if (appointment.creneauRdvs.length > 0) {
            if (appointment.creneauRdvs[0].creneauRdvEnfantParents.length > 0) {
              if (
                appointment.creneauRdvs[0].creneauRdvEnfantParents[0]
                  .enfantId === selectedChild.person.id
              ) {
                allRdvListChildSelected.push(appointment);
              }
            }
          }
        }
      }
    }

    //console.log(JSON.stringify(allRdvListChildSelected))
    return allRdvListChildSelected.sort(function (a: any, b: any) {
      return a.dateDebut - b.dateDebut;
    });
  }
};

export const getMenuDayList = (
  menuJourListPar: any,
  selectedDay: any,
  selectedWeek: any,
  menuListPar: any,
  menuPLatCanteenPar: any,
) => {
  const dayListMenuTab: any = [];
  let dayListMenu: any = {};
  const menuJourList = menuJourListPar !== undefined ? menuJourListPar : [];
  for (let i = 0; i < menuJourList.length; i++) {
    const dayMenu = menuJourList[i];
    if (dayMenu.jour === selectedDay.jour.toUpperCase() && dayMenu.semaineId === selectedWeek?.id) {
      const menuCantineJours = dayMenu.menuCantineJours;
      const menuList = menuListPar !== undefined ? menuListPar : [];
      const menuPLatCanteen =
        menuPLatCanteenPar !== undefined ? menuPLatCanteenPar : [];

      if (menuCantineJours.length > 0) {
        for (let j = 0; j < menuCantineJours.length; j++) {
          const menuCantine = menuList.filter(
            (menu: any) => menu?.id === menuCantineJours[j]?.menuCantineId,
          );
          if (menuCantine.length > 0) {
            for (let k = 0; k < menuCantine.length; k++) {
              dayListMenu = {
                nom: menuCantine[k]?.nom,
                photo: menuCantine[k]?.photo,
                //photo: menuCantine[k].photo !== '' ? `${BASEURL_IMG}/${menuCantine[k].photo}` : IMGS.photoMenu,
              };

              const platCantines =
                menuCantine[k].menuPlatCantines !== undefined
                  ? menuCantine[k]?.menuPlatCantines
                  : [];
              if (platCantines.length > 0) {
                let menuPlat = {};
                for (let i = 0; i < platCantines.length; i++) {
                  for (let j = 0; j < menuPLatCanteen.length; j++) {
                    if (
                      menuPLatCanteen[j]?.id ===
                        platCantines[i]?.platCantineId &&
                      menuPLatCanteen[j]?.typePlat === 'ENTREE'
                    ) {
                      menuPlat = {
                        ...menuPlat,
                        entree: menuPLatCanteen[j]?.nom,
                      };
                    } else if (
                      menuPLatCanteen[j]?.id ===
                        platCantines[i]?.platCantineId &&
                      menuPLatCanteen[j]?.typePlat === 'PLAT'
                    ) {
                      menuPlat = {
                        ...menuPlat,
                        plat: menuPLatCanteen[j]?.nom,
                      };
                    } else if (
                      menuPLatCanteen[j]?.id ===
                        platCantines[i]?.platCantineId &&
                      menuPLatCanteen[j]?.typePlat === 'DESSERT'
                    ) {
                      menuPlat = {
                        ...menuPlat,
                        dessert: menuPLatCanteen[j]?.nom,
                      };
                    }
                  }
                }

                dayListMenu = {
                  ...dayListMenu,
                  ...menuPlat,
                  /*entree: entreeFind?.nom,
                  plat: platFind?.nom,
                  dessert: dessertFind?.nom,*/
                  itemMenuCanteenJourId: menuCantineJours[j]?.id,
                  menuCanteenJourId: dayMenu?.id,
                };
                dayListMenuTab.push(dayListMenu);
              }
            }
          }
        }
      }
    }
  }

  return dayListMenuTab;
};


export const getAllDiscussionTreadList = async (user: any, selectedChild: any) => {
  const selectedChildId = selectedChild.id;

  const dataToSend = {
    userId: user.id,
    uuid: user.uuid,
    nom: `${user?.userDetails?.personDetails?.person.nom} ${user?.userDetails?.personDetails?.person.prenom}`,
    role: user.role,
    connexionDate: 0,
    genre: user?.userDetails?.personDetails?.person.sexe,
    enfantNom: `${selectedChild.person.nom} ${selectedChild.person.prenom}`,
  };

  let discussionList: any = await putRequest(BASEURL_MSG_NOTIF, '/ws/chat/fildiscussions', dataToSend);

  if (discussionList !== undefined && discussionList !== '' && discussionList !== null) {
    discussionList = discussionList.sort(function (a: any, b: any) {
      return a.theDate - b.theDate;
    });
    discussionList.reverse();
  } else {
    discussionList = [];
  }

  let discussionListReq: any = [];
  if (discussionList.length > 0) {
    for (let i = 0; i < discussionList?.length; i++) {
      if (discussionList[i].enfantId === selectedChildId) {
        const discussionTreadMessageListReq: any = await putRequest(
            BASEURL_MSG_NOTIF,
            `/ws/chat/messages/space/${discussionList[i].id}`,
            dataToSend
        );

        if (
          discussionTreadMessageListReq !== undefined &&
          discussionTreadMessageListReq !== '' &&
          discussionTreadMessageListReq !== null &&
          discussionTreadMessageListReq.length > 0
        ) {
          const discussionTreadMessageList = discussionTreadMessageListReq.sort(
            function (a: any, b: any) {
              return a.theDate - b.theDate;
            },
          );
          discussionTreadMessageList.reverse();

          const filDiscussion = {
            ...discussionList[i],
            lastMessage: discussionTreadMessageList[0]?.message,
            theDateMessage: discussionTreadMessageList[0]?.theDate,
          };

          discussionListReq.push(filDiscussion);
        }
      }
    }
  }

  discussionListReq = discussionListReq.sort(
      function (a: any, b: any) {
        return a.theDateMessage - b.theDateMessage;
      },
  );

  return discussionListReq.reverse();
};


