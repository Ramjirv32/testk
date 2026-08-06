'use client';

export default function AboutSection() {
  return (
    <section className="about_section" style={{ backgroundColor: '#faf4ec' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="about_img">
              <img src="/images/home-about-img.png" alt="About TRU" />
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="about_content">
              <h4>
                ABOUT <span style={{ color: '#9a3197', fontWeight: 400 }}>TRU</span>
              </h4>
              <p>
                We supports your application process with free, expert guidance. From choosing your perfect
                programme amongst our 400+ university partners to clicking submit on your application form,
                securing your visa to stepping off the plane and onto campus, our counsellors can help at every
                point.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
