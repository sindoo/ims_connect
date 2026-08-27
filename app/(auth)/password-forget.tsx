import React, {useState} from 'react';
import ViewThemed from "../../components/ui/ViewThemed";
import {globalStyles} from "../../style/Global";
import ForgetPasswordForm from "../../components/form/ForgetPasswordForm";
import AuthenticationService from "../../services/AuthenticationService";
import {useTranslation} from "react-i18next";
import {withSnackbar} from "../../components/ui/SnackbarHOC";

const PasswordForget = (props) => {
    const {snackbarShowMessage} = props;
    const [buttonStatus, setButtonStatus] = useState(false);
    const {t} = useTranslation();

    const handleRequestPassword = async (data: any) => {
        try {
            setButtonStatus(true);
            const username = data?.username.trim();
            await AuthenticationService.updateUserPasswordForgotten(
                username,
            );
            snackbarShowMessage(t('snackBar.sb_success_password'));
            setButtonStatus(false);
        } catch (error) {
            snackbarShowMessage(t('snackBar.sb_error_username'));
            setButtonStatus(false);
            console.log(JSON.stringify(error));
        }
    };
    return (
        <ViewThemed style={globalStyles.container}>
            <ForgetPasswordForm
                onSubmit={handleRequestPassword}
                sending={buttonStatus}
            />
        </ViewThemed>
    );
};

export default withSnackbar(PasswordForget);
