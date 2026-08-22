import {getRequest} from "../api/ApiManager";
import {getTime} from "date-fns";

class PaymentService {
  static getTuitionYears = async () => {
    const tuitionYearReq = await getRequest('', '/corebase/mix/general/scolariteannees=-1');
    const tuitionYearData = Array.isArray(tuitionYearReq?.scolariteannees) ? tuitionYearReq?.scolariteannees : [];
    let tuitionYearArray = [];
    if(tuitionYearData.length > 0) {
      tuitionYearArray = tuitionYearData.map((tuition:any) => {
        return {
          ...tuition,
          value: tuition.id,
          label: tuition.nom,
        }
      })
    }
    return tuitionYearArray;
  };
  static getCurrentTuitionYear = (data: any) => {
    let currentTuitionYear = null;
    if(data.length > 0) {
      currentTuitionYear = data.find((tuitionYear: any) => tuitionYear.migrateNextYear === false);
      if(currentTuitionYear !== undefined) {
        return currentTuitionYear;
      }
    }
    return currentTuitionYear;
  };
  static getTuitionFeesType = async () => {
    const tuitionFeesReq = await getRequest('', '/extra/scolaritelistfrais');
    return Array.isArray(tuitionFeesReq._embedded?.scolariteTypeDTOModelList) ? tuitionFeesReq._embedded?.scolariteTypeDTOModelList : [];
  };
  static getTuitionFeesTypeIdByTag = (tuitionFeesData: any) => {
    return tuitionFeesData.find(
        (tuitionFees: any) => tuitionFees.common.tag === 'schooling',
    );
  };
  static getChildTuitionFees = async (childId: number, groupId: number, scolariteAnneeId: number) => {
    const today = getTime(new Date());
    return await getRequest(
        '',
        `/extra/scolaritenfant/etatoutfrais/laDate/${today}/enfant/${childId}/groupId/${groupId}/${scolariteAnneeId}`,
    );
  };
  static getTuitionDataGroupYear = async (childId: number, tuitionYearId: number) => {
    return await getRequest('', `/extra/groupsenfants/enfant/${childId}/${tuitionYearId}`);
  };
  static reformatTuitionFees = (tuitionFeesTypeList: any, tuitionFeesIdList: any) => {
    const schoolingFeesDataList: any = [];
    let feesData = {value: 0, label: ''};
    const tuitionFeesTypeId = tuitionFeesIdList?.scolariteTypeIds;
    if (tuitionFeesTypeId.length > 0) {
      if (tuitionFeesTypeList.length > 0) {
        for (let i = 0; i < tuitionFeesTypeId.length; i++) {
          const tuitionFeesTypeIdList = tuitionFeesTypeList.find(
              (schoolingFeesTypeListFind: any) =>
                  schoolingFeesTypeListFind.id === tuitionFeesTypeId[i],
          );
          if (tuitionFeesTypeIdList !== undefined) {
            feesData = {
              value: tuitionFeesTypeIdList.id,
              label: tuitionFeesTypeIdList.nom,
              ...tuitionFeesTypeIdList,
            };
            schoolingFeesDataList.push(feesData);
          }
        }
      }
    }
    return schoolingFeesDataList;
  };
  static getAllChildPayment = async (childId: number, groupId: number, tuitionYearId: number, date: number) => {
    const paymentListReq = await getRequest(
        '',
        `/extra/scolaritenfant/enfant/${childId}/group/${groupId}/laDate/${date}/${tuitionYearId}`,
    );
    const paymentList = paymentListReq._embedded !== undefined
        ? paymentListReq._embedded.scolariteVersementDTOModelList
        : [];

    let paymentListFormatted = [];
    if(paymentList.length > 0) {
      for (var i = 0; i < paymentList.length; i++) {
        const payment = paymentList[i];
        const paymentRes = await PaymentService.getTuitionFeesTypeId(payment?.scolariteGroupId);
        const paymentFormat = {
          ...payment,
          scolariteTypeId: paymentRes?.scolariteTypeId,
        }
        paymentListFormatted.push(paymentFormat);
      }
    }
    return paymentListFormatted;
  };
  static getTuitionFeesTypeId = async (scolariteGroupId: number) => {
    return await getRequest('', `/extra/scolaritedesfrais/${scolariteGroupId}`);
  };
  static reformatChildPaymentList = (data: any, schoolingFeesData: any) => {
    let paymentList:any  = [];
    if(data.length > 0) {
      paymentList = data.map((payment: any) => {
        const findType = schoolingFeesData.find(
            (schoolingType: any) => schoolingType.id === payment?.scolariteTypeId,
        );
        return {
          ...payment,
          nom:
              payment.nom !== null && payment.nom !== ''
                  ? payment.nom
                  : 'Paiement ' + findType.label,
          paymentTypeNom: findType.label,
        };
      });

      paymentList = paymentList.sort(function (a: any, b: any) {
        return a.ladate - b.ladate;
      });
      return paymentList.reverse();
    }

    return paymentList;
  };
  static getTuitionFeesAmountByTuitionTypeId = async (childId: number, groupId: number, tuitionTypeId: number, tuitionYearId: number) => {
    const today = getTime(new Date());
    return await getRequest(
        '',
        `/extra/scolaritenfant/etatparfrais/laDate/${today}/enfant/${childId}/group/${groupId}/scolaritetype/${tuitionTypeId}/${tuitionYearId}`,
    );
  };
  static getAllChildProforma = async (childId: number, groupId: number, tuitionYearId: number) => {
    const proformaListReq = await getRequest(
        '',
        `/extra/scolariteproforma/enfant/${childId}/group/${groupId}/${tuitionYearId}`,
    );
    return proformaListReq._embedded !== undefined
        ? proformaListReq._embedded.scolariteProformaEnfantDTOModelList
        : [];
  };
  static getDeadlineByChild  = async (childId: number, groupId: number, tuitionYearId: number, tuitionFeesTypeId: number) => {
    const echeancierReq = await getRequest(
        '',
        `/extra/scolaritecheancierbyenfant/scolaritetype/${tuitionFeesTypeId}/group/${groupId}/enfant/${childId}/${tuitionYearId}`,
    );
    return echeancierReq._embedded !== undefined
        ? echeancierReq._embedded.scolariteEcheancierEnfantDTOModelList
        : [];
  };
  static getSumOfAllDeadlineByChild = (deadlineList: any) => {
    let amountDeadline: number = 0;
    if (deadlineList.length > 0) {
      for (let i = 0; i < deadlineList.length; i++) {
        amountDeadline += deadlineList[i]?.montant;
      }
    }
    return amountDeadline;
  };
}

export default PaymentService;
