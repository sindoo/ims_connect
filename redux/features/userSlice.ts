import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    user: [],
    isLoggedIn: false,
    isLoading: false,
    userToken: null,
    onBoardingStatus: true,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        loginUser: (state, action) => {
            state.user = action.payload.user;
            state.isLoggedIn = true;
            state.onBoardingStatus = false;
            state.userToken = action.payload.token;
        },
        logoutUser: () => {
            return initialState;
        },
        setOnBoardingStatus: state => {
            state.onBoardingStatus = false;
        },
    },
});

export const {loginUser, logoutUser, setOnBoardingStatus} = userSlice.actions;

export default userSlice.reducer;
