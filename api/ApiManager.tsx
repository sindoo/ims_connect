import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {captureApiError, captureMissingParam} from '../services/sentryService';
import i18next from '../i18next/i18next';
import {getOfflineReason, isNetworkError, reportRequestWithoutResponse, setOffline} from './connectivity';
import {requestEnded, requestStarted} from './activity';
import {serverErrorMessage} from './serverErrors';

// LOCAL CONFIG
//const AXIOS_BASEURL = 'https://ims.bagadis.com/api/v1'; // GOOD


// AWS CONFIG
const AXIOS_BASEURL = "https://ivorymontessorisystem.com/imsv3/api/v1"; // GOOD

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';
// Sans délai maximal, une requête lancée pendant un changement de réseau
// (Wi-Fi -> 4G) peut rester bloquée indéfiniment (chargement sans fin).
// Au-delà, elle échoue comme une erreur réseau et l'écran peut l'afficher.
const REQUEST_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 120000;
axios.defaults.timeout = REQUEST_TIMEOUT_MS;

// Ce module peut être réexécuté (Fast Refresh en développement) : sans
// précaution, les intercepteurs s'ajouteraient à chaque fois et le compteur de
// requêtes en cours ne redescendrait plus à zéro. On retire donc ceux posés
// lors d'une exécution précédente avant de les réenregistrer.
const interceptorIds: {request?: number; response?: number} =
    ((globalThis as any).__imsAxiosInterceptors ??= {});
if (interceptorIds.request !== undefined) axios.interceptors.request.eject(interceptorIds.request);
if (interceptorIds.response !== undefined) axios.interceptors.response.eject(interceptorIds.response);

// Compte les requêtes en cours (indicateur de chargement global).
// Une requête n'est comptée qu'une seule fois, même si l'intercepteur était présent en double.
interceptorIds.request = axios.interceptors.request.use(config => {
  if (!(config as any).__counted) {
    (config as any).__counted = true;
    requestStarted();
  }
  return config;
});

const endCountedRequest = (config: any) => {
  if (config?.__counted) {
    config.__counted = false;
    requestEnded();
  }
};

// Toute réponse d'erreur de l'API (4xx/5xx) est signalée à Sentry, puis
// l'erreur est relancée telle quelle : les écrans la traitent comme avant.
interceptorIds.response = axios.interceptors.response.use(
    response => {
      endCountedRequest(response?.config);
      setOffline(false);
      return response;
    },
    error => {
      endCountedRequest(error?.config);
      if (isNetworkError(error)) {
        // Pas de réponse du serveur : pas d'Internet ou serveur injoignable
        reportRequestWithoutResponse();
      } else if (error?.response) {
        // Le serveur a répondu (même en erreur) : la connexion fonctionne
        setOffline(false);
      }
      // Le test de connexion (pingServer) attend une réponse quelconque, y compris
      // 403/404 : ce n'est pas une erreur à signaler à Sentry.
      if (!(error?.config as any)?.__connectivityCheck) {
        captureApiError(error);
      }
      return Promise.reject(error);
    },
);

// Vérifie si le serveur est de nouveau joignable (utilisé par le bandeau
// "hors connexion"). Toute réponse, même 401/404, signifie que la connexion
// est rétablie : l'intercepteur ci-dessus met alors à jour l'état.
export const pingServer = async () => {
  try {
    await axios.get(AXIOS_BASEURL, {timeout: 8000, __connectivityCheck: true} as any);
  } catch {
    // l'intercepteur a déjà mis à jour l'état de connexion
  }
};

// ===== Garde-fou : identifiant manquant dans l'URL =====
// Un id null/undefined dans un template (`/enfant/${id}`) produit une URL comme
// "/enfant/undefined" que le backend rejette avec une erreur peu parlante.
// Toutes les requêtes passent par ce contrôle : la requête n'est pas envoyée,
// une MissingParamError est levée (message traduit pour l'utilisateur) et le
// cas est signalé à Sentry.
const INVALID_URL_VALUE = /^(undefined|null|NaN|\[object Object\])$/;

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const findMissingUrlParam = (url: unknown): boolean => {
  if (typeof url !== 'string') return false;
  const [rawPath, query = ''] = url.split('?');
  const path = rawPath.replace(/^https?:\/\/[^/]+/i, '');
  const segments = path.split('/');
  const badSegment = segments.some((segment, index) => {
    const value = safeDecode(segment);
    // segment vide au milieu ("//") = valeur vide interpolée
    const isEmptyMiddle = value === '' && index > 0 && index < segments.length - 1;
    return isEmptyMiddle || INVALID_URL_VALUE.test(value);
  });
  if (badSegment) return true;
  return query
      .split('&')
      .filter(Boolean)
      .some(pair => INVALID_URL_VALUE.test(safeDecode(pair.split('=')[1] ?? '')));
};

export class MissingParamError extends Error {
  code = 'ERR_MISSING_PARAM';
  isMissingParam = true;
  config: {method: string; url: string};

  constructor(method: string, url: string) {
    super(i18next.t('snackBar.sb_missing_data'));
    this.name = 'MissingParamError';
    this.config = {method, url};
  }
}

const assertUrlParams = (method: string, url: unknown) => {
  if (findMissingUrlParam(url)) {
    captureMissingParam(method, String(url));
    throw new MissingParamError(method, String(url));
  }
};

// Message à afficher à l'utilisateur : message dédié si un identifiant manquait,
// sinon le message d'erreur habituel de l'écran (fallback).
// Absence de connexion : message dédié également.
export const apiErrorMessage = (error: any, fallback: string): string => {
  if (error?.isMissingParam) return i18next.t('snackBar.sb_missing_data');
  if (isNetworkError(error)) {
    return getOfflineReason() === 'server'
        ? i18next.t('snackBar.sb_server_unreachable')
        : i18next.t('snackBar.sb_no_connection');
  }
  // Erreur connue du serveur (dictionnaire des codes) : message précis ; sinon
  // le message habituel de l'écran.
  return serverErrorMessage(error) ?? fallback;
};

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
  assertUrlParams(String(method), url);
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
  assertUrlParams(String(method), url);
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
    timeout: UPLOAD_TIMEOUT_MS,
  });
};

// signal (optionnel) : permet d'annuler la requête via un AbortController,
// sans casser les appels existants qui ne le fournissent pas.
export const getRequest = async (baseURL: any, url: any, signal?: AbortSignal) => {
  assertUrlParams('GET', url);
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
  assertUrlParams('POST', url);
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
  assertUrlParams('PUT', url);
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
  assertUrlParams('DELETE', url);
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
