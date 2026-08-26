import {NavigationProp, RouteProp} from '@react-navigation/native';
import {Dispatch, SetStateAction} from 'react';

export type TPaymentTypeProps = {
  open: boolean;
  items: [];
  //value: DropDownPickerProps<any>,
  value: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setValue: Dispatch<SetStateAction<any>>;
  setItems: Dispatch<SetStateAction<any>>;
  onChangeValue(event: Event): void;
};

export type TPaymentItemProps = {
  navigation?: NavigationProp<any>;
  data: TPayment;
};

export type TPayment = {
  id: number;
  ladate: number;
  enfantId: number;
  parentId: number;
  scolariteTypeId: number;
  code: string;
  nom: string;
  montant: number;
  recu: string;
  payerpar: string;
};

export type TPaymentDetailsProps = {
  route: {params: {data: TPayment}} | RouteProp<any>;
};

export type TPaymentAmountProps = {
  montantFacture: string;
  montantPayer: string;
  montantSolde: string;
};
