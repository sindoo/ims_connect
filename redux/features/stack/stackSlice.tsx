import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    firstLog: false,
    stackStatus: false,
};

const stackSlice = createSlice({
    name: 'stackScreen',
    initialState,
    reducers: {
        changeStack: (state, action) => {
            state.stackStatus = action.payload;
        },
        changeFirstLog: (state, action) => {
            state.firstLog = action.payload;
        },
        initializeStack: state => {
            return initialState;
        },
    },
});

export const {
    changeStack,
    changeFirstLog,
    initializeStack,
} = stackSlice.actions;

export default stackSlice.reducer;
