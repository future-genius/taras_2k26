export interface RegistrationPaymentConfig {
  upiId: string;
  payeeName: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  paymentInstructions: string[];
}
