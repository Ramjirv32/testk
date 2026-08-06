import styles from "./privacy.module.css";

export const metadata = {
  title: "Privacy Policy | Top Ranking University",
  description: "Learn how Top Ranking University collects and protects your data.",
};

const sections = [
  {
    title: "What information we collect",
    body: [
      "We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:",
      "By providing information to QS for the purposes of becoming a Site User, creating your QS User account or adding any additional details to your QS User profile, you are expressly and voluntarily accepting the terms and conditions of this Privacy Policy and QS's User Agreement that allow QS to process information about you.",
      "Supplying information to QS, including any information deemed \"sensitive\" by applicable law, is entirely voluntary on your part. You have the right to withdraw your consent to QS's collection and processing of your information at any time, in accordance with the terms of this Privacy Policy and the User Agreement, by changing your Settings, or by closing your account, but please note that your withdrawal of consent will not be retroactive.",
    ],
  },
  {
    title: "Who we share your personal information with",
    body: [
      "We disclose personal information to facilitate the running of our business or to provide specific services you have requested. Commonly, we will disclose information to:",
      "We engage service providers who help to support our business and improve our products. These service providers include, for example, fulfilment providers for delivery of our digital content and marketing; customer service agencies; hosts, organisers and sponsors of our events; organisations that host our Sites, events or databases; and providers of online surveys. We also work with a number of distribution partners to deliver subscriptions. We have contracts in place with suppliers who process data to provide these services and they can only use your personal information under our instruction. For example, if you have a print subscription with us, we will disclose your information (address, contact details) to our distribution partners to facilitate delivery of the newspaper or magazine.",
    ],
  },
  {
    title: "Security",
    body: [
      "We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we safeguard and secure the information we collect online via electronic and managerial procedures.",
    ],
  },
  {
    title: "Analytics",
    body: [
      "We use two analytics packages in order to constantly improve your browsing experience on TopMBA.com, TopUniversities.com, qs.com and some of our other web properties.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="subpage_heading">
                <h1>PRIVACY POLICY</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.privacySection}>
        <div className="container">
          {sections.map((section) => (
            <article key={section.title} className={styles.privacyArticle}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.body.map((text, index) => (
                <p key={index} className={styles.sectionText}>{text}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
