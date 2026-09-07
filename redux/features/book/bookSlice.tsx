import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  childBorrowedBooksList: [],
  childHistoryBooksList: [],
};

const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    setChildBorrowedBooksList: (state, action) => {
      state.childBorrowedBooksList = action.payload;
    },
    setChildHistoryBooksList: (state, action) => {
      state.childHistoryBooksList = action.payload;
    },
    /*updateChildBorrowedBookList: (state, action) => {
            state.childBorrowedBooksList = action.payload;
        },*/
    initializeBorrowedBookValue: () => {
      return initialState;
    },
  },
});

export const {
  setChildBorrowedBooksList, setChildHistoryBooksList, initializeBorrowedBookValue} = bookSlice.actions;

export default bookSlice.reducer;
