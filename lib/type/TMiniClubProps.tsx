import {NavigationProp, RouteProp} from 'expo-router/react-navigation';

export type TMiniClubProps = {
  navigation: NavigationProp<any>;
};

export type TMiniClub = {
  id: number;
  title: string;
  prix: number;
  placeLimit: number;
  dateDebut: number;
  dateFin: number;
  registered: boolean;
  details: string;
  uriPublicite: string;
  inscritMiniClubs: [];
};

export type TMiniClubDetailsProps = {
  route: {params: {data: TMiniClub}} | RouteProp<any>;
  snackbarShowMessage?: any;
};

export type TMiniClubItemProps = {
  navigation?: NavigationProp<any>;
  data: TMiniClub;
};
