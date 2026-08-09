import * as Yup from 'yup';

const newAddressValidationSchema = Yup.object().shape({
    address: Yup.string().required('Address is required'),
    landmark: Yup.string().required('Address is required'),
    contact: Yup.string().required('Contact number is required'),
    person: Yup.string().required('Contact person is required'),
    location: Yup.string().required('Location is required'),
});

const registerValidationSchema = Yup.object().shape({
    name: Yup.string().required('Fullname is required'),
    mpin: Yup.string()
        .min(4, 'Must be exactly 4 digit')
        .max(4, 'Must be exactly 4 digit')
        .required('MPIN is required'),
    mpinConfirmation: Yup.string()
        .oneOf([Yup.ref('mpin'), null], 'MPIN must match')
        .required('Verify MPIN is required'),
});

const loginValidationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
});

export {
    newAddressValidationSchema,
    registerValidationSchema,
    loginValidationSchema,
};
