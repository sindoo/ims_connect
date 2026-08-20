import {createSlice} from '@reduxjs/toolkit';
import {removeAuthToken, setAuthToken} from '../../../api/ApiManager';

const initialState = {
  user: [],
  isLoggedIn: false,
  isLoading: false,
  userToken: null,
  userFCMToken: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginUser: (state, action) => {
      setAuthToken(action.payload.token);
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.userToken = action.payload.token;
    },
    logoutUser: state => {
      removeAuthToken();
      state.isLoggedIn = false;
      state.isLoading = false;
      state.userToken = null;
      state.user = [];

      return state;
      //return initialState;
    },
    setUserFCMToken: (state, action) => {
      state.userFCMToken = action.payload;
    },
    setUserSliceToken: (state, action) => {
      state.userToken = action.payload;
    },
  },
});

export const {
  loginUser,
  logoutUser,
  setUserFCMToken,
  setUserSliceToken
} = userSlice.actions;

export default userSlice.reducer;
