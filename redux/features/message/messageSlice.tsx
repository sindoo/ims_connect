import {createSlice} from '@reduxjs/toolkit';

const initialState: any = {
  discussionTreadList: [],
  messageDiscussionList: [],
};

const messageSlice = createSlice({
  name: 'messageCenter',
  initialState,
  reducers: {
    setDiscussionTreadList: (state, action) => {
      state.discussionTreadList = action.payload;
    },
    updateDiscussionTreadList: (state, action) => {
      state.discussionTreadList = state.discussionTreadList.map(
        (discussionThread: any) => {
          if (discussionThread.id === action.payload.id) {
            return action.payload;
          } else {
            return discussionThread;
          }
        },
      );
    },
    addNewDiscussionTreadToList: (state, action) => {
      state.discussionTreadList.push(action.payload);
      const list = state.discussionTreadList.sort(function (a: any, b: any) {
        return a.theDate - b.theDate;
      });
      list.reverse();

      state.discussionTreadList = list;
    },
    initializeDiscussion: () => {
      return initialState;
    },
  },
});

export const {
  setDiscussionTreadList,
  addNewDiscussionTreadToList,
  updateDiscussionTreadList,
  initializeDiscussion,
} = messageSlice.actions;

export default messageSlice.reducer;
