import styles from "./terms.module.css";

export const metadata = {
  title: "Terms & Conditions | Top Ranking University",
  description: "Understand the guidelines for using Top Ranking University.",
};

const sections = [
  {
    title: "TERMS AND CONDITIONS OF USE",
    paragraphs: [
      "Important things you need to know when using toprankinguniversity.com.",
      "Welcome to toprankinguniversity.com. Please read these Terms and Conditions of Use (\"Terms\") carefully before using the Website.",
      "Under each section there is additional text (in italics) which explains what each section means for you and your use of the Website.",
    ],
  },
  {
    title: "Who we are",
    paragraphs: [
      "Website is brought to you by QS Quacquarelli Symonds Limited of 1 Tranley Mews, Fleet Road, London NW3 2DG (\"QS\"). QS is registered in England and Wales under company number 02563879. QS is the world’s leading provider of services, analytics, and insight to the global higher education sector.",
    ],
  },
  {
    title: "Disclaimer",
    paragraphs: [
      "These rankings are independent and objective assessments by QS based on the available data and evaluation criteria and QS current ranking methodology. They are a comparative analysis based on specific criteria, not an endorsement of any individual educational institution by QS.",
      "Prospective students and those advising them are advised to carry out additional research and due diligence when selecting an educational institution. QS encourages them to consider multiple factors, such as accreditation, reputation, faculty qualifications, facilities, and student reviews, in addition to rankings.",
    ],
  },
  {
    title: "Data Protection",
    paragraphs: [
      "These Terms incorporate our Privacy Policy and Cookies Policy which describes (among other things) how we will use any personal information collected as a result of your use of the Services. For more information: toprankinguniversity.com/privacy-policy and toprankinguniversity.com",
    ],
  },
];

export default function TermsConditionPage() {
  return (
    <div>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="subpage_heading">
                <h1>TERMS & CONDITIONS</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className="container">
          {sections.map((section) => (
            <article key={section.title} className={styles.articleBlock}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.paragraphs.map((text, index) => (
                <p key={index} className={styles.sectionText}>{text}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
