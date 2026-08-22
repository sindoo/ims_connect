import {getRequest} from "../api/ApiManager";

class MenuYearService {
  static getPlatCanteen = async () => {
    const dishListRequest: any = await getRequest('', '/extra/platcantine');
    return dishListRequest._embedded !== undefined ? dishListRequest._embedded.platCantineDTOModelList : [];
  };
  static getMenuCanteen = async () => {
    const menuListRequest: any = await getRequest('', '/extra/menucantine');
   return menuListRequest._embedded !== undefined
            ? menuListRequest._embedded.menuCantineDTOModelList
            : [];
  };
  static getMenuByDayList = async () => {
    const dataMenuJourRequest: any = await getRequest('', '/extra/menujour');
    return dataMenuJourRequest._embedded !== undefined
            ? dataMenuJourRequest._embedded.menuJourDTOModelList
            : [];
  };
  static getStatusMenuYear = async () => {
    return await getRequest('', '/extra/menujour/menuyearstatut');
  };
  static getMenuJour = async (menuJourId: number) => {
    return await getRequest('', `/extra/menujour/${menuJourId}`);
  };
  static getMenuDayList = (menuJourListPar: any, selectedDay: any, selectedWeek: any, menuListPar: any, menuPLatCanteenPar: any) => {
    const dayListMenuTab: any = [];
    let dayListMenu: any = {};
    const menuJourList = menuJourListPar !== undefined ? menuJourListPar : [];
    for (let i = 0; i < menuJourList.length; i++) {
      const dayMenu = menuJourList[i];
      if (dayMenu.jour === selectedDay.jour.toUpperCase() && dayMenu.semaineId === selectedWeek?.id) {
        const menuCantineJours = dayMenu.menuCantineJours;
        const menuList = menuListPar !== undefined ? menuListPar : [];
        const menuPLatCanteen =
            menuPLatCanteenPar !== undefined ? menuPLatCanteenPar : [];

        if (menuCantineJours.length > 0) {
          for (let j = 0; j < menuCantineJours.length; j++) {
            const menuCantine = menuList.filter(
                (menu: any) => menu?.id === menuCantineJours[j]?.menuCantineId,
            );
            if (menuCantine.length > 0) {
              for (let k = 0; k < menuCantine.length; k++) {
                dayListMenu = {
                  nom: menuCantine[k]?.nom,
                  photo: menuCantine[k]?.photo,
                  //photo: menuCantine[k].photo !== '' ? `${BASEURL_IMG}/${menuCantine[k].photo}` : IMGS.photoMenu,
                };

                const platCantines =
                    menuCantine[k].menuPlatCantines !== undefined
                        ? menuCantine[k]?.menuPlatCantines
                        : [];
                if (platCantines.length > 0) {
                  let menuPlat = {};
                  for (let i = 0; i < platCantines.length; i++) {
                    for (let j = 0; j < menuPLatCanteen.length; j++) {
                      if (
                          menuPLatCanteen[j]?.id ===
                          platCantines[i]?.platCantineId &&
                          menuPLatCanteen[j]?.typePlat === 'ENTREE'
                      ) {
                        menuPlat = {
                          ...menuPlat,
                          entree: menuPLatCanteen[j]?.nom,
                        };
                      } else if (
                          menuPLatCanteen[j]?.id ===
                          platCantines[i]?.platCantineId &&
                          menuPLatCanteen[j]?.typePlat === 'PLAT'
                      ) {
                        menuPlat = {
                          ...menuPlat,
                          plat: menuPLatCanteen[j]?.nom,
                        };
                      } else if (
                          menuPLatCanteen[j]?.id ===
                          platCantines[i]?.platCantineId &&
                          menuPLatCanteen[j]?.typePlat === 'DESSERT'
                      ) {
                        menuPlat = {
                          ...menuPlat,
                          dessert: menuPLatCanteen[j]?.nom,
                        };
                      }
                    }
                  }

                  dayListMenu = {
                    ...dayListMenu,
                    ...menuPlat,
                    itemMenuCanteenJourId: menuCantineJours[j]?.id,
                    menuCanteenJourId: dayMenu?.id,
                  };
                  dayListMenuTab.push(dayListMenu);
                }
              }
            }
          }
        }
      }
    }

    return dayListMenuTab;
  };
  static getMenuDayListWithoutWeek = (selectedDayMenu: any, menuListPar: any, menuPLatCanteenPar: any) => {
    let dayListMenuTab: any = [];
    let dayListMenu: any = {};

    if(selectedDayMenu?.menuCantineJours.length > 0){
      const menuCantineJours = selectedDayMenu.menuCantineJours;
      const menuList = menuListPar !== undefined ? menuListPar : [];
      const menuPLatCanteen = menuPLatCanteenPar !== undefined ? menuPLatCanteenPar : [];

      if (menuCantineJours.length > 0) {
        for (let j = 0; j < menuCantineJours.length; j++) {
          const menuCantine = menuList.filter(
              (menu: any) => menu?.id === menuCantineJours[j]?.menuCantineId,
          );

          if (menuCantine.length > 0) {
            for (let k = 0; k < menuCantine.length; k++) {
              dayListMenu = {
                nom: menuCantine[k]?.nom,
                photo: menuCantine[k]?.photo,
              };

              const platCantines =
                  menuCantine[k].menuPlatCantines !== undefined
                      ? menuCantine[k]?.menuPlatCantines
                      : [];
              if (platCantines.length > 0) {
                let menuPlat = {};
                for (let i = 0; i < platCantines.length; i++) {
                  for (let j = 0; j < menuPLatCanteen.length; j++) {
                    if (
                        menuPLatCanteen[j]?.id ===
                        platCantines[i]?.platCantineId &&
                        menuPLatCanteen[j]?.typePlat === 'ENTREE'
                    ) {
                      menuPlat = {
                        ...menuPlat,
                        entree: menuPLatCanteen[j]?.nom,
                      };
                    } else if (
                        menuPLatCanteen[j]?.id ===
                        platCantines[i]?.platCantineId &&
                        menuPLatCanteen[j]?.typePlat === 'PLAT'
                    ) {
                      menuPlat = {
                        ...menuPlat,
                        plat: menuPLatCanteen[j]?.nom,
                      };
                    } else if (
                        menuPLatCanteen[j]?.id ===
                        platCantines[i]?.platCantineId &&
                        menuPLatCanteen[j]?.typePlat === 'DESSERT'
                    ) {
                      menuPlat = {
                        ...menuPlat,
                        dessert: menuPLatCanteen[j]?.nom,
                      };
                    }
                  }
                }

                dayListMenu = {
                  ...dayListMenu,
                  ...menuPlat,
                  itemMenuCanteenJourId: menuCantineJours[j]?.id,
                  menuCanteenJourId: selectedDayMenu?.id,
                };
                dayListMenuTab.push(dayListMenu);
              }
            }
          }
        }
      }
    }

    return dayListMenuTab;
  };
}

export default MenuYearService;
