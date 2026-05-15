export const getDashboardPathByRole = (roleName: string): string => {
  switch (roleName) {
    case "TA_HEAD":
      return "/ta-head/dashboard";
    case "TA_MANAGER":
      return "/ta-recruiter/dashboard";
    case "HIRING_MANAGER":
      return "/hiring-manager/hiring-cycles";
    case "MEMBERS":
      return "/members/dashboard";
    case "SYSTEM_ADMIN":
      return "/admin/dashboard";
    case "TRAINING_COORDINATOR":
      return "/training-coordinator/dashboard";
    case "INTERN":
      return "/intern/dashboard";
    case "HR_OPERATIONS":
      return "/hr-operations/dashboard";
    case "BU_SPOC":
      return "/bu-spoc/dashboard";
    default:
      return "/unauthorized";
  }   
};
