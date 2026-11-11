import { createConfigurationBuilder } from "aws-amplify"

const amplifyConfig = createConfigurationBuilder()
    .auth({
        Cognito: {
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID
        },
    })
    .build();

export {amplifyConfig};