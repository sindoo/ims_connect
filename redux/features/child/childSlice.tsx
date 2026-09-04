import {createSlice} from '@reduxjs/toolkit';

// Fonction de tri réutilisable
const sortChildren = (children: any[]) => {
  return [...children].sort((a, b) => {
    const nomA = a.person?.nom?.toLowerCase() || '';
    const nomB = b.person?.nom?.toLowerCase() || '';

    if (nomA !== nomB) {
      return nomA.localeCompare(nomB);
    }

    const prenomA = a.person?.prenom?.toLowerCase() || '';
    const prenomB = b.person?.prenom?.toLowerCase() || '';
    return prenomA.localeCompare(prenomB);
  });
};

const initialState = {
  children: [],
  selectedChild: null,
};

const childSlice = createSlice({
  name: 'child',
  initialState,
  reducers: {
    getUserChildren: (state, action) => {
      const enfants = action.payload.user.userDetails.personDetails.enfants || [];
      const sortedChildren = sortChildren(enfants);

      state.children = sortedChildren;
      state.selectedChild = sortedChildren?.length > 0 ? sortedChildren[0] : null;
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

      state.children = sortChildren(childTab);
      state.selectedChild = action.payload;
    },

    setUserChildren: (state, action) => {
      state.children = sortChildren(action.payload || []);
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
