import {
    configureStore,
    combineReducers,
    ThunkAction,
    Action,
} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userReducer from './features/user/userSlice';
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
import tuitionReducer from './features/tuition/tuitionSlice';

// ✅ Whitelist : seul ce qui doit être disponible instantanément au
// démarrage (avant même le premier appel réseau) est persisté et donc
// réhydraté depuis AsyncStorage. Tout le reste (rendez-vous, messages,
// notifications, mini-clubs, marketing, tuition, stack d'écrans...) est
// de toute façon rechargé depuis l'API après connexion : le persister
// alourdissait chaque écriture/lecture AsyncStorage et ralentissait le
// démarrage pour rien.
// ⚠️ À ajuster si un de ces reducers doit rester disponible hors-ligne.
const persistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['user', 'child', 'language'],
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
    tuition: tuitionReducer,
});

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
        //immutableCheck: { warnAfter: 200 },
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

