import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  employees: [],
  teacherList: [],
  teacherSelected: null,
  employeesClassList: [],
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    getEmployeesTeacher: (state, action) => {
      state.employees = action.payload.employees;
      state.teacherList = action.payload.teacherList;
      state.teacherSelected = action.payload.teacher;
      state.employeesClassList = action.payload.employeesClassList;
    },
    initializeTeacherValue: () => {
      return initialState;
    },
  },
});

export const {getEmployeesTeacher, initializeTeacherValue} =
  employeeSlice.actions;

export default employeeSlice.reducer;
