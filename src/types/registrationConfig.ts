export interface RegistrationPaymentConfig {
  upiId: string;
  payeeName: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch?: string;
  micr?: string;
  paymentInstructions: string[];
}

