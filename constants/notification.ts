import {ROUTES} from "./index";

export const NOTIFICATION_TAG_EN: any = [
  {
    tag: 'rdv',
    value: 'Appointment',
  },
  {
    tag: 'message_center',
    value: 'Message',
  },
  {
    tag: 'alertmessage',
    value: 'Information',
  },
  {
    tag: 'imsday',
    value: 'My day at IMS',
  },
  {
    tag: 'miniclubs',
    value: 'Mini club',
  },
  {
    tag: 'sondage',
    value: 'Survey',
  },
  {
    tag:'documents',
    value:'School documents',
  }
];

export const NOTIFICATION_TAG_FR: any = [
  {
    tag: 'rdv',
    value: 'Rendez-vous',
  },
  {
    tag: 'message_center',
    value: 'Message',
  },
  {
    tag: 'alertmessage',
    value: "Information",
  },
  {
    tag: 'imsday',
    value: 'Ma journée à IMS',
  },
  {
    tag: 'miniclubs',
    value: 'Mini club',
  },
  {
    tag: 'sondage',
    value: 'Sondage',
  },
  {
      tag:'documents',
      value:'Documents scolaires',
  }
];

export const NOTIFICATION_MESSAGE_EN: any = [
  {
    tag: 'rdv',
    action: 'create',
    value: 'Appointment request',
  },
  {
    tag: 'rdv',
    action: 'update',
    value: 'Appointment update',
  },
  {
    tag: 'rdv',
    action: 'delete',
    value: 'Appointment deleted',
  },
  {
    tag: 'alertmessage',
    action: 'create',
    value: 'Information',
  },
  {
    tag: 'message_center',
    action: 'create',
    value: 'New message',
  },
  {
    tag: 'message_center',
    action: 'update',
    value: 'New message',
  },
  {
    tag: 'message_center',
    action: 'delete',
    value: 'Message deleted',
  },
  {
    tag: 'imsday',
    action: 'create',
    value: 'New IMS Day',
  },
  {
    tag: 'imsday',
    action: 'update',
    value: 'IMS Day updated',
  },
  {
    tag: 'imsday',
    action: 'delete',
    value: 'IMS Day deleted',
  },
  {
    tag: 'miniclubs',
    action: 'create',
    value: 'New mini club',
  },
  {
    tag: 'miniclubs',
    action: 'update',
    value: 'Mini club updated',
  },
  {
    tag: 'miniclubs',
    action: 'delete',
    value: 'Mini club deleted',
  },
  //SONDAGE
  {
    tag: 'sondage',
    action: 'create',
    value: 'New survey',
  },
  {
    tag: 'sondage',
    action: 'update',
    value: 'Survey updated',
  },
  {
    tag: 'sondage',
    action: 'delete',
    value: 'Survey deleted',
  },
  //DOCUMENTS
  {
      tag: 'documents',
      action: 'create',
      value: 'School document added'
  },
  {
      tag: 'documents',
      action: 'update',
      value: 'School document added'
  },
  {
      tag: 'documents',
      action: 'delete',
      value: 'School document deleted'
  }

];

export const NOTIFICATION_MESSAGE_FR: any = [
  {
    tag: 'rdv',
    action: 'create',
    value: 'Rendez-vous demandé',
  },
  {
    tag: 'rdv',
    action: 'update',
    value: 'Rendez-vous mis à jour',
  },
  {
    tag: 'rdv',
    action: 'delete',
    value: 'Rendez-vous supprimé',
  },
  {
    tag: 'alertmessage',
    action: 'create',
    value: "Information",
  },
  {
    tag: 'message_center',
    action: 'create',
    value: 'Nouveau message',
  },
  {
    tag: 'message_center',
    action: 'update',
    value: 'Nouveau message',
  },
  {
    tag: 'message_center',
    action: 'delete',
    value: 'Message supprimé',
  },
  {
    tag: 'imsday',
    action: 'create',
    value: 'Nouvelle journée à IMS',
  },
  {
    tag: 'imsday',
    action: 'update',
    value: 'Ma journée à IMS mise à jour',
  },
  {
    tag: 'imsday',
    action: 'delete',
    value: 'Ma journée à IMS supprimée',
  },
  {
    tag: 'miniclubs',
    action: 'create',
    value: 'Nouveau mini club',
  },
  {
    tag: 'miniclubs',
    action: 'update',
    value: 'Mini club mis à jour',
  },
  {
    tag: 'miniclubs',
    action: 'delete',
    value: 'Mini club supprimé',
  },
  //SONDAGE
  {
    tag: 'sondage',
    action: 'create',
    value: 'Nouveau sondage',
  },
  {
    tag: 'sondage',
    action: 'update',
    value: 'Sondage mis à jour',
  },
  {
    tag: 'sondage',
    action: 'delete',
    value: 'Sondage supprimé',
  },
  //DOCUMENTS
  {
      tag: 'documents',
      action: 'create',
      value: 'Document scolaire ajouté'
  },
  {
      tag: 'documents',
      action: 'update',
      value: 'Document scolaire ajouté'
  },
  {
      tag: 'documents',
      action: 'delete',
      value: 'Document scolaire supprimé'
  }
];

export const NOTIFICATION_NAGIVATION: any = [
  {
    tag: 'rdv',
    value: ROUTES.APPOINTMENT_TAB,
  },
  {
    tag: 'message_center',
    value: ROUTES.MESSAGE_TAB,
  },
  {
    tag: 'miniclubs',
    value: ROUTES.MORE_TAB,
    //value: ROUTES.MINI_CLUB,
  },
  {
    tag: 'imsday',
    value: ROUTES.IMS_DAY_TAB,
  },
  {
    tag: 'livremprunt',
    value: ROUTES.EXCHANGE_LIBRARY,
  },
  {
    tag: 'alertmessage',
    value: ROUTES.HOME_TAB,
  },
  {
    tag: 'sondage',
    value: ROUTES.MORE_TAB,
  },
  {
    tag: 'documents',
    value: ROUTES.MORE_TAB,
  },
];
