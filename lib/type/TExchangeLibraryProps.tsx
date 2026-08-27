import {NavigationProp} from 'expo-router/react-navigation';
import {Dispatch, SetStateAction} from 'react';

export type TExchangeLibraryProps = {
  navigation?: NavigationProp<any>;
  snackbarShowMessage?: any;
};

export type TBorrowingProps = {
  navigation?: NavigationProp<any>;
  data?: TBook;
};

export type TBook = {
  id: number;
  nom: string;
  auteur: string;
  langue: string;
  quantite: number;
  photo: string;
  description: string;
  donateurs: string | undefined;
  deadlineRetour?: number | undefined;
};

export type TBookItemProps = {
  navigation?: NavigationProp<any>;
  data?: TBook;
  bookStatus?: boolean;
  borrowChildStatus?: boolean;
  comeBackDate?: boolean;
  bookDetail: boolean;
  setBookDetail: Dispatch<SetStateAction<boolean>>;
  donor: string;
  setDonor: Dispatch<SetStateAction<any>>;
  setDataBook: Dispatch<SetStateAction<any>>;
  handleBorrowBook(data: any, setBorrowLoadingItem: (value: (((prevState: boolean) => boolean) | boolean)) => void): void;
};
