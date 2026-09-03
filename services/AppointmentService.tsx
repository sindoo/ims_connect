import {getRequest} from "../api/ApiManager";
import _ from "lodash";

class AppointmentService {
  static getAppointmentById = async (appointmentId: number) => {
    return await getRequest('', `/extra/rdv/${appointmentId}`);
  }
  static getAllAppointment = async (selectedChildId: number) => {
    let allAppointmentListReq:any = [];
    const allAppointmentRequest:any = await getRequest('', '/extra/rdv');

    allAppointmentListReq = _.isEmpty(allAppointmentRequest) || _.isEmpty(allAppointmentRequest?._embedded) ?
        [] : allAppointmentRequest?._embedded.rdvDTOModelList;
    return AppointmentService.getAllAppointmentList(allAppointmentListReq, selectedChildId);
  };
  static getAllAppointmentList = async (allAppointmentListReq: any, selectedChildId: number,) => {
    let allRdvListChildSelected: any = [];
    if (allAppointmentListReq.length > 0) {
      for (let i = 0; i < allAppointmentListReq.length; i++) {
        const appointment: any = allAppointmentListReq[i];

        if (
            appointment.meetingType === 'PRESET' &&
            (appointment.meetingStatus === 'CONFIRM' ||
                appointment.meetingStatus === 'PARTIAL_CONFIRM')
        ) {
          if (appointment?.creneauRdvs.length > 0) {
            for (let j = 0; j < appointment?.creneauRdvs.length; j++) {
              if (
                  appointment?.creneauRdvs[j]?.creneauRdvEnfantParents?.length > 0
              ) {
                if (
                    appointment.creneauRdvs[j]?.creneauRdvEnfantParents[0]
                        ?.enfantId === selectedChildId
                ) {
                  allRdvListChildSelected.push(appointment);
                }
              }
            }
          }
        } else if (appointment.meetingType === 'NORMAL') {
          if (appointment.creneauRdvs.length > 0) {
            if (appointment.creneauRdvs[0].creneauRdvEnfantParents.length > 0) {
              if (
                  appointment.creneauRdvs[0].creneauRdvEnfantParents[0]
                      .enfantId === selectedChildId
              ) {
                allRdvListChildSelected.push(appointment);
              }
            }
          }
        }
      }
    }

    return allRdvListChildSelected.sort(function (a: any, b: any) {
      return a.dateDebut - b.dateDebut;
    });
  };
  static getChildActiveAppointmentList = (allChildAppointment: any) => {
    //ALL ACTIVE APPOINTMENT
    const today = new Date().setHours(0, 0, 0, 0);
    const allActiveAppointment: any = [];
    if(allChildAppointment !== undefined){
      for (let i = 0; i < allChildAppointment?.length; i++) {
        const meetingDay = new Date(allChildAppointment[i]?.dateDebut).setHours(
            0,
            0,
            0,
            0,
        );
        if (
            meetingDay >= today &&
            allChildAppointment[i]?.meetingStatus !== 'CANCEL'
        ) {
          allActiveAppointment.push(allChildAppointment[i]);
        }
      }
      return allActiveAppointment;
    }
    return allChildAppointment;
  };
  static getAllPresetAppointment = async (selectedChild: any) => {
    const selectedChildClass = selectedChild?.eleves[0]?.classe;
    const appointmentListRequest: any = await getRequest('', '/extra/rdv');

    const appointmentList: any = _.isEmpty(appointmentListRequest) || _.isEmpty(appointmentListRequest?._embedded) ?
        [] : appointmentListRequest?._embedded?.rdvDTOModelList;
    if(appointmentList.length > 0){
      return appointmentList.filter(
          (appointment: any) => appointment.classeId === selectedChildClass?.id && appointment.meetingType === 'PRESET'
      );
    }
    else  return [];
  };

  static getAppointmentByDate =  async (selectedChild: any) => {
    const selectedChildClass = selectedChild?.eleves[0]?.classe;
    const today = new Date().setHours(0, 0, 0, 0);
    let openDataRequest  = await getRequest('', `/extra/rdv/classe/${selectedChildClass?.id}/date/${today}`);
    openDataRequest = openDataRequest._embedded !== undefined
            ? openDataRequest._embedded.rdvDTOModelList
            : [];

    return openDataRequest.sort(function (a: any, b: any) {
      return a.dateDebut - b.dateDebut;
    });
  }
}

export default AppointmentService;
