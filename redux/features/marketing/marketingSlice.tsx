import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  userOrderList: [],
};

const marketingSlice = createSlice({
  name: 'marketing',
  initialState,
  reducers: {
    setUserOderList: (state, action) => {
      state.userOrderList = action.payload;
    },
    initializeUserOderList: () => {
      return initialState;
    },
  },
});

export const {setUserOderList, initializeUserOderList} = marketingSlice.actions;

export default marketingSlice.reducer;
