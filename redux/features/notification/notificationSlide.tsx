import {createSlice} from '@reduxjs/toolkit';

const initialState: any = {
  notificationList: [],
  notificationNumber: 0,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotificationList: (state, action) => {
      state.notificationList = action.payload;
    },
    setNotificationNumber: (state, action) => {
      //console.log("Num notif" +action.payload)
      state.notificationNumber = action.payload;
    },
    initializeNotification: () => {
      return initialState;
    },
  },
});

export const {
  initializeNotification,
  setNotificationList,
  setNotificationNumber,
} = notificationSlice.actions;

export default notificationSlice.reducer;
