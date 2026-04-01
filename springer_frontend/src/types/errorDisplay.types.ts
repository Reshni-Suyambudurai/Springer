export interface BulkErrorResponse {
  success: boolean;
  message: string;
  data: {
    successfulInserts: object[];
    errorMessages: string[];
    totalProcessed: number;
    successCount: number;
    failureCount: number;
  };
}
