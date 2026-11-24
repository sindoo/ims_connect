import {getRequest, postRequest} from "../api/ApiManager";
import {getTime} from "date-fns";
import {CONSTANT} from "../constants";
import {array} from "yup";

class ExchangeLibraryService {
    static formatBorrowBooksList = async (resultList: array) => {
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
  static getChildBorrowBooksList = async (selectedChildId: number) => {
      const booksBorrowRequest: any = await getRequest(
          '',
          `/extra/livremprunt/encours/enfant/${selectedChildId}`,
      );

      const resultList = booksBorrowRequest !== undefined
          ? booksBorrowRequest
          : [];
      return await ExchangeLibraryService.formatBorrowBooksList(resultList);

      /*let bookList = [];
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
      return bookList;*/
  };
  static getChildBorrowHistoryBooksList = async (selectedChildId: number) => {
      const booksBorrowRequest: any = await getRequest(
          '',
          `/extra/livremprunt/historic/enfant/${selectedChildId}`,
      );

      const resultList = booksBorrowRequest !== undefined
          ? booksBorrowRequest
          : [];
      return await ExchangeLibraryService.formatBorrowBooksList(resultList);
  }
  static keepBooksInGoodState = (bookList: any[]) =>
      (Array.isArray(bookList) ? bookList : []).filter((book: any) => book?.common?.etat === 'OK');
  static getBookDataByPageNumber = async (page:number, size:number) => {
      const booksRequest: any = await getRequest(
          '',
          `/extra/bibliotheque/pagination?page=${page}&size=${size}`,
      );
      let results:any = [];
      if(booksRequest._embedded !== undefined){
          const rawBookList:any[] = Array.isArray(booksRequest?._embedded.livreDTOModelList)
              ? booksRequest?._embedded.livreDTOModelList
              : [];
          // Seuls les livres en bon état (common.etat = 'OK') sont proposés
          const bookList:any[] = ExchangeLibraryService.keepBooksInGoodState(rawBookList);
          const totalBookItems:number = booksRequest?.page?.totalElements;
          const totalPages:number = booksRequest?.page?.totalPages;

          results = [bookList, totalBookItems, totalPages, rawBookList.length];
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
      const booksRequest: any = await postRequest('', '/extra/bibliotheque/search', filterApi);

      let booksFounded = booksRequest?.content !== undefined
          ? ExchangeLibraryService.keepBooksInGoodState(booksRequest?.content)
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
  static getCategoryBookById = async (categoryId: number | undefined) => {
      return await getRequest(
            '',
            `/corebase/categorielivre/${categoryId}`,
        );
  }
}

export default ExchangeLibraryService;
