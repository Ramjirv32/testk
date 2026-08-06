/**
 * Centralized GRE Test Configuration and Scoring Engine
 */

const TEST_TYPES = {
  FULL_LENGTH: 'FULL_LENGTH',
  SECTIONAL: 'SECTIONAL',
  TOPIC_WISE: 'TOPIC_WISE',
};

const STATUSES = {
  REQUESTED: 'REQUESTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  SCHEDULED: 'SCHEDULED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

const TEST_SPECS = {
  FULL_LENGTH: {
    duration_minutes: 118,
    question_count: 55,
    awa_count: 1,
    verbal_count: 27,
    quant_count: 27,
    sections: [
      { id: 1, name: 'Analytical Writing (AWA)', time_minutes: 30, question_count: 1, type: 'AWA', subject: 'AWA' },
      { id: 2, name: 'Verbal Reasoning 1', time_minutes: 18, question_count: 12, type: 'VERBAL', subject: 'Verbal', difficulty: 'mixed' },
      { id: 3, name: 'Verbal Reasoning 2', time_minutes: 23, question_count: 15, type: 'VERBAL', subject: 'Verbal', difficulty: 'adaptive' },
      { id: 4, name: 'Quantitative Reasoning 1', time_minutes: 21, question_count: 12, type: 'QUANT', subject: 'Quant', difficulty: 'mixed' },
      { id: 5, name: 'Quantitative Reasoning 2', time_minutes: 26, question_count: 15, type: 'QUANT', subject: 'Quant', difficulty: 'adaptive' },
    ],
  },
  SECTIONAL: {
    Quant: { duration_minutes: 40, question_count: 20 },
    Verbal: { duration_minutes: 40, question_count: 20 },
    Default: { duration_minutes: 40, question_count: 20 },
  },
  TOPIC_WISE: {
    Easy: { duration_minutes: 15, question_count: 10 },
    Medium: { duration_minutes: 20, question_count: 12 },
    Hard: { duration_minutes: 25, question_count: 15 },
    Default: { duration_minutes: 15, question_count: 10 },
  },
};

/**
 * Computes official GRE score (Quant 130-170, Verbal 130-170, Total 260-340)
 */
function calculateGreScore(quantCorrect = 0, totalQuant = 27, verbalCorrect = 0, totalVerbal = 27) {
  const safeTotalQuant = totalQuant > 0 ? totalQuant : 1;
  const safeTotalVerbal = totalVerbal > 0 ? totalVerbal : 1;

  const quantScore = Math.min(170, Math.max(130, 130 + Math.round((quantCorrect / safeTotalQuant) * 40)));
  const verbalScore = Math.min(170, Math.max(130, 130 + Math.round((verbalCorrect / safeTotalVerbal) * 40)));
  const totalScore = quantScore + verbalScore;

  return {
    quant_score: quantScore,
    verbal_score: verbalScore,
    total_score: totalScore,
    score_display: `${totalScore} / 340`,
  };
}

module.exports = {
  TEST_TYPES,
  STATUSES,
  TEST_SPECS,
  calculateGreScore,
};
