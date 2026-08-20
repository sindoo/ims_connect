import {createSlice} from '@reduxjs/toolkit';

const initialState: any = {
  openAlert: false,
  dataNotification: null,
  //notificationNumber: 0,
};

const alertMessageSlice = createSlice({
  name: 'alertmessage',
  initialState,
  reducers: {
    setAlertMessageHeader: (state, action) => {
      state.openAlert = action.payload;
    },
    setDataNotification: (state, action) => {
      state.dataNotification = action.payload;
      //console.log(state.openAlert);
    },
    initializeAlertMessage: () => {
      return initialState;
    },
  },
});

export const {
  initializeAlertMessage,
  setAlertMessageHeader,
  setDataNotification,
} = alertMessageSlice.actions;

export default alertMessageSlice.reducer;
