export const ROLE_OPTIONS = [
  { label: 'TA Manager', value: 'TA_MANAGER' },
  { label: 'TA Head', value: 'TA_HEAD' },
  { label: 'Hiring Manager', value: 'HIRING_MANAGER' },
  { label: 'Panel Member', value: 'MEMBERS' },
  { label: 'Training Coordinator', value: 'TRAINING_COORDINATOR' },
  { label: 'System Admin', value: 'SYSTEM_ADMIN' },
  { label: 'HR Operations', value: 'HR_OPERATIONS' },
  { label: 'BU SPOC', value: 'BU_SPOC' },
] as const;

export const DEPARTMENT_OPTIONS = [
  'Data and Analytics',
  'Product Engineering',
  'ServiceNow',
  'AI Engineer',
  'Sales',
  'Administration',
  'HR',
] as const;

export const LOCATION_OPTIONS = [
  'Chennai',
  'Bangalore',
  'Coimbatore',
  'Pune',
] as const;