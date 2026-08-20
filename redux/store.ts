import {
    configureStore,
    combineReducers,
    ThunkAction,
    Action,
} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userReducer from './features/userSlice';
import childReducer from './features/child/childSlice';
import appointmentReducer from './features/appointment/appointmentSlice';
import employeeReducer from './features/employee/employeeSlice';
import languageReducer from './features/language/languageSlice';
import messageReducer from './features/message/messageSlice';
import notificationReducer from './features/notification/notificationSlide';
import bookReducer from './features/book/bookSlice';
import miniclubReducer from './features/club/miniClubSlice';
import marketingReducer from './features/marketing/marketingSlice';
import alertMessageReducer from './features/alertmessage/alertMessageSlide';
import stackReducer from './features/stack/stackSlice';

const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
};

const reducer = combineReducers({
    user: userReducer,
    child: childReducer,
    appointment: appointmentReducer,
    employee: employeeReducer,
    language: languageReducer,
    messageCenter: messageReducer,
    notification: notificationReducer,
    book: bookReducer,
    miniclub: miniclubReducer,
    marketing: marketingReducer,
    alertMessage: alertMessageReducer,
    stackScreen:stackReducer,
});

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;
