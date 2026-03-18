import { Navigate } from "react-router-dom";
import Login from "./Login";
import { tokenstore } from "../../auth/tokenstore";
import { getDashboardPathByRole } from "../../utils/navigation";

const LoginRedirect = () => {
  const token = tokenstore.getToken();
  const user = tokenstore.getUser();

  if (token && user?.roleName) {
    const dashboardPath = getDashboardPathByRole(user.roleName);
    return <Navigate to={dashboardPath} replace />;
  }

  return <Login />;
};

export default LoginRedirect;