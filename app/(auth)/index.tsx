import ViewThemed from "../../components/ui/ViewThemed";
import {globalStyles} from "../../style/Global";
import LoginForm from "../../components/form/LoginForm";
import {useRouter} from "expo-router";
import {ROUTES} from "../../constants";
import {useState} from "react";
import {loginUser} from "../../redux/features/userSlice";
import {useDispatch} from "react-redux";

const Login = () => {
    const router = useRouter();
    const [buttonStatus, setButtonStatus] = useState(false);
    const dispatch = useDispatch();

    const onSubmit = (data) => {
        //router.push('(tabs)');
        console.log(data);

        setButtonStatus(true);
        const userInfo = {
            user: [],
            token: "jajshayyqwq.dsdowiwyewe00.yyweyweyyuw",
        };
        dispatch(loginUser(userInfo));
        setButtonStatus(false);
    }

    return (
        <ViewThemed style={globalStyles.container}>
            <LoginForm  onSubmit={onSubmit} sending={buttonStatus} />
        </ViewThemed>
    );
};

export default Login;
