import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {captureApiError} from '../services/sentryService';

// LOCAL CONFIG
const AXIOS_BASEURL = 'https://ims.bagadis.com/api/v1'; // GOOD


// AWS CONFIG
//const AXIOS_BASEURL = "https://ivorymontessorisystem.com/imsv3/api/v1"; // GOOD

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';

// Toute réponse d'erreur de l'API (4xx/5xx) est signalée à Sentry, puis
// l'erreur est relancée telle quelle : les écrans la traitent comme avant.
axios.interceptors.response.use(
    response => response,
    error => {
      captureApiError(error);
      return Promise.reject(error);
    },
);

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
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
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

// signal (optionnel) : permet d'annuler la requête via un AbortController,
// sans casser les appels existants qui ne le fournissent pas.
export const getRequest = async (baseURL: any, url: any, signal?: AbortSignal) => {
  let headers = {};
  const token = await getAuthToken();
  const completeURL = baseURL === '' ? AXIOS_BASEURL + url : baseURL + url;

  if (token !== null) {
    headers = {...headers, ...{Authorization: `Bearer ${token}`}};
  }
  const config: any = {
    headers: headers,
  };
  if (signal) {
    config.signal = signal;
  }
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

  let discussionList: any = await putRequest('', '/ws/chat/fildiscussions', dataToSend);

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
            '',
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
