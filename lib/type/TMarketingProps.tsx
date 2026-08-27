import {NavigationProp, RouteProp} from 'expo-router/react-navigation';

export type TMarketingProps = {
  navigation?: NavigationProp<any>;
};

export type TMarketing = {
  id: number;
  nom: string;
  prix: number;
  quantite: number;
  photo: string;
  description: string;
  available: boolean;
};

export type TMarketingItemProps = {
  navigation?: NavigationProp<any>;
  data: TMarketing;
};

export type TProductDetailsProps = {
  route: {params: {data: TMarketing}} | RouteProp<any>;
  snackbarShowMessage?: any;
};
