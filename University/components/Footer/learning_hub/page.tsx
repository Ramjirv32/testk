export const metadata = {
  title: "Learning Hub | Top Ranking University",
  description: "Access immersive learning resources from TRU.",
};

export default function LearningHubPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="subpage_heading">
                <h1>LEARNING HUB</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ width: "100%", height: "calc(100vh - 200px)" }}>
        <iframe
          src="https://360hos.360degweb.com/achievables/"
          title="Learning Hub"
          style={{ width: "100%", height: "100%", border: "none" }}
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
