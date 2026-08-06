"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import styles from "./career.module.css";

export default function CareerClient() {
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert("Thank you! We'll be in touch soon.");
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12 subpage_coloum">
              <div className="subpage_heading">
                <h1>CAREER</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.careerSection}>
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5 order-lg-2">
              <div className={styles.illustration}>
                <Image src="/images/career-img.webp" alt="Career" width={520} height={520} />
              </div>
            </div>
            <div className="col-lg-7 order-lg-1">
              <form className={styles.formCard} onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="name">Name:</label>
                    <input id="name" className={styles.input} required />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="phone">Phone No:</label>
                    <input id="phone" className={styles.input} type="tel" required />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="email">Email address:</label>
                    <input id="email" className={styles.input} type="email" required />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="gender">Select Gender:</label>
                    <select id="gender" className={styles.select} required>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="resume">Upload Your Resume:</label>
                    <input id="resume" type="file" className={styles.fileInput} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="message">Messages:</label>
                  <textarea id="message" rows={3} className={styles.textarea} required />
                </div>
                <div className={styles.submitWrap}>
                  <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
