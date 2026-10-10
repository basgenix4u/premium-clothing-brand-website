"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icons";
import { FAQS } from "@/features/home/home-content";

export function Faq() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  return (
    <section className="faq section-pad" id="faq" aria-labelledby="faq-title">
      <div className="faq-intro reveal">
        <p className="section-eyebrow">Know before you go</p>
        <h2 id="faq-title">
          The details,
          <br />
          <em>considered.</em>
        </h2>
      </div>
      <div className="faq-list reveal reveal-delay-1">
        {FAQS.map((faq, index) => {
          const open = activeFaq === index;
          return (
            <div className="faq-item" key={faq.question}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`faq-answer-${index}`}
                onClick={() => setActiveFaq(open ? null : index)}
              >
                <span>{faq.question}</span>
                <Icon.Plus open={open} />
              </button>
              <div id={`faq-answer-${index}`} className={`faq-answer ${open ? "show" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
