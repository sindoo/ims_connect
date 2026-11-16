import {getRequest, postRequest, putRequest} from "../api/ApiManager";
import {FormikValues} from "formik";
import jwt_decode from "jwt-decode";
import {toDate} from "date-fns";

class AuthenticationService {
  static authenticateUser = (data: FormikValues) => {
    return postRequest('', '/mobileapi/login', {
      username: data.username,
      password: data.password,
    });
  };
  static updateUserPassword = async (data: any) => {
    return await putRequest('', '/security/update/parent/motdepasse', {
      username: data.username.trim(),
      password: data.password.trim(),
      newPassword: data.newPassword.trim(),
    });
  };
  // Vérifie si un nom d'utilisateur est utilisable :
  // GET /security/update/username/availability?username=<nom>
  // La réponse est normalisée, quelle que soit sa forme :
  // - booléen (ou "true"/"false"), ou objet {available|disponible|isAvailable|free} -> available
  // - liste de noms (ou objet contenant une liste) -> suggestions ; le nom
  //   demandé est disponible s'il figure dans la liste
  // available = null : réponse non reconnue, le serveur tranchera à l'enregistrement.
  static checkUsernameAvailability = async (
      username: string,
      signal?: AbortSignal,
  ): Promise<{available: boolean | null; suggestions: string[]}> => {
    const wanted = String(username ?? '').trim();
    const response: any = await getRequest(
        '',
        `/security/update/username/availability?username=${encodeURIComponent(wanted)}`,
        signal,
    );

    const toNames = (list: any): string[] => Array.from(new Set(
        (Array.isArray(list) ? list : [])
            .map((item: any) => (typeof item === 'string' ? item : item?.username ?? item?.login ?? ''))
            .map((name: any) => String(name ?? '').trim())
            .filter((name: string) => name !== ''),
    ));
    const toBoolean = (value: any): boolean | null => {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return null;
    };

    if (Array.isArray(response)) {
      const suggestions = toNames(response);
      return {
        available: suggestions.some(name => name.toLowerCase() === wanted.toLowerCase()),
        suggestions,
      };
    }

    const direct = toBoolean(response);
    if (direct !== null) return {available: direct, suggestions: []};

    if (response && typeof response === 'object') {
      const suggestions = toNames(
          response.usernames ?? response.suggestions ?? response.availableUsernames ?? response.data ?? [],
      );
      let available = toBoolean(
          response.available ?? response.disponible ?? response.isAvailable ?? response.free ?? response.data,
      );
      if (available === null && suggestions.length > 0) {
        available = suggestions.some(name => name.toLowerCase() === wanted.toLowerCase());
      }
      return {available, suggestions};
    }

    return {available: null, suggestions: []};
  };
  static updateUsername = async (currentUsername: string, password: string, newUsername: string) => {
    return await putRequest('', '/security/update/username', {
      username: String(currentUsername ?? '').trim(),
      password: String(password ?? '').trim(),
      newUsername: String(newUsername ?? '').trim(),
    });
  };
  static updateUserPasswordForgotten = async (username: string) => {
    return await putRequest(
        '',
        `/public/auth/parent/motdepasse/oublie/${username}`,
        {},
    );
  }
  static checkTokenValidity = (userToken: any) => {
    try {
      if(userToken !== null) {
        if (userToken) {
          let decodedToken: any = jwt_decode(userToken);
          const currentDate = new Date();
          const  date = decodedToken.exp * 1000;
          //console.log(toDate((date)));
          if (date < currentDate.getTime()) {
            return true
          }
        }
        return false;
      }
      else {
        return false;
      }
    }
    catch (error) {
      console.log('Error decoding token:', error);
      return false;
    }
  };

}

export default AuthenticationService;

