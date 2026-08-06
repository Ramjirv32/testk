"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import styles from "./contact.module.css";

const contactCards = [
  {
    title: "Our Address:",
    description: "No.12 1st Floor, Chennai, Tamil Nadu.",
    image: "/images/location-img.jpg",
    icon: "/images/icon-location.svg",
  },
  {
    title: "Email:",
    description: "info@tru.360degweb.com",
    image: "/images/email-img.jpg",
    icon: "/images/icon-mail.svg",
  },
  {
    title: "Phone:",
    description: "+91 1234567890",
    image: "/images/phone-img.jpg",
    icon: "/images/icon-phone.svg",
  },
  {
    title: "Follow Us:",
    description: "",
    image: "/images/follow-img.jpg",
    icon: "/images/icon-follow.svg",
  },
];

export default function ContactClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert("Form submitted successfully!");
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12 subpage_coloum">
              <div className="subpage_heading">
                <h1>CONTACT US</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className="container">
          <div className={styles.infoGrid}>
            {contactCards.map((card) => (
              <article key={card.title} className={styles.infoCard}>
                <Image
                  src={card.image}
                  alt={card.title}
                  width={320}
                  height={200}
                  className={styles.infoImage}
                />
                <div className={styles.infoContent}>
                  <h3>{card.title}</h3>
                  {card.title === "Follow Us:" ? (
                    <ul className={styles.followList}>
                      {["facebook-f", "twitter", "linkedin-in", "instagram"].map((icon) => (
                        <li key={icon}>
                          <a href="#" aria-label={`Visit our ${icon} page`}>
                            <i className={`fa-brands fa-${icon}`}></i>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{card.description}</p>
                  )}
                </div>
                <div className={styles.iconBadge}>
                  <Image src={card.icon} alt="icon" width={32} height={32} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contactMap}>
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-7">
              <div className={styles.mapWrapper}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d497511.2310658522!2d79.87933474107955!3d13.047985943115949!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265ea4f7d3361%3A0x6e61a70b6863d433!2sChennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1722850022200!5m2!1sen!2sin"
                  height="480"
                  width="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  title="Chennai Map"
                ></iframe>
              </div>
            </div>
            <div className="col-lg-5">
              <form className={styles.formWrapper} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name:</label>
                  <input
                    id="name"
                    className={styles.formControl}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone No:</label>
                  <input
                    id="phone"
                    className={styles.formControl}
                    placeholder="Enter your phone number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email address:</label>
                  <input
                    id="email"
                    type="email"
                    className={styles.formControl}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="message">Message:</label>
                  <textarea
                    id="message"
                    className={styles.formControl}
                    rows={3}
                    placeholder="Your message"
                    required
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
