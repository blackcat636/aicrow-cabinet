/** POST /balance/payment-methods/stripe/create-payment-intent */
export interface StripePaymentIntentData {
  id: string;
  client_secret?: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripePaymentIntentCreateResponse {
  status: number;
  data: StripePaymentIntentData;
  message?: string;
}
