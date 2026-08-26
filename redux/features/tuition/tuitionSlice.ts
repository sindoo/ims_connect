import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    paymentDetailsInRedux: null,
};

const tuitionSlice = createSlice({
    name: 'tuition',
    initialState,
    reducers: {
        setPaymentDetailsInRedux: (state, action) => {
            state.paymentDetailsInRedux = action.payload;
        },
        initializePaymentDetails: () => {
            return initialState;
        },
    },
});

export const {
    setPaymentDetailsInRedux,
    initializePaymentDetails
} = tuitionSlice.actions;

export default tuitionSlice.reducer;
