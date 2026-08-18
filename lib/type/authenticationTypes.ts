import {FormikValues} from 'formik';

export type TLoginFormProps = {
  errorMessage?: string;
  sending?: boolean;
  onSubmit(data: FormikValues): void;
};
