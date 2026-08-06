'use client';

import Link from 'next/link';

export default function RankingSection() {
  return (
    <section className="section5" style={{ backgroundColor: '#faf4ec', padding: '60px 0px 30px 0px' }}>
      <div className="container">
        <div
          className="row d-flex justify-content-center align-items-center"
          data-aos="fade-up"
          data-aos-easing="ease"
          data-aos-delay="300"
        >
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="section5_content">
              <h1>Uncover college insights hidden in ranking data</h1>
              <div className="section5_button">
                <Link href="/ranking">
                  <button>Know More...</button>
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12" data-aos="fade-up" data-aos-easing="ease" data-aos-delay="300">
            <div className="section5_img">
              <img src="/images/home-img2.png" alt="Home Image 2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
