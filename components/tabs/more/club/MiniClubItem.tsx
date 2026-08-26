import React, {useEffect, useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {TMiniClubItemProps} from "../../../../lib/type/TMiniClubProps";
import {format, getTime} from "date-fns";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import MiniClubService from "../../../../services/MiniClubService";
import Card from "../../../ui/Card";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS} from "../../../../constants";
import {setMiniClubDetailsInRedux} from "../../../../redux/features/club/miniClubSlice";
import {useRouter} from "expo-router";

export default function MiniClubItem({data}: TMiniClubItemProps) {
  const amount = new Intl.NumberFormat('fr-FR').format(data.prix);
  const dateDebut = format(data.dateDebut, 'dd/MM/yyyy HH:mm');
  const dateFin = format(data.dateFin, 'dd/MM/yyyy HH:mm');
  const {t} = useTranslation();
  const [registeredStatus, setRegisteredStatus] = useState(false);
  const initDate = new Date();
  const today = getTime(initDate);
  let twoDayBeforeToday = initDate;
  twoDayBeforeToday.setDate(twoDayBeforeToday.getDate() + 2);
  const unsubscribeDate = getTime(twoDayBeforeToday);
  const {selectedChild} = useSelector((state: any) => state.child);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchData = () => {
      if(selectedChild !== null) {
        const status = MiniClubService.checkRegistration(selectedChild.person.id, data);
        setRegisteredStatus(status);
      }
    };
    fetchData();
  }, [data]);
  return (
    <Card borderRaduis={6} marginBottom={15}>
      <Pressable
        onPress={() => {
          dispatch(setMiniClubDetailsInRedux(data));
          router.push({
            pathname: '/pages/more/club',
            params: {
              registrationStatus: registeredStatus ? '1' : '0',
            }
          });

          /*navigation.navigate(ROUTES.MINI_CLUB_DETAILS, {
            data: data,
            registrationStatus: registeredStatus,
          })*/
        }}>
        <View style={styles.itemContent}>
          {data.uriPublicite !== '' && data.uriPublicite !== null && (
            <View style={styles.imageContainer}>
              <Image
                source={{uri: `${BASEURL_IMG}/${data?.uriPublicite}`}}
                resizeMode="cover"
                style={styles.imageCover}
              />
            </View>
          )}
          <View style={styles.leftContainer}>
            <Text style={styles.miniClubTitle}>{data.title}</Text>
            <Text style={styles.price}>{amount} CFA</Text>
            <Text style={styles.price}>
              {data.inscritMiniClubs.length}/{data.placeLimit}
            </Text>
          </View>
          <View style={styles.rightContainer}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'flex-end',
              } as StyleSheet}>
                {registeredStatus ? (
                    <>
                      {unsubscribeDate <= data.dateDebut ? (
                          <View style={styles.unsubscribe}>
                            <Text style={{color: COLORS.white}}>{t('more.unsubscribe')}</Text>
                          </View>
                      ) : (
                          <View style={styles.unsubscribeAvoid}>
                            <Text style={{color: COLORS.grayLight}}>{t('more.unsubscribe')}</Text>
                          </View>
                      )}
                    </>
                ) :  (
                    <>
                      {today <= data.dateFin && (
                          <View style={styles.registered}>
                            <Text style={{color: COLORS.white}}>{t('more.registered')}</Text>
                          </View>
                      )}
                    </>
                )}
            </View>

            <Text style={{fontSize: 13, textAlign: 'right'} as StyleSheet}>{dateDebut}</Text>
            <Text style={{fontSize: 13, textAlign: 'right'} as StyleSheet}>{dateFin}</Text>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  itemContent: {
    flexDirection: 'row',
    padding: 10,
  },
  imageContainer: {
    flex: 1,
    marginRight: 20,
  },
  imageCover: {
    width: 60,
    aspectRatio: 90 / 76,
  },
  leftContainer: {
    flex: 3,
    //justifyContent: 'center',
  },
  rightContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  miniClubTitle: {
    fontWeight: '600',
    color: COLORS.secondary,
  },
  price: {
    color: COLORS.gray,
  },
  registered: {
    flexDirection: 'row',
    fontSize: 12,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingTop:2,
    height: 21,
    backgroundColor: COLORS.secondary,
  },
  unsubscribe: {
    flexDirection: 'row',
    fontSize: 12,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingTop:2,
    height: 21,
    backgroundColor: COLORS.redIms,
  },
  unsubscribeAvoid: {
    flexDirection: 'row',
    fontSize: 12,
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop:2,
    height: 21,
    backgroundColor: COLORS.grayMedium,
  },
});
