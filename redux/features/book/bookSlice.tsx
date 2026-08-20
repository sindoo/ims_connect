import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  childBorrowedBooksList: [],
};

const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    setChildBorrowedBooksList: (state, action) => {
      state.childBorrowedBooksList = action.payload;
    },
    /*updateChildBorrowedBookList: (state, action) => {
            state.childBorrowedBooksList = action.payload;
        },*/
    initializeBorrowedBookValue: () => {
      return initialState;
    },
  },
});

export const {setChildBorrowedBooksList, initializeBorrowedBookValue} =
  bookSlice.actions;

export default bookSlice.reducer;
