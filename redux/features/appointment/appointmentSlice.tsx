import {createSlice} from '@reduxjs/toolkit';

const initialState: any = {
  presetList: [],
  allAppointmentList: [],
  activeAppointmentList: [],
  todayListAppointments: [],
  upcomingListAppointments: [],
};

const getActiveAppointmentList = (state: any) => {
  //ALL ACTIVE APPOINTMENT
  const today = new Date().setHours(0, 0, 0, 0);
  const allActiveAppointment: any = [];
  const allAppointmentList = state.allAppointmentList;

  if(allAppointmentList !== undefined){
    for (let i = 0; i < allAppointmentList?.length; i++) {
      const meetingDay = new Date(allAppointmentList[i]?.dateDebut).setHours(
          0,
          0,
          0,
          0,
      );
      if (
          meetingDay >= today &&
          allAppointmentList[i]?.meetingStatus !== 'CANCEL'
      ) {
        allActiveAppointment.push(allAppointmentList[i]);
      }
    }
    state.activeAppointmentList = allActiveAppointment;

    // TODAY APPOINTMENT LIST
    const todayListAppointReq: any = [];
    let number = 0;
    for (let i = 0; i < allActiveAppointment?.length; i++) {
      const meetingDay = new Date(allActiveAppointment[i]?.dateDebut).setHours(
          0,
          0,
          0,
          0,
      );
      if (number < 3) {
        if (today === meetingDay) {
          todayListAppointReq.push(allActiveAppointment[i]);
          number++;
        }
      } else {
        break;
      }
    }
    state.todayListAppointments = todayListAppointReq;

    // UPCOMING APPOINTMENT LIST
    let count = 0;
    const upcomingListAppointReq: any = [];
    const upcomingListAppointFilter = allActiveAppointment.filter(
        (item: any) => !todayListAppointReq.includes(item),
    );
    for (let i = 0; i < upcomingListAppointFilter?.length; i++) {
      if (count < 3) {
        upcomingListAppointReq.push(upcomingListAppointFilter[i]);
        count++;
      } else {
        break;
      }
    }
    state.upcomingListAppointments = upcomingListAppointReq;
  }
};

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setPresetAppointmentList: (state, action) => {
      state.presetList = action.payload;
    },
    updatePresetAppoint: (state, action) => {
      const presetData: any = state.presetList;
      const creneauRdvData = action.payload?.creneauRdvData;

      const rdvId = action.payload?.rdvId;
      let newListPreset: any = [];

      const dataRdvFind = presetData.find(
        (presetRdv: any) => presetRdv?.id === rdvId,
      );
      //console.log(JSON.stringify(presetData));

      const creneauRdvsFind = dataRdvFind?.creneauRdvs;
      /*const rdvUpdated = {
          ...dataRdvFind,
          creneauRdvs: {
              ...dataRdvFind.creneauRdvs
          }
      }*/

      for (let i = 0; i < creneauRdvsFind?.length; i++) {
        if (creneauRdvsFind[i]?.id === creneauRdvData?.id) {
          creneauRdvsFind[i] = creneauRdvData;
        }
        dataRdvFind.creneauRdvs = creneauRdvsFind;
      }

      newListPreset = presetData.map((preset: any, index: any) => {
        if (preset?.id === dataRdvFind?.id) {
          return dataRdvFind;
        }
        return preset;
      });

      state.presetList = newListPreset;
    },
    setAllAppointmentList: (state, action) => {
      state.allAppointmentList = action.payload;
      getActiveAppointmentList(state);
    },
    addNewAppointment: (state, action) => {
      state.allAppointmentList.push(action.payload);
      getActiveAppointmentList(state);
    },
    updateAppointment: (state, action) => {
      state.allAppointmentList = state.allAppointmentList.map(
        (appointment: any) => {
          if (appointment?.id === action.payload?.id) {
            return action.payload;
          } else {
            return appointment;
          }
        },
      );

      getActiveAppointmentList(state);
    },
    removeAppointment: (state, action) => {
      state.allAppointmentList = state.allAppointmentList.filter(
        (appointment: any) => action.payload?.id !== appointment?.id,
      );
      getActiveAppointmentList(state);
    },
    initializeAllAppointment: () => {
      return initialState;
    },
  },
});

export const {
  setPresetAppointmentList,
  updatePresetAppoint,
  setAllAppointmentList,
  initializeAllAppointment,
  addNewAppointment,
  updateAppointment,
  removeAppointment,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
