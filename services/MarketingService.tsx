import {getRequest, postRequest} from "../api/ApiManager";
import {getTime} from "date-fns";
import {CONSTANT} from "../constants";

class MarketingService {
  static getAllProduct = async () => {
    const productReq = await getRequest('', '/extra/commerceproduit');
    return productReq._embedded !== undefined
        ? productReq._embedded.produitDTOModelList
        : [];
  };
  static getUserProduct = async (selectedChildId: number) => {
    const productReq = await getRequest('', '/extra/commercevente');
    const productList =
        productReq._embedded !== undefined
            ? productReq._embedded.produitVenteDTOModelList
            : [];
    return productList.filter((product: any) => product.enfantId === selectedChildId);
  };
  static registerOrder = async (selectedChildId: number, parentId: number, data: any) => {
    const dataToSend = {
      //id: null,
      parentId: parentId,
      enfantId: selectedChildId,
      dateVente: getTime(new Date()),
      quantite: data.quantite,
      produitId: data.produitId,
      produit: data.product,
      livrer: false,
      common: CONSTANT.common,
    };

    return await postRequest('', '/extra/commercevente/achat', dataToSend);
  };
}
export default MarketingService;
