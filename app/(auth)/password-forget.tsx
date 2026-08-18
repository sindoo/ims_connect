import React from 'react';
import ViewThemed from "../../components/ui/ViewThemed";
import {globalStyles} from "../../style/Global";
import ForgetPasswordForm from "../../components/form/ForgetPasswordForm";

const PasswordForget = () => {
    return (
        <ViewThemed style={globalStyles.container}>
            <ForgetPasswordForm  onSubmit={() => {}}/>
        </ViewThemed>
    );
};

export default PasswordForget;
