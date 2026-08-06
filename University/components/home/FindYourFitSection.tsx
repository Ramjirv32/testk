'use client';

export default function FindYourFitSection() {
  return (
    <section style={{ backgroundColor: '#faf4ec', padding: '60px 0px 30px 0px' }}>
      <div className="container">
        <div className="row d-flex align-items-center">
          <div className="col-lg-5 col-md-5 col-sm-12">
            <div className="home_find_link">
              <h1>FIND YOUR FIT</h1>
              <h2>
                &quot;Empower Your Future: Explore your career options and find the right college with our
                psychometric testing and counselling.&quot;
              </h2>
              <div className="we-install">
                <a href="/find_your_fit">&quot;Quick survey, clear results&quot;</a>
              </div>
            </div>
          </div>
          <div className="col-lg-1 col-md-1 col-sm-12"></div>
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="home_find_link">
              <h1>FIND YOUR PERSONALITY</h1>
              <h2>
                &quot;Take the Free Psychometric test to discover your personality type and get career paths
                with matching professions tailored to you.&quot;
              </h2>
              <div className="we-install">
                <a href="/career-interest-survey">&quot;Take Psychometric Test&quot;</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
