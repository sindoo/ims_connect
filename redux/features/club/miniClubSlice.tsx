import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  childMiniClubList: [],
  updateMiniClubStatus: 0,
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
    initializeChildMiniClubList: state => {
      return initialState;
    },
  },
});

export const {
  setChildMiniClubList,
  initializeChildMiniClubList,
  updateMiniClubStatus,
} = miniClubSlice.actions;

export default miniClubSlice.reducer;
