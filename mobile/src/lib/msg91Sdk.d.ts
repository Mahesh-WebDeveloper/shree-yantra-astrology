export const OTPWidget: {
  initializeWidget(widgetId: string, tokenAuth: string): Promise<void>;
  getWidgetProcess(): Promise<any>;
  sendOTP(body: { identifier: string }): Promise<any>;
  retryOTP(body: { reqId: string; retryChannel?: number }): Promise<any>;
  verifyOTP(body: { reqId: string; otp: string }): Promise<any>;
};
