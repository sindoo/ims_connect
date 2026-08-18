import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    languageSelected: 'fr',
};

const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        changeAppLanguage: (state, action) => {
            state.languageSelected = action.payload;
        },
        initializeLangValue: state => {
            return initialState;
        },
    },
});

export const { changeAppLanguage, initializeLangValue } =
    languageSlice.actions;

export default languageSlice.reducer;
