import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  children: [],
  selectedChild: null,
};

const childSlice = createSlice({
  name: 'child',
  initialState,
  reducers: {
    getUserChildren: (state, action) => {
      state.children = action.payload.user.userDetails.personDetails.enfants;
      const child: any = action.payload.user.userDetails.personDetails.enfants;
      state.selectedChild = child?.length > 0 ? child[0] : null;
    },
    changeChild: (state, action) => {
      let childTab: any = [];
      if (state.children.length > 0) {
        for (let i = 0; i < state.children.length; i++) {
          const child: any = state.children[i];
          if (child?.person?.id === action.payload?.person?.id) {
            childTab.push(action.payload);
          } else {
            childTab.push(child);
          }
        }
      }

      state.children = childTab;
      state.selectedChild = action.payload;
    },
    setUserChildren: (state, action) => {
      state.children = action.payload;
    },
    initializeChildValue: () => {
      return initialState;
    },
  },
});

export const {
  getUserChildren,
  changeChild,
  setUserChildren,
  initializeChildValue
} = childSlice.actions;

export default childSlice.reducer;
