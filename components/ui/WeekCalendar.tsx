import {addDays, format, getDate, isSameDay, startOfWeek} from 'date-fns';
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {fr, enUS} from 'date-fns/locale';
import {COLORS} from '../../constants';
import {useTranslation} from 'react-i18next';

type Props = {
  date: Date;
  onChange: (value: Date) => void;
  workDayNameList: any;
};

// get week days
const getWeekDays = (date: Date, locale: any): WeekDay[] => {
  const start = startOfWeek(date, {weekStartsOn: 1});
  const final = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    final.push({
      formatted: format(date, 'EEE', {locale: locale}),
      date,
      day: getDate(date),
    });
  }

  return final;
};

const WeekCalendar: React.FC<Props> = ({date, onChange, workDayNameList}) => {
  const [week, setWeek] = useState<WeekDay[]>([]);
  const {i18n} = useTranslation();
  const locale = i18n.language == 'en' ? enUS : fr;

  useEffect(() => {
    const weekDays = getWeekDays(date, locale);
    setWeek(weekDays);
  }, [date]);

  return (
    <View style={styles.container}>
      {week.map(weekDay => {
        const textStyles = [styles.label];
        const touchable = [styles.touchable];
        const unSelectedDay = [styles.unSelectedDay];
        const weekDayItem = [styles.weekDayItem];
        const weekDayText = [styles.weekDayText];

        const sameDay = isSameDay(weekDay.date, date);
        const weekendDay = format(date, 'EEE', {locale: fr});
        const weekendDayTab = ['dim.', 'sam.'];

        if (!weekendDayTab.includes(weekendDay)) {
          if (sameDay) {
            textStyles.push(styles.selectedLabel);
            touchable.push(styles.selectedTouchable);
            weekDayItem.push(styles.selectedDayBox);
            weekDayText.push(styles.dayTextSelected);
          }
        }

        //const today = new Date();
        const daySelect = format(weekDay.date, 'EEEE', {locale: fr});
        const daySelectStatus = workDayNameList.includes(
          daySelect.toLowerCase(),
        );

        return (
          <View style={weekDayItem} key={weekDay.formatted}>
            <Text style={weekDayText}>{weekDay.formatted}</Text>
            <TouchableOpacity
              onPress={() => onChange(weekDay.date)}
              style={touchable}
              //disabled={today <= weekDay.date && !daySelectStatus}
              disabled={!daySelectStatus}>
              <Text style={!daySelectStatus ? unSelectedDay : textStyles}>
                {weekDay.day}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 5,
  },
  weekDayText: {
    color: 'gray',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  label: {
    fontSize: 14,
    color: COLORS.black,
    textAlign: 'center',
  },
  selectedLabel: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  touchable: {
    borderRadius: 20,
    padding: 7.5,
    height: 35,
    width: 35,
  },
  selectedTouchable: {
    backgroundColor: COLORS.white,
  },
  weekDayItem: {
    alignItems: 'center',
  },
  unSelectedDay: {
    color: COLORS.grayLight,
    textAlign: 'center',
  },
  selectedDayBox: {
    marginTop: -8,
    backgroundColor: COLORS.redIms,
    textAlign: 'center',
    padding: 7,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 25,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },
});

type WeekDay = {
  formatted: string;
  date: Date;
  day: number;
};

export default WeekCalendar;
