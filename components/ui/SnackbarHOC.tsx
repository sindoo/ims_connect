import React, {useState} from 'react';
import {Snackbar} from 'react-native-paper';
import {COLORS} from '../../constants';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const withSnackbar = (WrappedComponent: any) => {
  return (props: any) => {
    const [message, setMessage] = useState("I'm a custom snackbar");
    const [duration, setDuration] = useState(2000);

    const [visible, setVisible] = React.useState(false);
    const onDismissSnackBar = () => setVisible(false);

    const showMessage = (message: string, duration = 3000) => {
      setMessage(message);
      //setSeverity(severity);
      setDuration(duration);
      setVisible(true);
    };

    return (
      <>
        <WrappedComponent {...props} snackbarShowMessage={showMessage} />
        <Snackbar
          style={{backgroundColor: COLORS.gray, zIndex:100}}
          visible={visible}
          onDismiss={onDismissSnackBar}
          duration={duration}
          elevation={2}
          action={{
            label: '',
            icon: () => <MaterialCommunityIcons name={'close'} size={22} color={COLORS.white} />,
            onPress: () => {
              setVisible(false);
            },
          }}>
          {message}
        </Snackbar>
      </>
    );
  };
};
