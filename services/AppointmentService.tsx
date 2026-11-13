import {getRequest} from "../api/ApiManager";
// ✅ Import ciblé de la fonction utilisée au lieu de tout "lodash" :
// évite d'embarquer toute la librairie dans le bundle JS pour une seule
// fonction, ce qui réduit le temps de parsing/démarrage de l'app.
import isEmpty from "lodash/isEmpty";

class AppointmentService {
  static getAppointmentById = async (appointmentId: number, signal?: AbortSignal) => {
    return await getRequest('', `/extra/rdv/${appointmentId}`, signal);
  }
  // ✅ `signal` (optionnel) permet à l'appelant d'annuler cette requête
  // (via AbortController) si le composant est démonté ou si l'enfant
  // sélectionné change avant que la réponse n'arrive — évite qu'une
  // réponse tardive et obsolète n'écrase des données plus récentes.
  static getAllAppointment = async (selectedChildId: number, signal?: AbortSignal) => {
    let allAppointmentListReq:any = [];
    const allAppointmentRequest:any = await getRequest('', '/extra/rdv', signal);

    allAppointmentListReq = isEmpty(allAppointmentRequest) || isEmpty(allAppointmentRequest?._embedded) ?
        [] : allAppointmentRequest?._embedded.rdvDTOModelList;
    return AppointmentService.getAllAppointmentList(allAppointmentListReq, selectedChildId);
  };
  // ✅ Ne fait plus rien d'asynchrone (aucun `await` dans le corps) : le
  // marquer `async` forçait un aller-retour supplémentaire par microtask
  // avant que l'appelant ne récupère le résultat, pour rien.
  static getAllAppointmentList = (allAppointmentListReq: any, selectedChildId: number,) => {
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
            allChildAppointment[i]?.meetingStatus === 'CONFIRM'
        ) {
          allActiveAppointment.push(allChildAppointment[i]);
        }
      }
      return allActiveAppointment;
    }
    return allChildAppointment;
  };
  // ✅ Idem : accepte un `signal` pour pouvoir annuler la requête en vol
  // (utilisé par preset-appointment.tsx quand l'enfant sélectionné change).
  //
  // ⚠️ Cet appel télécharge tout `/extra/rdv` (comme getAllAppointment
  // ci-dessus) puis filtre côté client par classe + type PRESET. Si
  // l'écran d'accueil a déjà chargé la même ressource `/extra/rdv` juste
  // avant (voir home/index.tsx), c'est un aller-retour réseau redondant
  // pour les mêmes données brutes. Une route backend dédiée existe
  // apparemment (`/extra/rdv/presets/{personId}`, commentée plus bas) :
  // si elle est fonctionnelle côté serveur, l'utiliser réduirait nettement
  // la charge et le temps de réponse par rapport au filtrage côté client
  // sur la liste complète. Je ne l'active pas moi-même car je ne peux pas
  // vérifier que cette route répond correctement côté backend.
  static getAllPresetAppointment = async (selectedChild: any, signal?: AbortSignal) => {
    const selectedChildClass = selectedChild?.eleves?.[0]?.classe;
    //const appointmentListRequest: any = await getRequest('', '/extra/rdv', signal);
    const appointmentListRequest: any = await getRequest('', `/extra/rdv/presets/${selectedChild?.person?.id}`, signal);
   // console.log(JSON.stringify(appointmentListRequest));

    //console.log(JSON.stringify(appointmentListRequest))
    const appointmentList: any = isEmpty(appointmentListRequest) || isEmpty(appointmentListRequest?._embedded) ?
        [] : appointmentListRequest?._embedded?.rdvDTOModelList;

    if(appointmentList.length > 0){
      //return appointmentList;
      return appointmentList.filter(
          (appointment: any) => appointment.classeId === selectedChildClass?.id && appointment.meetingType === 'PRESET'
      );
    }
    else  return [];
  };

  static getAppointmentByDate =  async (selectedChild: any, signal?: AbortSignal) => {
    const selectedChildClass = selectedChild?.eleves?.[0]?.classe;
    const today = new Date().setHours(0, 0, 0, 0);
    let openDataRequest  = await getRequest('', `/extra/rdv/classe/${selectedChildClass?.id}/date/${today}`, signal);
    openDataRequest = openDataRequest._embedded !== undefined
        ? openDataRequest._embedded.rdvDTOModelList
        : [];

    return openDataRequest.sort(function (a: any, b: any) {
      return a.dateDebut - b.dateDebut;
    });
  }
}

export default AppointmentService;
