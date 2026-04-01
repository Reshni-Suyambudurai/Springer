export const getDashboardPathByRole = (roleName: string): string => {
  switch (roleName) {
    case "TA_HEAD":
      return "/ta-head/dashboard";
    case "TA_RECRUITER":
      return "/ta-recruiter/dashboard";
    case "HIRING_MANAGER":
      return "/hiring-manager/dashboard";
    case "MEMBERS":
      return "/members/dashboard";
    case "SYSTEM_ADMIN":
      return "/admin/dashboard";
    case "TRAINING_COORDINATOR":
      return "/training-coordinator/dashboard";
    default:
      return "/unauthorized";
  }   
};
