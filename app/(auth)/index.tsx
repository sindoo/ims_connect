import {View, Text} from "react-native";
import ViewThemed from "../../components/ui/ViewThemed";
import {globalStyles} from "../../style/Global";
import LoginForm from "../../components/form/LoginForm";

const Login = () => {
    return (
        <ViewThemed style={globalStyles.container}>
            <LoginForm  onSubmit={() => {}}/>
        </ViewThemed>
    );
};

export default Login;
