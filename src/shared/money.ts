/** Money crosses the API boundary as integer minor units plus an ISO currency code. */
export type Money = { amountMinor: number; currency: string };

export const usd = (amountMinor: number): Money => ({ amountMinor, currency: "USD" });
