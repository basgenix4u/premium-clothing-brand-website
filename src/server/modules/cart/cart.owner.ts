/** Who owns a cart: a signed-in customer, or a guest identified by a hashed cookie token. */
export type CartOwner = { type: "user"; userId: string } | { type: "guest"; tokenHash: string };
