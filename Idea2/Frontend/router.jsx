import { createBrowserRouter } from "react-router-dom";

import App from "./src/App";
import LogginSignInSignUp from "./src/Auth/SignInSignUp";
import MobPage from "./src/page/MobPage";
import MobJoin from "./src/page/JoinMob";


const router = createBrowserRouter([
    {path: "/", element: <App/>},
    {path: "/loginsignup", element: <LogginSignInSignUp/>},
    {path: "/MobPage", element: <MobPage/>},
    { path: "/mob/:mobId", element: <MobJoin /> },
]);

export default router;