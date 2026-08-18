import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  students: [],
  selectedStudent: null,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    getUserChildren: (state, action) => {
      state.students = action.payload.studentList;
      const children: any = action.payload.studentList;
      state.selectedStudent = children.length > 0 ? children[0] : null;
    },
    changeChild: (state, action) => {
      state.selectedStudent = action.payload;
    },
    initializeChildValue: () => {
      return initialState;
    },
  },
});

export const {getUserChildren, changeChild, initializeChildValue} =
  studentSlice.actions;

export default studentSlice.reducer;
