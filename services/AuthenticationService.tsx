import {postRequest, putRequest} from "../api/ApiManager";
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
    return await putRequest('', '/public/auth/parent/motdepasse', {
      username: data.username.trim(),
      password: data.password.trim(),
      newPassword: data.newPassword.trim(),
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

