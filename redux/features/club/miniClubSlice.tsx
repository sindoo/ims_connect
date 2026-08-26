import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  childMiniClubList: [],
  updateMiniClubStatus: 0,
  miniClubDetailsInRedux: null
};

const miniClubSlice = createSlice({
  name: 'miniclub',
  initialState,
  reducers: {
    setChildMiniClubList: (state, action) => {
      state.childMiniClubList = action.payload;
    },
    updateMiniClubStatus: (state, action) => {
      state.updateMiniClubStatus = action.payload;
    },
    setMiniClubDetailsInRedux: (state, action) => {
      state.miniClubDetailsInRedux = action.payload;
    },
    initializeChildMiniClubList: state => {
      return initialState;
    },
  },
});

export const {
  setChildMiniClubList,
  initializeChildMiniClubList,
  updateMiniClubStatus,
  setMiniClubDetailsInRedux,
} = miniClubSlice.actions;

export default miniClubSlice.reducer;
