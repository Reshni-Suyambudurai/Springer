Always go through the project structure
Refer the folder structure and add the files correspondingly
If u create any mapToResponse in the service folder put them in mapper folder 
Use @Transactional where-ever needed
Dont put @cross-origin in the controller it is handled by the securityconfig
Dont add try-catch in the controller we have GlobalExceptionHandler
