import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../../constants";

function DatesReservedModal({ visibility, setOpenDates, openDatesData }: any) {

  return (
      <Modal
          visible={visibility}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setOpenDates(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.header}>
              <Text style={styles.title}>Dates réservées</Text>
              <TouchableOpacity onPress={() => setOpenDates(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.count}>Nombre de dates: {openDatesData?.length || 0}</Text>

            {openDatesData && openDatesData.length > 0 ? (
                <View style={styles.datesContainer}>
                  {openDatesData.map((date: any, index: number) => (
                      <View key={index} style={styles.dateItem}>
                        <Text style={styles.dateText}>
                          {new Date(date.dateDebut).toLocaleString()}
                        </Text>
                      </View>
                  ))}
                </View>
            ) : (
                <Text style={styles.emptyText}>Aucune date réservée</Text>
            )}

            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setOpenDates(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  count: {
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 10,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dateItem: {
    backgroundColor: '#E8F4FD',
    padding: 8,
    margin: 4,
    borderRadius: 6,
  },
  dateText: {
    color: COLORS.gray,
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    padding: 20,
  },
  closeButton: {
    backgroundColor: COLORS.redIms,
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DatesReservedModal;
