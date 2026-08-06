'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function DontSettleSection() {
  return (
    <section className="section4">
      <div className="container">
        <div className="row d-flex justify-content-center align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="section4_img" data-aos="fade-up" data-aos-easing="ease" data-aos-delay="300">
              <Image src="/images/home-img1.png" alt="Home Image 1" width={600} height={400} />
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="section4_content" data-aos="fade-up" data-aos-easing="ease" data-aos-delay="300">
              <h2>Don&apos;t settle for averages</h2>
              <div className="section4_button">
                <Link href="/all-university">
                  <button>Know More</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
