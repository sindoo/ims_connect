import {getRequest} from "../api/ApiManager";
import {enUS, fr} from "date-fns/locale";
import {format} from "date-fns";

class WeekService {
  static getAllWeekData = async () => {
    const weekListRequest: any = await getRequest('', '/corebase/semaines');
    return weekListRequest._embedded !== undefined
        ? weekListRequest._embedded?.semaineDTOModelList
        : [];
  };
  static formatWeekData = (weekData: any, i18n: any) => {
    return weekData.map((week: any) => {
      const locale = i18n.language == 'en' ? enUS : fr;
      let weekData: any = {};
      weekData.id = week.id;
      weekData.periodId = week.periodeId;
      weekData.nom = week.nom;
      weekData.startPeriod = format(week.dateDebut, 'P', {locale: locale});
      weekData.endPeriod = format(week.dateFin, 'P', {locale: locale});
      weekData = {...week, ...weekData, ...{common: week.common}};
      return weekData;
    });
  };
  static getWorkDays = async () => {
    const daysListRequest: any = await getRequest('', '/corebase/workdays');
    const workDaysListRequest: any =
        daysListRequest._embedded !== undefined
            ? daysListRequest._embedded?.jourTravailDTOModelList
            : [];
    return workDaysListRequest.filter(
        (workDay: any) => workDay.ouvrable,
    );
  };
}

export default WeekService;
