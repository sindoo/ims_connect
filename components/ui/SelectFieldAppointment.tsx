import React, {useCallback, useMemo, useState} from 'react';
import {Modal, Pressable, SectionList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {COLORS} from "../../constants";
import {MaterialIcons} from "@expo/vector-icons";

/**
 * Liste déroulante des horaires disponibles, regroupés par jour :
 * un en-tête de date, puis les créneaux de ce jour en dessous.
 * `data` est attendu trié par date (c'est le cas dans l'écran des rdv prédéfinis).
 */
export default function SelectFieldAppointment(props: any) {
  const {data, placeholder, onSelect, disabled = true} = props;
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const sections = useMemo(() => {
    const result: {title: string; data: any[]}[] = [];
    (Array.isArray(data) ? data : []).forEach((item: any) => {
      const last = result[result.length - 1];
      if (last && last.title === item.dateAppointmentSlot) {
        last.data.push(item);
      } else {
        result.push({title: item.dateAppointmentSlot, data: [item]});
      }
    });
    return result;
  }, [data]);

  const handleSelect = useCallback((item: any) => {
    setSelectedItem(item);
    setOpen(false);
    const index = (Array.isArray(data) ? data : []).indexOf(item);
    onSelect(item, index);
  }, [data, onSelect]);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={styles.dropdown3BtnStyle}>
        <View style={styles.dropdown3BtnChildStyle}>
          <Text style={styles.dropdown3BtnTxt}>
            {selectedItem
              ? selectedItem.dateAppointmentSlot +
                ' (' +
                selectedItem.startTimeSlot +
                ' - ' +
                selectedItem.endTimeSlot +
                ')'
              : placeholder}
          </Text>
          <MaterialIcons name="expand-more" color={COLORS.gray} size={22} />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Pressable interne : un appui dans la liste ne ferme pas la fenêtre */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <SectionList
              sections={sections}
              keyExtractor={(item: any, index: number) => String(item?.id ?? index)}
              stickySectionHeadersEnabled
              renderSectionHeader={({section}) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderTxt}>{section.title}</Text>
                </View>
              )}
              renderItem={({item}: {item: any}) => {
                const isSelected = selectedItem?.id !== undefined && selectedItem?.id === item?.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.6}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => handleSelect(item)}>
                    <Text style={[styles.rowTxt, isSelected && styles.rowTxtSelected]}>
                      {item.startTimeSlot} - {item.endTimeSlot}
                    </Text>
                    {isSelected && <MaterialIcons name="check" color={COLORS.secondary} size={20} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdown3BtnStyle: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: COLORS.grayMedium,
    justifyContent: 'center',
  },
  dropdown3BtnChildStyle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dropdown3BtnTxt: {
    flex: 1,
    color: COLORS.gray,
    textAlign: 'left',
    marginHorizontal: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sectionHeaderTxt: {
    color: COLORS.secondaryDark,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayVeryLight,
  },
  rowSelected: {
    backgroundColor: COLORS.secondaryVeryLight,
  },
  rowTxt: {
    color: COLORS.gray,
    fontSize: 16,
  },
  rowTxtSelected: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
