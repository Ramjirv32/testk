'use client'

interface RankingSectionProps {
  title?: string;
}

const paragraphs = [
  'TRU Ranking is a transformative institutional assessment system designed to spotlight excellence in higher education through a lens of Transparency, Reliability, and Uniqueness. Born from years of experience in global accreditation and ranking systems, TRU Ranking serves as a forward-thinking benchmark that reflects institutional performance in alignment with international standards and strategic goals.',
  'Built on a foundation of quality assurance, TRU Ranking employs a rigorously structured methodology that integrates performance indicators across academic output, societal impact, innovation culture, internationalization, and student satisfaction. The framework is designed not only to assess but also to empower institutions in their journey toward continuous improvement and global recognition.',
  'Led by professionals with extensive exposure to THE Impact Rankings, QS evaluations, and accreditation protocols, the TRU Ranking team brings a unique synergy of strategic planning expertise and international engagement. Institutions are not just evaluated they are mentored, guided, and aligned with best practices to enhance their positioning on the global stage.',
  'What sets TRU Ranking apart is its commitment to expertise-centric assessment, ensuring that institutions are benchmarked fairly based on their strengths and developmental context. Our personalized institutional feedback, aligned with sustainable development goals and innovation metrics, ensures relevance in today\'s rapidly evolving educational ecosystem.',
  'With a mission to catalyze institutional excellence through clarity and comparability, TRU Ranking is more than a score it is a strategic compass for academic institutions aiming for impactful and sustainable growth.'
];

export default function RankingSection({ title = 'TRU RANKING' }: RankingSectionProps) {
  return (
    <main className="w-full bg-[#f8f5f0] min-h-screen">
      {}
      <section className="w-full bg-white py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold text-[#2d2d2d] text-center md:text-5xl">
            {title}
          </h1>
        </div>
      </section>

      {}
      <section className="w-full bg-[#f8f5f0] py-16 px-4">
        <article className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg border border-[#ede9e4] p-8 md:p-12">
            <h2 
              className="text-3xl font-bold text-center mb-8 md:text-4xl"
              style={{
                background: 'linear-gradient(to right, #9a3197, #e084cd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Top Universities Worldwide
            </h2>

            {paragraphs.map((para, index) => (
              <p 
                key={index} 
                className="mb-6 text-base font-light leading-relaxed text-justify text-[#5a5a5a] md:text-lg"
              >
                {para}
              </p>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
