'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './footer.module.css';

const footerColumns = [
  {
    heading: 'TRU.COM',
    links: [
      { label: 'Blogs', href: '/all-blogs' },
      { label: 'Academic Institutions', href: '/academic_institution' },
      { label: 'Contact Us', href: '/contact' }
    ]
  },
  {
    heading: 'Help',
    links: [
      { label: 'Career', href: '/career' },
      { label: 'Membership Details', href: '/login' },
      { label: 'Terms & Conditions', href: '/terms_condition' },
      { label: 'Customer Support', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy_policy' }
    ]
  },
  {
    heading: 'Resources',
    links: [
      { label: 'University', href: '/all-university' },
      { label: 'Students', href: '/login' },
      { label: 'School Solutions', href: '/school_solution' },
      { label: 'Learning Hub', href: '/learning_hub' }
    ]
  }
];

const socialLinks = [
  { icon: 'fa-facebook-f', label: 'Facebook', href: 'https://facebook.com' },
  { icon: 'fa-instagram', label: 'Instagram', href: 'https://instagram.com' },
  { icon: 'fa-youtube', label: 'YouTube', href: 'https://youtube.com' },
  { icon: 'fa-twitter', label: 'Twitter', href: 'https://twitter.com' }
];

export default function Footer() {
  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && (window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Coming Soon!',
        text: 'This feature is currently under development.',
        icon: 'info',
        confirmButtonColor: '#070642'
      });
    } else {
      alert('Coming Soon! This feature is currently under development.');
    }
  };

  return (
    <footer className={styles.footerSection}>
      <div className={styles.contentWrapper}>
        <div className={styles.brandColumn}>
          <Image src="/images/tru-logo.svg" alt="TRU" width={110} height={110} />
          <p className={styles.brandCopy}>
            Empowering universities with transparent ranking intelligence, strategic consulting,
            and student engagement frameworks.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.heading} className={styles.linkColumn}>
            <h5>{column.heading}</h5>
            <ul>
              {column.links.map((link) => {
                const isComingSoon = link.label === 'School Solutions' || link.label === 'Learning Hub';
                const label = link.label === 'School Solutions' ? 'College Solution' : link.label;

                return (
                  <li key={link.label}>
                    {isComingSoon ? (
                      <a href="#" onClick={handleComingSoon}>{label}</a>
                    ) : (
                      <Link href={link.href}>{label}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className={styles.imageColumn}>
          <Image src="/images/footer-img.png" alt="TRU students" width={360} height={240} />
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p> {new Date().getFullYear()} Top Ranking University · All rights reserved</p>
        <div className={styles.socialList}>
          {socialLinks.map((item) => (
            <Link key={item.icon} href={item.href} aria-label={item.label} target="_blank">
              <span className={styles.socialIcon}>
                <i className={`fa-brands ${item.icon}`} aria-hidden="true"></i>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
