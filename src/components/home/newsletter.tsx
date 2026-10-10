"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icons";
import { useCartCount } from "@/features/cart/use-cart";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FormState = { status: "idle" | "error"; message: string };

/**
 * Newsletter sign-up. Validation runs in the browser. The subscription endpoint and double opt-in are not
 * built yet, so a valid submission is reported as not connected rather than as a confirmed sign-up.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [formState, setFormState] = useState<FormState>({ status: "idle", message: "" });
  const bagCount = useCartCount().data ?? 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setFormState({ status: "error", message: "Please enter a valid email address." });
      return;
    }
    if (!consent) {
      setFormState({ status: "error", message: "Please confirm you are happy to hear from us." });
      return;
    }
    setFormState({
      status: "error",
      message: "Sign-up is not connected yet. Please try again later.",
    });
  };

  return (
    <section className="newsletter" id="newsletter" aria-labelledby="newsletter-title">
      <div className="newsletter-image" role="img" aria-label="Vellum editorial in deep green" />
      <div className="newsletter-content reveal">
        <p className="section-eyebrow">The next chapter starts here</p>
        <h2 id="newsletter-title">
          Get dressed for what is <em>next.</em>
        </h2>
        <p>
          New collections, styling notes and the pieces we think you will actually wear. No more
          than twice a month.
        </p>
        <form onSubmit={submit} noValidate>
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={
              formState.status === "error" && formState.message.startsWith("Please enter")
            }
            aria-describedby="newsletter-status"
          />
          <button className="button button-light" type="submit">
            Join the list <Icon.ArrowRight />
          </button>
        </form>
        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>Email me new arrivals and styling notes. Unsubscribe in one click, any time.</span>
        </label>
        <p
          id="newsletter-status"
          role="status"
          aria-live="polite"
          className={`form-status ${formState.status}`}
        >
          {formState.message}
        </p>
        {bagCount > 0 ? (
          <p className="newsletter-cart">
            You have {bagCount} item{bagCount === 1 ? "" : "s"} saved in your bag.{" "}
            <a className="text-link" href="/bag">
              Open your bag
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
