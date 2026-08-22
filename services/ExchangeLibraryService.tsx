import {getRequest, postRequest} from "../api/ApiManager";
import {getTime} from "date-fns";
import {CONSTANT} from "../constants";

class ExchangeLibraryService {
  static getChildBorrowBooksList = async (selectedChildId: number) => {
      const booksBorrowRequest: any = await getRequest(
          '',
          `/extra/livremprunt/encours/enfant/${selectedChildId}`,
      );

      const resultList = booksBorrowRequest._embedded !== undefined
          ? booksBorrowRequest._embedded.livreEmpruntDTOModelList
          : [];
      let bookList = [];
      let updateBook = null;
      if (resultList.length > 0) {
          for (let i = 0; i < resultList.length; i++) {
              const book = resultList[i];
              const booksBorrowRequest: any = await getRequest(
                  '',
                  `/extra/bibliotheque/${book.livreId}`,
              );
              if (booksBorrowRequest !== undefined) {
                  updateBook = {
                      ...booksBorrowRequest,
                      ...book,
                  };
              }
              if (updateBook !== null) {
                  bookList.push(updateBook);
              }
          }
      }
      return bookList;
  };
  static getBookDataByPageNumber = async (page:number, size:number) => {
      const booksRequest: any = await getRequest(
          '',
          `/extra/bibliotheque/pagination?page=${page}&size=${size}`,
      );
      let results:any = [];
      if(booksRequest._embedded !== undefined){
          let bookList:[] = booksRequest?._embedded.livreDTOModelList;
          const totalBookItems:number = booksRequest?.page?.totalElements;
          const totalPages:number = booksRequest?.page?.totalPages;

          results = [bookList, totalBookItems, totalPages];
      }
      return results;
  };
  static orderBookListAsc = (bookList:any) => {
      let books = bookList.sort(function (a:any, b:any) {
          if(a.nom < b.nom) { return -1; }
          if(a.nom > b.nom) { return 1; }
          return 0;
      });

      return books;
  };
  static getSearchBookData = async (filterApi:any, search:string) => {
      const booksRequest: any = await getRequest('', `/extra/bibliotheque?filter=${filterApi}`);
      let booksFounded = booksRequest._embedded !== undefined
          ? booksRequest._embedded.livreDTOModelList
          : [];

      let bookList:any = [];
      if(booksFounded.length > 0){
          const filterBookList = booksFounded.filter(function (item: any) {
              const itemLowerCase: any = item.nom;
              return itemLowerCase.toLowerCase().includes(search.toLowerCase());
          });

          bookList = filterBookList;
          if(filterBookList.length > 0 && filterBookList.length > 20){
              bookList = filterBookList.slice(0, 20);
          }
      }
      return bookList;
  };
  static borrowABook = async (selectedChild: any, user:any, book: any) => {
      const dataToSend = {
          dateDemande: getTime(new Date()),
          parentId: user?.userDetails?.personDetails?.person?.id,
          livreId: book.id,
          livre: book,
          enfantId: selectedChild?.person?.id,
          //isbn: '',
          common: CONSTANT.common,
      };
      return await postRequest('', '/extra/livremprunt', dataToSend);
  };
}

export default ExchangeLibraryService;
