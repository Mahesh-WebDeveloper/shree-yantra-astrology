declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    key: string;
    subscription_id: string;
    name?: string;
    description?: string;
    currency?: string;
    image?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    theme?: { color?: string; hide_topbar?: boolean };
    modal?: { confirm_close?: boolean; handleback?: boolean; animation?: boolean };
    timeout?: number;
  }

  export interface RazorpaySuccess {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayFailure {
    code?: number;
    description?: string;
    reason?: string;
    step?: string;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpaySuccess>;
  }
}
