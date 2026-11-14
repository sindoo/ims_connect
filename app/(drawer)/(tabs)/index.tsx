// ============================================================================
// home/index.tsx — Écran d'accueil de l'app (onglet "Accueil")
//
// Affiche pour l'enfant actuellement sélectionné :
//   1. Sa "journée IMS" (sieste + observation cantine du jour)
//   2. Le menu de cantine du jour, avec navigation semaine courante / semaine
//      suivante via un calendrier hebdomadaire
//   3. Ses 3 prochains rendez-vous
//
// Toute la logique de récupération de données est isolée dans le hook
// useHomeData() plus bas ; le composant HomeScreen ne fait que l'appeler et
// afficher le résultat. Les 3 sections (IMS Day, Menu, Rendez-vous) sont
// extraites en composants React.memo séparés pour éviter de re-rendre tout
// l'écran quand une seule section change.
// ============================================================================
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import ViewThemed from "../../../components/ui/ViewThemed";
import { globalStyles } from "../../../style/Global";
import { CANTEEN_OBSERVATION_EN, CANTEEN_OBSERVATION_FR, COLORS, IMAGES, TIME_ZONE_ABIDJAN } from "../../../constants";
import { ImageBackground, Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import FlatButton from "../../../components/ui/FlatButton";
import { format, getTime, set, toDate, addDays } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import ImsDayService from "../../../services/ImsDayService";
import { checkTokenExpired } from "../../../services/GeneralService";
import { toZonedTime } from "date-fns-tz";
import EmployeeService from "../../../services/EmployeeService";
import { getEmployeesTeacher } from "../../../redux/features/employee/employeeSlice";
import Loading from "../../../components/ui/Loading";
import AppointmentService from "../../../services/AppointmentService";
import { setAllAppointmentList } from "../../../redux/features/appointment/appointmentSlice";
import { changeChild } from "../../../redux/features/child/childSlice";
import MenuYearService from "../../../services/MenuYearService";
import WeekService from "../../../services/WeekService";
import Card from "../../../components/ui/Card";
import { BASEURL_IMG } from "../../../api/appUrl";
import WeekCalendar from "../../../components/ui/WeekCalendar";
import HomeAppointment from "../../../components/tabs/home/HomeAppointment";
import { useRouter } from "expo-router";

// Formate une heure (objet Date/timestamp) en "14:30" (FR) ou "02:30 PM" (EN).
// Retourne '--:--' si l'heure n'est pas définie (ex : pas encore de sieste
// enregistrée). Sortie de la fonction du composant pour ne pas la recréer à
// chaque rendu de ImsDaySection.
const formatImsTime = (time, language) => {
    if (!time) return '--:--';
    return format(time, language === 'en' ? 'hh:mm a' : 'H:mm');
};

// Formate une plage "dateDebut -> dateFin" (timestamps) en "12 mai - 16 mai"
// (FR) ou "May 12 - May 16" (EN), pour l'affichage au-dessus du calendrier
// hebdomadaire (voir textWeekDate dans MenuSection). Retourne une chaîne
// vide tant que la plage n'est pas encore connue (avant la fin du premier
// chargement, ou si aucune semaine ne correspond côté serveur).
const formatWeekRange = (dateRange, language) => {
    if (!dateRange?.dateDebut || !dateRange?.dateFin) return '';
    const pattern = language === 'en' ? 'MMM dd' : 'dd MMM';
    const locale = language === 'en' ? enUS : fr;
    return `${format(dateRange.dateDebut, pattern, { locale })} - ${format(dateRange.dateFin, pattern, { locale })}`;
};

// Construit à l'avance le menu de cantine de chaque jour ouvré, pour chaque
// semaine passée en paramètre (typiquement : semaine courante + semaine
// suivante), à partir de données déjà chargées en mémoire — aucun appel
// réseau ici. "workDays" est déjà filtré par l'API sur les jours ouvrables
// (jamais samedi/dimanche).
//
// Résultat : un objet plat indexé par la clé "idSemaine_JOUR" (ex :
// "12_LUNDI"), et non par une date calendaire reconstruite. Ce choix évite
// tout décalage lié au fuseau horaire : "dateDebut" est un timestamp, et le
// reconstruire jour par jour avec addDays()/format() peut glisser d'un jour
// selon le fuseau de l'appareil. La correspondance jour <-> semaine se fait
// plutôt à la lecture, voir handleMenuDateChange plus bas.
const buildTwoWeeksMenuMap = (weeks, workDays, menuJourList, menuCanteenList, menuPlatCanteenList) => {
    const menuByWeekDay = {};

    weeks.forEach((weekItem) => {
        workDays.forEach((workDay) => {
            const dayKey = workDay.jour?.toUpperCase();
            if (!dayKey) return;

            menuByWeekDay[`${weekItem.id}_${dayKey}`] = MenuYearService.getMenuDayList(
                menuJourList,
                workDay,
                weekItem,
                menuCanteenList,
                menuPlatCanteenList
            ) || [];
        });
    });

    return menuByWeekDay;
};

// ----------------------------------------------------------------------------
// Hook métier de l'écran d'accueil.
//
// Regroupe tout le state et toute la logique de récupération/dérivation de
// données pour cet écran, séparément de l'affichage (composant HomeScreen
// plus bas). Prend en paramètre l'enfant sélectionné, la liste des enfants,
// le token utilisateur et le dispatch Redux.
// ----------------------------------------------------------------------------
const useHomeData = (selectedChild, children, userToken, dispatch) => {
    const { i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [menuYearLoading, setMenuYearLoading] = useState(false);
    const [imsDayInfo, setImsDayInfo] = useState(null);
    const [upcomingAppointHome, setUpcomingAppointHome] = useState([]);
    const [dayMenuDetails, setDayMenuDetails] = useState([]);
    const [date, setDate] = useState(new Date());
    const [week, setWeek] = useState('');
    // Semaine juste après "week" dans le calendrier scolaire. Peut être
    // absente (null) si l'établissement n'a pas encore publié la semaine
    // suivante. Sert uniquement à retrouver le bon menu pour cette semaine
    // (voir handleMenuDateChange) — ne conditionne jamais si on peut
    // naviguer vers elle ou non (voir weekOffset ci-dessous, qui gère ça).
    const [nextWeek, setNextWeek] = useState(null);
    // Dates brutes (dateDebut/dateFin, timestamps) de la semaine courante et
    // de la semaine suivante, prises directement dans les semaines "brutes"
    // renvoyées par l'API — jamais dans "week"/"nextWeek" (issues de
    // WeekService.formatWeekData), dont on ne maîtrise pas le contenu après
    // formatage. Sert uniquement à afficher "du ... au ..." au-dessus du
    // calendrier (voir selectedWeekDateRange plus bas et textWeekDate dans
    // MenuSection) — n'intervient jamais dans le choix du menu affiché.
    const [weekDateRange, setWeekDateRange] = useState(null);
    const [nextWeekDateRange, setNextWeekDateRange] = useState(null);
    // 0 = on affiche la semaine courante, 1 = on affiche la semaine
    // suivante. Piloté uniquement par les flèches de navigation
    // (handleWeekNavigate) : la navigation fonctionne toujours, que le menu
    // de la semaine suivante existe déjà côté serveur ou non (dans ce cas
    // le menu affiché est simplement vide, voir MenuSection).
    const [weekOffset, setWeekOffset] = useState(0);
    const [workDaysNameList, setWorkDaysNameList] = useState([]);
    const [weekData, setWeekData] = useState([]);
    const [statusMenuApp, setStatusMenuApp] = useState(false);
    // Menu de chaque jour ouvré, précalculé pour la semaine courante ET la
    // semaine suivante d'un coup, indexé par "idSemaine_JOUR" (voir
    // buildTwoWeeksMenuMap ci-dessus). Remplace un ancien découpage en
    // plusieurs states séparés qui ne servaient qu'à recalculer ce même
    // menu à chaque tap sur le calendrier ; ici on le calcule une seule
    // fois au chargement et on ne fait plus que lire dedans ensuite.
    const [twoWeeksMenuByDate, setTwoWeeksMenuByDate] = useState({});

    // Charge tout ce qui concerne le menu de cantine : plats, menu semaine
    // par semaine, jours ouvrés, statut de l'année scolaire côté menu. Ne
    // dépend PAS de l'enfant sélectionné (le menu est le même pour tout le
    // monde), donc peut tourner en parallèle de fetchChildData ci-dessous
    // au lieu d'attendre qu'elle se termine — l'écran affiche son contenu
    // plus vite.
    const fetchMenuData = useCallback(async () => {
        setMenuYearLoading(true);
        try {
            // Les 6 appels sont indépendants les uns des autres : on les
            // lance tous en même temps avec Promise.all plutôt qu'en
            // séquence, pour ne payer qu'un seul aller-retour réseau (le
            // plus lent des 6) au lieu de 6 additionnés.
            const [
                dishRequestList,
                menuCanteenRequest,
                canteenWeek,
                menuJourListRequest,
                workdays,
                status,
            ] = await Promise.all([
                MenuYearService.getPlatCanteen(),
                MenuYearService.getMenuCanteen(),
                WeekService.getAllWeekData(),
                MenuYearService.getMenuByDayList(),
                WeekService.getWorkDays(),
                MenuYearService.getStatusMenuYear(),
            ]);

            setStatusMenuApp(status?.statut);

            // Trie les semaines par date de début et les formate pour
            // l'affichage (libellés traduits, etc. — voir
            // WeekService.formatWeekData).
            const sortedWeeks = [...canteenWeek].sort((a, b) => a.dateDebut - b.dateDebut);
            const formattedWeeks = WeekService.formatWeekData(sortedWeeks, i18n);
            setWeekData(formattedWeeks);

            // Détermine la semaine courante : celle dont l'intervalle
            // [dateDebut, dateFin] contient minuit aujourd'hui. Si aucune
            // semaine ne correspond (ex : vacances hors calendrier connu),
            // on retombe sur la toute dernière semaine formatée disponible.
            const todayDate = new Date();
            const todayTimestamp = getTime(set(todayDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }));
            const currentWeekIndex = sortedWeeks.findIndex(w => todayTimestamp >= w.dateDebut && w.dateFin >= todayTimestamp);
            const currentWeekRaw = currentWeekIndex >= 0 ? sortedWeeks[currentWeekIndex] : null;
            const selectedWeek = (currentWeekRaw && formattedWeeks.find(w => w.id === currentWeekRaw.id)) || formattedWeeks[formattedWeeks.length - 1];
            setWeek(selectedWeek);

            // Semaine suivant directement la semaine courante dans le
            // calendrier scolaire trié. Vaut null si on est déjà sur la
            // dernière semaine connue (currentWeekIndex + 1 n'existe pas).
            const nextWeekRaw = currentWeekIndex >= 0 ? sortedWeeks[currentWeekIndex + 1] : undefined;
            const selectedNextWeek = nextWeekRaw ? formattedWeeks.find(w => w.id === nextWeekRaw.id) : null;
            setNextWeek(selectedNextWeek || null);

            // Dates de début/fin "brutes" des deux semaines, retrouvées par
            // id dans "sortedWeeks" (le tableau non formaté) pour être sûr
            // d'avoir des timestamps exploitables par formatWeekRange.
            const selectedWeekRaw = sortedWeeks.find(w => w.id === selectedWeek.id) || currentWeekRaw;
            setWeekDateRange(selectedWeekRaw ? { dateDebut: selectedWeekRaw.dateDebut, dateFin: selectedWeekRaw.dateFin } : null);
            setNextWeekDateRange(nextWeekRaw ? { dateDebut: nextWeekRaw.dateDebut, dateFin: nextWeekRaw.dateFin } : null);

            if (workdays.length > 0) {
                const workDayNames = workdays.map(w => w.jour.toLowerCase());
                setWorkDaysNameList(workDayNames);

                // Sélectionne le jour ouvré correspondant à aujourd'hui (ou,
                // à défaut de correspondance, le premier jour ouvré de la
                // liste) pour afficher son menu par défaut à l'ouverture.
                const dayName = format(todayDate, 'EEEE', { locale: fr }).toUpperCase();
                const selectedDay = workdays.find(w => w.jour.toUpperCase() === dayName) || workdays[0];

                const dayMenu = MenuYearService.getMenuDayList(
                    menuJourListRequest,
                    selectedDay,
                    selectedWeek,
                    menuCanteenRequest,
                    dishRequestList
                );
                setDayMenuDetails(dayMenu);
                // Remet "date" sur aujourd'hui et "weekOffset" sur la
                // semaine courante à chaque (re)chargement, pour rester
                // cohérent avec le menu du jour calculé juste au-dessus
                // (qui repart lui aussi toujours sur aujourd'hui). Sans ce
                // reset, un retour sur l'onglet ou un pull-to-refresh
                // pendant qu'on consultait la semaine suivante laisserait
                // le calendrier affiché sur cette semaine-là alors que le
                // menu, lui, serait revenu à aujourd'hui.
                setDate(todayDate);
                setWeekOffset(0);

                // Précalcule le menu de chaque jour ouvré pour la semaine
                // courante ET la semaine suivante (si elle existe), à
                // partir des données déjà récupérées ci-dessus — aucun
                // appel réseau supplémentaire ici. Ce cache est ensuite lu
                // directement par handleMenuDateChange et
                // handleWeekNavigate plus bas, pour un changement de jour/
                // semaine instantané côté UI.
                const menuByDate = buildTwoWeeksMenuMap(
                    [selectedWeek, selectedNextWeek].filter(Boolean),
                    workdays,
                    menuJourListRequest,
                    menuCanteenRequest,
                    dishRequestList
                );
                setTwoWeeksMenuByDate(menuByDate);
            }
        } catch (error) {
            console.log('[HomeScreen] Erreur menu:', error);
        } finally {
            setMenuYearLoading(false);
        }
    }, [i18n]);

    // Charge les données propres à l'enfant actuellement sélectionné :
    // l'équipe pédagogique de sa classe, ses rendez-vous, et sa dernière
    // "journée IMS" (sieste, observation cantine...). Séparé de
    // fetchMenuData pour que ce dernier (qui ne dépend pas de l'enfant)
    // puisse se charger en parallèle sans être ralenti par celui-ci.
    const fetchChildData = useCallback(async () => {
        if (!selectedChild) return;
        setLoading(true);

        try {
            const [employeesRes, allRdvListSort, allImsDayList] = await Promise.all([
                EmployeeService.getChildClassEmployees(selectedChild),
                AppointmentService.getAllAppointment(selectedChild.person.id),
                ImsDayService.getChildImsDay(selectedChild?.person?.id)
            ]);

            // Enregistre en Redux l'équipe pédagogique (employés, professeur
            // principal, liste des profs, classes) pour que d'autres écrans
            // puissent aussi s'en servir.
            if (employeesRes) {
                dispatch(getEmployeesTeacher({
                    employees: employeesRes.employees || [],
                    teacher: employeesRes.teacher || null,
                    teacherList: employeesRes.teacherList || [],
                    employeesClassList: employeesRes.employeesClassList || [],
                }));
            }

            // Enregistre tous les rendez-vous en Redux (utilisé ailleurs
            // dans l'app), et ne garde localement que les 3 prochains
            // rendez-vous actifs à afficher sur cet écran.
            if (allRdvListSort?.length > 0) {
                dispatch(setAllAppointmentList(allRdvListSort));
                const activeAppointments = AppointmentService.getChildActiveAppointmentList(allRdvListSort);
                setUpcomingAppointHome(activeAppointments?.slice(0, 3) || []);
            } else {
                setUpcomingAppointHome([]);
            }

            // Ne garde que la journée IMS la plus récente (dernier élément
            // de la liste, supposée triée par date croissante côté API) et
            // convertit les heures de sieste dans le fuseau d'Abidjan pour
            // un affichage correct quel que soit le fuseau de l'appareil.
            if (allImsDayList?.length > 0) {
                const latestIms = allImsDayList[allImsDayList.length - 1];
                setImsDayInfo({
                    ...latestIms,
                    timeDebutSieste: latestIms.timeDebutSieste ? toZonedTime(latestIms.timeDebutSieste, TIME_ZONE_ABIDJAN) : null,
                    timeFinSieste: latestIms.timeFinSieste ? toZonedTime(latestIms.timeFinSieste, TIME_ZONE_ABIDJAN) : null,
                });
            } else {
                setImsDayInfo(null);
            }

            // Si le token est expiré, déclenche la déconnexion/rafraîchissement
            // approprié via checkTokenExpired.
            if (userToken) {
                checkTokenExpired(userToken, dispatch);
            }
        }
        catch (error) {
            console.log('[HomeScreen] Erreur fetchData (Employee, appointment, journée IMS):', error);
            // Même en cas d'erreur réseau/serveur, on vérifie si la cause
            // est un token expiré, pour rediriger l'utilisateur au besoin.
            if (userToken) {
                checkTokenExpired(userToken, dispatch);
            }
        } finally {
            setLoading(false);
            setHasLoadedOnce(true);
        }
    }, [selectedChild, userToken, dispatch]);

    // Change l'enfant sélectionné (utilisé par le sélecteur d'enfant
    // ailleurs dans l'app) : retrouve l'enfant correspondant à l'id fourni
    // dans la liste "children" et met à jour Redux.
    const handleChangeChild = useCallback((childSelectedId) => {
        if (children?.length > 0 && childSelectedId) {
            const findChild = children.find((child) => child?.person?.id === childSelectedId);
            if (findChild) {
                dispatch(changeChild(findChild));
            }
        }
    }, [children, dispatch]);

    // Appelée quand l'utilisateur tape un jour dans le calendrier
    // hebdomadaire (WeekCalendar). Met à jour la date sélectionnée et va
    // chercher le menu correspondant directement dans le cache
    // "twoWeeksMenuByDate" précalculé par fetchMenuData — donc affichage
    // instantané, sans nouveau calcul ni appel réseau.
    //
    // La semaine à utiliser est déterminée par "weekOffset" (0 = semaine
    // courante, 1 = semaine suivante), et non en comparant la date tapée
    // aux bornes dateDebut/dateFin de chaque semaine : ces bornes sont
    // alignées sur minuit, alors que "date" garde l'heure du moment où
    // l'écran a été chargé (ex : 21h34) — une comparaison directe pourrait
    // donc à tort considérer qu'un jour de la semaine suivante ne
    // correspond à aucune semaine connue, et n'afficherait plus rien.
    //
    // "weekOverride" permet à handleWeekNavigate (ci-dessous) de préciser
    // explicitement la semaine ciblée au moment même où il fait basculer
    // "weekOffset" : sans ce paramètre, cette fonction utiliserait encore
    // l'ancienne valeur de "weekOffset" (une mise à jour de state React
    // n'est pas répercutée tant que le composant n'a pas re-rendu).
    const handleMenuDateChange = useCallback((dateSelect, weekOverride) => {
        setDate(dateSelect);

        const dayKey = format(dateSelect, 'EEEE', { locale: fr }).toUpperCase();
        const targetWeek = weekOverride !== undefined ? weekOverride : (weekOffset === 1 ? nextWeek : week);
        const mapKey = targetWeek ? `${targetWeek.id}_${dayKey}` : null;

        setDayMenuDetails((mapKey && twoWeeksMenuByDate[mapKey]) ?? []);
    }, [twoWeeksMenuByDate, week, nextWeek, weekOffset]);

    // Appelée par les flèches < > (voir MenuSection) pour basculer entre la
    // semaine courante (weekOffset 0) et la semaine suivante (weekOffset 1),
    // en conservant le même jour de la semaine (ex : mardi -> mardi de la
    // semaine suivante). Le déplacement du calendrier ("date" +/- 7 jours)
    // ne dépend jamais de la présence d'une entrée "semaine suivante" côté
    // serveur : la navigation doit toujours fonctionner visuellement, que
    // son menu existe déjà ou non (dans ce cas "targetWeek" vaut null et
    // MenuSection affiche le message "aucun menu"). WeekCalendar recalcule
    // lui-même les 7 jours qu'il affiche à partir de "date" (voir
    // WeekCalendar.tsx), donc changer "date" suffit à faire défiler la
    // semaine affichée à l'écran.
    const handleWeekNavigate = useCallback((direction) => {
        const targetOffset = direction === 'next' ? 1 : 0;
        if (targetOffset === weekOffset) return;

        const targetWeek = targetOffset === 1 ? nextWeek : week;
        const targetDate = addDays(date, targetOffset === 1 ? 7 : -7);

        setWeekOffset(targetOffset);
        handleMenuDateChange(targetDate, targetWeek);
    }, [weekOffset, nextWeek, week, date, handleMenuDateChange]);

    // Indicateurs dérivés pour l'UI de navigation semaine (voir
    // MenuSection) : uniquement basés sur "weekOffset", pas sur une
    // comparaison de dates. Les flèches restent donc utilisables même si la
    // semaine suivante n'a pas encore de menu publié côté serveur — seul le
    // contenu affiché change, pas la possibilité de naviguer.
    const isViewingNextWeek = weekOffset === 1;
    const canGoNextWeek = weekOffset === 0;
    const canGoPrevWeek = weekOffset === 1;

    // Plage de dates (début/fin) à afficher au-dessus du calendrier : suit
    // "weekOffset" comme le reste de la navigation semaine, donc bascule
    // automatiquement entre "weekDateRange" et "nextWeekDateRange" quand
    // l'utilisateur tape sur les flèches < > (voir handleWeekNavigate).
    const selectedWeekDateRange = isViewingNextWeek ? nextWeekDateRange : weekDateRange;

    // Point d'entrée du chargement des données de l'écran.
    //
    // useFocusEffect (React Navigation, déjà utilisé en interne par
    // expo-router) déclenche son callback au montage ET à chaque fois que
    // cet écran redevient l'onglet actif — SANS démonter le composant. Cet
    // écran n'étant pas démonté quand on quitte l'onglet "Accueil"
    // (pas de unmountOnBlur), un useEffect classique ne se relancerait
    // qu'une seule fois au tout premier montage et jamais ensuite : revenir
    // sur l'onglet réafficherait alors toujours les données du tout premier
    // chargement, potentiellement périmées.
    //
    // Grâce à useFocusEffect, revenir sur l'onglet relance fetchMenuData et
    // fetchChildData sans perte de scroll ni flash de <Loading/> plein
    // écran — seul le petit indicateur de rafraîchissement s'affiche,
    // comme lors d'un pull-to-refresh (voir "initialLoading" plus bas).
    useFocusEffect(
        useCallback(() => {
            fetchMenuData();
            fetchChildData();
        }, [fetchMenuData, fetchChildData])
    );

    // Rafraîchissement manuel déclenché par le "pull-to-refresh" de la
    // ScrollView (voir RefreshControl dans HomeScreen) : relance les deux
    // chargements en parallèle.
    const refetch = useCallback(() => {
        return Promise.all([fetchChildData(), fetchMenuData()]);
    }, [fetchChildData, fetchMenuData]);

    return {
        loading,
        // Vrai uniquement avant le tout premier chargement réussi. Sert à
        // n'afficher le <Loading /> plein écran qu'une seule fois, jamais
        // lors d'un pull-to-refresh ultérieur ni d'un retour sur l'onglet
        // (voir HomeScreen plus bas, qui s'appuie dessus).
        initialLoading: loading && !hasLoadedOnce,
        menuYearLoading,
        imsDayInfo,
        upcomingAppointHome,
        dayMenuDetails,
        date,
        workDaysNameList,
        statusMenuApp,
        isViewingNextWeek,
        canGoNextWeek,
        canGoPrevWeek,
        selectedWeekDateRange,
        handleMenuDateChange,
        handleWeekNavigate,
        handleChangeChild,
        refetch
    };
};

// ----------------------------------------------------------------------------
// Bloc "Ma journée IMS" : sieste (heure de début/fin) et, si renseignée,
// observation sur la façon dont l'enfant a mangé à la cantine. Un bouton
// "Plus de détails" renvoie vers l'écran dédié (route "imsday"). Affiche un
// message vide si aucune journée IMS n'est disponible pour l'enfant.
//
// Enveloppé dans React.memo : ne se re-rend que si "imsDayInfo" (ou i18n/
// router) change réellement, pas à chaque rendu de HomeScreen (ex : quand
// seul le menu ou les rendez-vous changent).
// ----------------------------------------------------------------------------
const ImsDaySection = React.memo(({ imsDayInfo, i18n, router }) => {
    if (!imsDayInfo) return (
        <View style={styles.emptyImsWrapper}>
            <Text style={styles.emptyMenuText}>
                {i18n.t('home.empty_menu_year')}
            </Text>
        </View>
    );

    return (
        <View style={styles.imsDayContainer}>
            <View style={styles.titleContainer}>
                <Text style={styles.imsTitleLabel}>
                    {`${i18n.t('home.my_day_ims_title')} `}
                </Text>
                <Text style={styles.todayImsDay}>
                    {format(
                        imsDayInfo.theDate,
                        i18n.language === 'en' ? 'EEEE, MMMM dd yyyy' : 'EEEE, dd MMMM yyyy',
                        { locale: i18n.language === 'en' ? enUS : fr }
                    )}
                </Text>
            </View>

            <View style={styles.imsDayItem}>
                <View style={styles.imsDayItemText}>
                    <Text style={globalStyles.titleH2}>{i18n.t('home.nap_time')}</Text>
                    {imsDayInfo.sieste ? (
                        <>
                            <Text style={globalStyles.paragraph}>
                                {i18n.t('home.start_nap_time')} : {formatImsTime(imsDayInfo.timeDebutSieste, i18n.language)}
                            </Text>
                            <Text style={globalStyles.paragraph}>
                                {i18n.t('home.end_nap_time')} : {formatImsTime(imsDayInfo.timeFinSieste, i18n.language)}
                            </Text>
                        </>
                    ) : (
                        <Text style={globalStyles.paragraph}>{i18n.t('myDayAtIms.no_nap_time')}</Text>
                    )}
                </View>
                <View style={styles.imsDayItemImage}>
                    <Image source={IMAGES.sleepNatimeImage} contentFit="cover" style={styles.dayItemImageCover} />
                </View>
            </View>

            {imsDayInfo.observationCantine && (
                <View style={styles.imsDayItem}>
                    <View style={styles.imsDayItemText}>
                        <Text style={globalStyles.titleH2}>{i18n.t('home.how_i_ate')}</Text>
                        <Text style={globalStyles.paragraph}>
                            {i18n.language === 'en'
                                ? CANTEEN_OBSERVATION_EN[imsDayInfo.observationCantine] || imsDayInfo.observationCantine
                                : CANTEEN_OBSERVATION_FR[imsDayInfo.observationCantine] || imsDayInfo.observationCantine}
                        </Text>
                    </View>
                    <View style={styles.imsDayItemImage}>
                        <Image source={IMAGES.howIateImage} contentFit="cover" style={styles.dayItemImageCover} />
                    </View>
                </View>
            )}

            <View style={styles.moreDetailsWrapper}>
                <FlatButton
                    title={i18n.t('home.more_details')}
                    fontWeight="400"
                    fontSize={16}
                    backgroundColor={COLORS.secondary}
                    paddingVertical={12}
                    borderRadius={20}
                    onPress={() => router.push('imsday')}
                    disabled={false}
                />
            </View>
        </View>
    );
});

// ----------------------------------------------------------------------------
// Bloc "Menu du jour" : flèches de navigation semaine courante <-> semaine
// suivante, calendrier hebdomadaire (WeekCalendar) pour choisir le jour, et
// détail du menu (entrée / plat / dessert) du jour sélectionné. Affiche un
// indicateur de chargement ou un message vide selon le cas.
//
// Enveloppé dans React.memo pour ne se re-rendre que si l'une de ses props
// change réellement (typiquement : changement de jour, de semaine, ou fin
// de chargement du menu).
// ----------------------------------------------------------------------------
const MenuSection = React.memo(({
                                    dayMenuDetails,
                                    menuYearLoading,
                                    statusMenuApp,
                                    date,
                                    workDaysNameList,
                                    onDateChange,
                                    i18n,
                                    isViewingNextWeek,
                                    canGoNextWeek,
                                    canGoPrevWeek,
                                    onNavigateWeek,
                                    weekDateRange
                                }) => {
    return (
        <>
            {/* Flèches de navigation entre semaine courante et semaine
                suivante. WeekCalendar ci-dessous ne gère que l'affichage des
                7 jours de la semaine de "date" ; ces flèches changent "date"
                de +/- 7 jours (via onNavigateWeek -> handleWeekNavigate)
                pour faire défiler le calendrier d'une semaine à l'autre. */}
            <View style={styles.weekNavRow}>
                <TouchableOpacity
                    onPress={() => onNavigateWeek('prev')}
                    disabled={!canGoPrevWeek}
                    style={styles.weekNavButton}
                >
                    <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color={canGoPrevWeek ? COLORS.secondary : COLORS.grayLight}
                    />
                </TouchableOpacity>
                <Text style={styles.weekNavLabel}>
                    {isViewingNextWeek ? i18n.t('home.next_week') : i18n.t('home.current_week')}
                </Text>
                <TouchableOpacity
                    onPress={() => onNavigateWeek('next')}
                    disabled={!canGoNextWeek}
                    style={styles.weekNavButton}
                >
                    <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={canGoNextWeek ? COLORS.secondary : COLORS.grayLight}
                    />
                </TouchableOpacity>
            </View>
            {/* Date de début et de fin de la semaine actuellement affichée
                (courante ou suivante selon "weekOffset"), calculée par
                formatWeekRange à partir de "weekDateRange" fourni par
                useHomeData. */}
            <View style={styles.weekStartEndDateRow}>
                <Text style={styles.textWeekDate}>{formatWeekRange(weekDateRange, i18n.language)}</Text>
            </View>
            <WeekCalendar
                date={date}
                onChange={onDateChange}
                workDayNameList={workDaysNameList}
            />
            {/* Aucun plat pour ce jour, ou année de menu désactivée côté
                admin (statusMenuApp) : affiche soit un loader (si le menu
                est encore en train de charger), soit un message "vide". */}
            {(dayMenuDetails?.length === 0 || statusMenuApp) && (
                <View style={styles.emptyMenuWrapper}>
                    {menuYearLoading ? (
                        <Loading size="small" />
                    ) : (
                        <Text style={styles.emptyMenuText}>
                            {i18n.t('home.empty_menu_year')}
                        </Text>
                    )}
                </View>
            )}
            {/* Cas normal : une carte par plat du jour (entrée/plat/dessert
                réunis dans un même "detailsMenu"), avec photo et libellés
                traduits. */}
            {dayMenuDetails?.length > 0 && !statusMenuApp && (
                dayMenuDetails.map((detailsMenu, index) => (
                    <View style={globalStyles.detailsContainer} key={detailsMenu?.itemMenuCanteenJourId || index}>
                        <Card borderRaduis={10}>
                            <View style={globalStyles.imageMenu}>
                                <Image
                                    source={
                                        detailsMenu?.photo && detailsMenu.photo !== ''
                                            ? { uri: `${BASEURL_IMG}/${detailsMenu.photo}` }
                                            : IMAGES.photoMenu
                                    }
                                    contentFit="cover"
                                    style={globalStyles.imageMenuCover}
                                />
                            </View>
                            <View style={globalStyles.infoMenuContainer}>
                                <Text style={globalStyles.titleH2}>{detailsMenu.nom || 'Menu'}</Text>
                                {['entree', 'plat', 'dessert'].map((type) => (
                                    <View key={type} style={styles.menuTypeRow}>
                                        <Text style={globalStyles.entreeDish}>
                                            {i18n.t(`home.${type === 'entree' ? 'starter_dish' : type}`)} :{' '}
                                        </Text>
                                        <Text style={[globalStyles.entreeDish, styles.entreeDishBold]}>
                                            {detailsMenu[type] || '-'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    </View>
                ))
            )}
        </>
    );
});

// ----------------------------------------------------------------------------
// Bloc "Prochains rendez-vous" : affiche jusqu'à 3 rendez-vous (déjà limités
// en amont par fetchChildData), chacun rendu via le composant partagé
// HomeAppointment. Affiche un message vide si aucun rendez-vous.
//
// Enveloppé dans React.memo pour éviter de recalculer les horaires/employés
// de chaque rendez-vous à chaque rendu de l'écran.
// ----------------------------------------------------------------------------
const AppointmentSection = React.memo(({ appointments, employeesClassList, selectedChild, selectedChildClass }) => {
    const { i18n } = useTranslation();

    if (!appointments || appointments.length === 0) {
        return (
            <View style={styles.emptyAppointmentWrapper}>
                <Text style={styles.emptyAppointmentText}>{i18n.t('appointment.empty_appointment')}</Text>
            </View>
        );
    }

    // La liste est déjà limitée à 3 éléments en amont (voir .slice(0, 3)
    // dans fetchChildData) : un simple <View> suffit pour les empiler, pas
    // besoin d'un <ScrollView> imbriqué dans le ScrollView principal de
    // l'écran (des scrolls imbriqués coûtent en fluidité pour rien ici,
    // vu le nombre d'éléments toujours petit).
    return (
        <View style={styles.appointmentContainer}>
            {appointments.map((appointment) => {
                // Par défaut : horaires et employé du rendez-vous tels que
                // stockés directement dessus.
                let dayDate = toZonedTime(toDate(appointment.dateDebut), TIME_ZONE_ABIDJAN);
                let dayDateFin = toZonedTime(toDate(appointment.dateFin), TIME_ZONE_ABIDJAN);
                let startTime = format(dayDate, 'HH:mm');
                let endTime = format(dayDateFin, 'HH:mm');
                let employeesFind = employeesClassList?.find(
                    (emp) => emp.id === appointment.creneauRdvs?.[0]?.creneauRdvEmployees?.[0]?.employeeId
                );

                // Cas particulier des rendez-vous "PRESET" (créneaux
                // prédéfinis, potentiellement partagés par plusieurs
                // enfants) : chaque enfant peut avoir son propre horaire
                // spécifique dans "creneauRdvEnfantParents". Si on trouve
                // l'enfant actuellement sélectionné dans un des créneaux, on
                // remplace les horaires par défaut par ceux propres à cet
                // enfant, et on ne présume plus d'un employé unique associé
                // (chaque créneau PRESET peut avoir le sien).
                if (appointment.meetingType === 'PRESET' && appointment.creneauRdvs?.length > 0) {
                    for (const creneau of appointment.creneauRdvs) {
                        const enfantParent = creneau.creneauRdvEnfantParents?.[0];
                        if (enfantParent?.enfantId === selectedChild?.person?.id) {
                            dayDate = toZonedTime(toDate(enfantParent.dateDebut), TIME_ZONE_ABIDJAN);
                            dayDateFin = toZonedTime(toDate(enfantParent.dateFin), TIME_ZONE_ABIDJAN);
                            startTime = format(dayDate, 'HH:mm');
                            endTime = format(dayDateFin, 'HH:mm');
                            employeesFind = undefined;
                            break;
                        }
                    }
                }

                return (
                    <View style={styles.appointItemContainer} key={appointment.id}>
                        <HomeAppointment
                            appointment={appointment}
                            employeesFind={employeesFind}
                            dayDate={dayDate}
                            startTime={startTime}
                            endTime={endTime}
                            selectedChildClass={selectedChildClass}
                        />
                    </View>
                );
            })}
        </View>
    );
});

// ----------------------------------------------------------------------------
// Composant principal de l'écran d'accueil.
//
// Récupère depuis Redux l'enfant sélectionné et la liste des enfants, la
// liste des employés de la classe, et le token utilisateur ; délègue tout
// le reste (chargement, calculs, navigation semaine) au hook useHomeData.
// Se contente d'assembler les 3 sections (IMS Day / Menu / Rendez-vous)
// dans une ScrollView avec pull-to-refresh.
// ----------------------------------------------------------------------------
const HomeScreen = () => {
    const { i18n } = useTranslation();
    const dispatch = useDispatch();
    const router = useRouter();

    const { selectedChild, children } = useSelector((state: any) => state.child);
    const { employeesClassList } = useSelector((state: any) => state.employee);
    const { userToken } = useSelector((state: any) => state.user);

    // Classe de l'enfant sélectionné, recalculée seulement quand
    // "selectedChild" change (évite de refaire cet accès imbriqué à chaque
    // rendu de l'écran).
    const selectedChildClass = useMemo(() => selectedChild?.eleves?.[0]?.classe ?? null, [selectedChild]);

    // "Ma journée à IMS" n'est affichée que si la classe de l'enfant propose
    // l'IMS Day. Seul un "false" explicite masque la section : si l'information
    // est absente, on garde l'affichage comme avant.
    const showImsDaySection = selectedChildClass?.imsday !== false;

    const {
        loading,
        initialLoading,
        menuYearLoading,
        imsDayInfo,
        upcomingAppointHome,
        dayMenuDetails,
        date,
        workDaysNameList,
        statusMenuApp,
        isViewingNextWeek,
        canGoNextWeek,
        canGoPrevWeek,
        selectedWeekDateRange,
        handleMenuDateChange,
        handleWeekNavigate,
        refetch
    } = useHomeData(selectedChild, children, userToken, dispatch);

    // Le plein écran de chargement (<Loading/>) ne s'affiche qu'au tout
    // premier chargement de l'écran (voir "initialLoading" dans
    // useHomeData). Lors d'un pull-to-refresh ou d'un retour sur l'onglet,
    // "loading" repasse à true mais "initialLoading" reste false : le
    // contenu déjà affiché reste visible, et seul le petit indicateur du
    // RefreshControl signale le rechargement en cours.
    if (initialLoading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={globalStyles.container}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refetch} />
                }
            >
                <ImageBackground
                    source={IMAGES.backgroundImageApp}
                    contentFit="cover"
                    style={styles.backgroundImage}
                >
                    {/* Section "Ma journée IMS" (masquée si la classe n'a pas l'IMS Day) */}
                    {showImsDaySection && (
                        <View style={styles.imsDay}>
                            <Text style={globalStyles.title}>{i18n.t('home.my_day_ims')}</Text>
                            <ImsDaySection imsDayInfo={imsDayInfo} i18n={i18n} router={router} />
                        </View>
                    )}

                    {/* Section "Menu du jour", avec navigation semaine */}
                    <View style={globalStyles.dayMenuContainer}>
                        <Text style={globalStyles.title}>{i18n.t('home.menu_of_day')}</Text>
                        <MenuSection
                            dayMenuDetails={dayMenuDetails}
                            menuYearLoading={menuYearLoading}
                            statusMenuApp={statusMenuApp}
                            date={date}
                            workDaysNameList={workDaysNameList}
                            onDateChange={handleMenuDateChange}
                            i18n={i18n}
                            isViewingNextWeek={isViewingNextWeek}
                            canGoNextWeek={canGoNextWeek}
                            canGoPrevWeek={canGoPrevWeek}
                            onNavigateWeek={handleWeekNavigate}
                            weekDateRange={selectedWeekDateRange}
                        />
                    </View>

                    {/* Section "Prochains rendez-vous" (max 3) */}
                    <View style={styles.appointment}>
                        <Text style={globalStyles.title}>{i18n.t('home.incomming_appoint')}</Text>
                        <AppointmentSection
                            appointments={upcomingAppointHome}
                            employeesClassList={employeesClassList}
                            selectedChild={selectedChild}
                            selectedChildClass={selectedChildClass}
                        />
                    </View>
                </ImageBackground>
            </ScrollView>
        </ViewThemed>
    );
};

export default HomeScreen;

// ----------------------------------------------------------------------------
// Styles de l'écran (StyleSheet.create pour la mise en cache native de
// react-native). Regroupés par section dans le même ordre que le JSX
// ci-dessus : conteneur général, bloc "journée IMS", navigation/menu, puis
// bloc rendez-vous.
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    backgroundImage: {
        flex: 1,
        paddingHorizontal: 10,
    },
    imsDay: {
        paddingTop: 20,
    },
    imsDayContainer: {
        borderRadius: 10,
        backgroundColor: COLORS.grayVeryLight,
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    titleContainer: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: 'wrap',
    },
    imsTitleLabel: {
        color: COLORS.gray,
        fontWeight: '600',
    },
    todayImsDay: {
        textAlign: 'center',
        color: COLORS.gray,
        marginBottom: 15,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    imsDayItem: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 10,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
    imsDayItemText: {
        flex: 3,
        minHeight: 80,
    },
    imsDayItemImage: {
        flex: 1,
        alignItems: 'center',
        overflow: 'hidden',
    },
    dayItemImageCover: {
        width: '100%',
        height: 80,
    },
    moreDetailsWrapper: {
        marginTop: 10,
        marginBottom: 10,
    },
    weekNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 0,
    },
    weekNavButton: {
        padding: 6,
    },
    weekNavLabel: {
        marginHorizontal: 12,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.gray,
        textTransform: 'none',
    },
    weekStartEndDateRow: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWeekDate: {
        color: COLORS.secondary,
        fontSize: 13,
    },
    emptyMenuWrapper: {
        marginTop: 15,
    },
    emptyImsWrapper: {
        marginTop: 0,
        marginBottom: 15,
    },
    emptyMenuText: {
        textAlign: 'center',
        color: COLORS.black,
    },
    menuTypeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    entreeDishBold: {
        fontWeight: '700',
    },
    appointment: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    appointmentContainer: {
        paddingBottom: 10,
    },
    appointItemContainer: {
        flex: 1,
        marginBottom: 8,
    },
    emptyAppointmentWrapper: {
        paddingVertical: 20,
    },
    emptyAppointmentText: {
        textAlign: 'center',
    },
});
