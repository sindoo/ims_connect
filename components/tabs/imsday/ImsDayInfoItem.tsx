import {useTranslation} from 'react-i18next';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  CANTEEN_OBSERVATION_EN,
  CANTEEN_OBSERVATION_FR,
  CHILD_STUFF_EN,
  CHILD_STUFF_FR,
  COLORS,
  IMAGES, TIME_ZONE_ABIDJAN,
} from '../../../constants';
import {globalStyles} from '../../../style/Global';
import {format, set} from 'date-fns';
import {enUS, fr} from 'date-fns/locale';
import Card from '../../ui/Card';
import {BASEURL_IMG} from '../../../api/appUrl';
import FlatButton from '../../ui/FlatButton';
import React, {useEffect, useState} from 'react';
import ParentCommentForm from './ParentCommentForm';
import Loading from "../../ui/Loading";
import {toZonedTime} from "date-fns-tz";
import {MaterialIcons} from "@expo/vector-icons";

function ImsDayInfoItem(props: any) {
  const {
    styles,
    handleBack,
    handleForward,
    index,
    imsDayMenuData,
    imsDayInfo,
    parentCommentStatus,
    saveParentObservation,
    setParentCommentStatus,
    size,
    commentParent,
    setCommentParent,
    handleTextChange,
    menuYearLoading,
    setMenuYearLoading
  } = props;
  const {t, i18n} = useTranslation();
  const todayDate = set(new Date(), {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const selectImsDay = set(imsDayInfo?.theDate, {
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const [imsDayParentModalStatus, setImsDayParentModalStatus] = useState(false);

  useEffect(() => {
    setCommentParent(imsDayInfo?.commentaireParent);
    setParentCommentStatus(false);
    if (
      imsDayInfo?.commentaireParent !== null &&
      imsDayInfo?.commentaireParent !== ''
    ) {
      setParentCommentStatus(true);
    }

  }, [imsDayInfo?.commentaireParent]);

  return (
    <View>
      <View style={styles.imsDayHeader}>
        <View style={styles.previousButton}>
          <TouchableOpacity
            style={{paddingLeft: 0, paddingTop: 0, padding: 10}}
            onPress={() => handleBack(index)}
            disabled={index === 0}>
            <MaterialIcons
              name="arrow-back-ios"
              size={16}
              color={index === 0 ? COLORS.grayLight : COLORS.gray}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.imsDayHeaderTitle}>
          <Text style={{...globalStyles.title, textTransform: 'capitalize'} as StyleSheet}>
            {todayDate === selectImsDay
              ? t('myDayAtIms.today')
              : format(
                    toZonedTime(imsDayInfo?.theDate, TIME_ZONE_ABIDJAN),
                  i18n.language === 'en'
                    ? 'EEE MMM dd yyyy'
                    : 'EEE dd MMM yyyy',
                  {locale: i18n.language === 'en' ? enUS : fr},
                )}
          </Text>
        </View>
        <View style={styles.nextButton}>
          <TouchableOpacity
            style={{paddingRight: 0, paddingTop: 0, padding: 10}}
            onPress={() => handleForward(index)}
            disabled={size === index}>
            <MaterialIcons
              name="arrow-forward-ios"
              size={16}
              color={size === index ? COLORS.grayLight : COLORS.gray}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* WHAT I NEED FOR TOMORROW */}
      {imsDayInfo?.imsDayChildStuffs?.length > 0 && (
        <View style={styles.imsDayWhatIneed}>
          <View style={styles.imsDayItemText}>
            <Text style={globalStyles.titleH2}>
              {t('myDayAtIms.what_I_need')}
            </Text>
            <>
              {imsDayInfo?.imsDayChildStuffs.map(
                (childStuff: any, index: number) => {
                  return (
                    <Text style={globalStyles.paragraph} key={index}>
                      {i18n.language === 'en'
                        ? CHILD_STUFF_EN[childStuff?.common?.tag]
                        : CHILD_STUFF_FR[childStuff?.common?.tag]}
                      {childStuff?.quantite > 0 && ` : ${childStuff?.quantite}`}
                    </Text>
                  );
                },
              )}
            </>
          </View>
        </View>
      )}

      {/* MENU DAY TITLE */}
      {menuYearLoading ? (
          <>
            <Loading size='small' />
          </>
      ) : (
          <>
            {imsDayMenuData !== null && (
                <Text style={globalStyles.periodMenu}>
                  {t('myDayAtIms.menu_of_day')}
                </Text>
            )}

            {imsDayMenuData !== null && (
                <View style={globalStyles.detailsContainer}>
                  <Card borderRaduis={10}>
                    <View style={globalStyles.imageMenu}>
                      <Image
                          source={
                            imsDayMenuData?.photo !== '' && imsDayMenuData?.photo !== null
                                ? {uri: `${BASEURL_IMG}/${imsDayMenuData.photo}`}
                                : IMAGES.photoMenu
                          }
                          resizeMode="cover"
                          style={globalStyles.imageMenuCover}
                      />
                    </View>
                    <View style={globalStyles.infoMenuContainer}>
                      <Text style={globalStyles.titleH2}>{imsDayMenuData?.nom}</Text>

                      <View style={{flexDirection: 'row', flexWrap: 'wrap'} as StyleSheet}>
                        <Text style={globalStyles.entreeDish}>
                          {t('myDayAtIms.starter_dish')} :{' '}
                        </Text>
                        <Text style={{...globalStyles.entreeDish, fontWeight: '700'} as StyleSheet}>
                          {imsDayMenuData?.entree}
                        </Text>
                      </View>

                      <View style={{flexDirection: 'row', flexWrap: 'wrap'} as StyleSheet}>
                        <Text style={globalStyles.dish}>{t('myDayAtIms.dish')} : </Text>
                        <Text style={{...globalStyles.dish, fontWeight: '700'} as StyleSheet}>
                          {imsDayMenuData?.plat}
                        </Text>
                      </View>

                      <View style={{flexDirection: 'row', flexWrap: 'wrap'} as StyleSheet}>
                        <Text style={globalStyles.dessert}>
                          {t('myDayAtIms.dessert')} :{' '}
                        </Text>
                        <Text style={{...globalStyles.dessert, fontWeight: '700'} as StyleSheet}>
                          {imsDayMenuData?.dessert}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </View>
            )}
          </>
      )}


      <View style={styles.howIateContainer}>
        <Text style={globalStyles.titleH2}>{t('myDayAtIms.how_i_ate')}</Text>
        <Text style={globalStyles.paragraph}>
          {i18n.language === 'en'
            ? CANTEEN_OBSERVATION_EN[imsDayInfo?.observationCantine]
            : CANTEEN_OBSERVATION_FR[imsDayInfo?.observationCantine]}
        </Text>
        {imsDayInfo?.commentaireCantine !== '' &&
          imsDayInfo?.commentaireCantine !== null && (
            <>
              <Text
                style={{
                  ...globalStyles.titleH3,
                  marginTop: 15,
                  marginBottom: 7,
                }}>
                {t('myDayAtIms.observation')}
              </Text>
              <Text style={globalStyles.paragraph}>
                {imsDayInfo?.commentaireCantine}
              </Text>
            </>
          )}
      </View>

      <View style={styles.napTimeContainer}>
        <View style={styles.imsDayItem}>
          <View style={styles.imsDayItemText}>
            <Text style={globalStyles.titleH2}>{t('myDayAtIms.nap_time')}</Text>
            {imsDayInfo?.sieste ? (
              <>
                <Text style={globalStyles.paragraph}>
                  {t('myDayAtIms.start_nap_time')} :{' '}
                  {format(
                    imsDayInfo?.timeDebutSieste !== null
                      ? toZonedTime(imsDayInfo?.timeDebutSieste, TIME_ZONE_ABIDJAN)
                      : 0,
                    i18n.language === 'en' ? 'hh:mm a' : 'H:mm',
                    {locale: i18n.language === 'en' ? enUS : fr},
                  )}
                </Text>
                <Text style={globalStyles.paragraph}>
                  {t('myDayAtIms.end_nap_time')} :{' '}
                  {format(
                    imsDayInfo?.timeFinSieste !== null
                      ? toZonedTime(imsDayInfo?.timeFinSieste, TIME_ZONE_ABIDJAN)
                      : 0,
                    i18n.language === 'en' ? 'hh:mm a' : 'H:mm',
                    {locale: i18n.language === 'en' ? enUS : fr},
                  )}
                </Text>
              </>
            ) : (
              <Text style={globalStyles.paragraph}>
                {t('myDayAtIms.no_nap_time')}
              </Text>
            )}
          </View>

          <View style={styles.imsDayItemImage}>
            <Image
              source={IMAGES.sleepNatimeImage}
              resizeMode="cover"
              style={styles.dayItemImageCover}
            />
          </View>
        </View>
      </View>

      {imsDayInfo?.bowelMvt > 0 && (
        <View style={styles.bowelContainer}>
          <Text style={globalStyles.titleH2}>
            {t('myDayAtIms.bowel_movement')}
          </Text>
          <Text style={globalStyles.paragraph}>
            {i18n.language === 'en' ? 'Yes' : 'Oui'}
          </Text>
          <Text
            style={{
              ...globalStyles.titleH3,
              marginTop: 15,
              marginBottom: 7,
            }}>
            {t('myDayAtIms.bowel_number_question')}
          </Text>
          <Text style={globalStyles.paragraph}>
            {imsDayInfo?.bowelMvt && i18n.language === 'en'
              ? imsDayInfo?.bowelMvt + ' time(s)'
              : imsDayInfo?.bowelMvt + ' fois'}
          </Text>
        </View>
      )}

      <View style={styles.injuriesContainer}>
        {imsDayInfo?.incident !== null && imsDayInfo?.incident !== '' && (
          <>
            <Text style={globalStyles.titleH2}>
              {t('myDayAtIms.injurie_record')}
            </Text>
            <Text style={globalStyles.paragraph}>{imsDayInfo?.incident}</Text>
          </>
        )}

        {imsDayInfo?.observationTeacher !== '' &&
          imsDayInfo?.observationTeacher !== null && (
            <>
              <Text
                style={{
                  ...globalStyles.titleH3,
                  marginTop: 15,
                  marginBottom: 7,
                }}>
                {t('myDayAtIms.observation')}
              </Text>
              <Text style={globalStyles.paragraph}>
                {imsDayInfo?.observationTeacher}
              </Text>
            </>
          )}
      </View>

      <View style={styles.parentComment}>
        {parentCommentStatus && (
          <>
            <Text style={globalStyles.titleH2}>
              {t('myDayAtIms.parent_comment')}
            </Text>
            <View style={{flexDirection: 'row'}}>
              <TextInput
                multiline
                placeholderTextColor={COLORS.grayLight}
                style={{...styles.inputModal, flex: 1}}
                placeholder={t('myDayAtIms.description_placeholder')}
                value={commentParent}
                editable={false}
                onChangeText={text => handleTextChange(text)}
              />
              <>
                <Pressable onPress={() => setImsDayParentModalStatus(true)}>
                  <MaterialIcons
                    name="edit"
                    color={COLORS.secondary}
                    size={27}
                    style={{marginTop: 5, marginLeft: 10}}
                  />
                </Pressable>
              </>
            </View>
          </>
        )}
        {!parentCommentStatus && (
          <FlatButton
            title={t('myDayAtIms.reply_on_teacher')}
            fontWeight="400"
            fontSize={16}
            backgroundColor={COLORS.secondary}
            paddingVertical={12}
            borderRadius={20}
            onPress={() => setImsDayParentModalStatus(true)}
            disabled={false}
          />
        )}
      </View>

      <ParentCommentForm
        imsDayInfo={imsDayInfo}
        imsDayParentModalStatus={imsDayParentModalStatus}
        setImsDayParentModalStatus={setImsDayParentModalStatus}
        saveParentObservation={saveParentObservation}
        index={index}
        handleTextChange={handleTextChange}
        commentParent={commentParent}
        setCommentParent={setCommentParent}
      />
    </View>
  );
}

export default ImsDayInfoItem;
