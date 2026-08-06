
export const mbtiDescriptions: Record<string, {
    title: string;
    icon: string;
    description: string;
    strengths: string[];
    careers: string[];
    famous: string[];
}> = {
    'ENFJ': {
        title: 'The Giver',
        icon: '',
        description: 'Warm, empathetic, and people-focused. ENFJs naturally understand others\' emotions and are motivated to help, guide, and inspire people. They value harmony, organization, and meaningful relationships.',
        strengths: ['Charismatic', 'Altruistic', 'Natural leader', 'Reliable', 'Empathetic'],
        careers: ['Teacher', 'Counselor', 'Coach', 'HR Manager', 'Politician'],
        famous: ['Oprah Winfrey', 'Barack Obama', 'Maya Angelou']
    },
    'ENTJ': {
        title: 'The Executive',
        icon: '',
        description: 'Confident, decisive, and strategic. ENTJs are natural leaders who enjoy organizing systems, setting goals, and turning ideas into action. They value logic, efficiency, and long-term planning.',
        strengths: ['Leadership', 'Strategic', 'Confident', 'Efficient', 'Decisive'],
        careers: ['CEO', 'Entrepreneur', 'Manager', 'Lawyer', 'Consultant'],
        famous: ['Steve Jobs', 'Margaret Thatcher', 'Napoleon Bonaparte']
    },
    'ENFP': {
        title: 'The Inspirer',
        icon: '',
        description: 'Enthusiastic, imaginative, and values-driven. ENFPs are motivated by possibilities and meaning. They enjoy exploring ideas, connecting with people, and inspiring others through creativity and passion.',
        strengths: ['Enthusiastic', 'Creative', 'Sociable', 'Energetic', 'Optimistic'],
        careers: ['Journalist', 'Actor', 'Teacher', 'Counselor', 'Entrepreneur'],
        famous: ['Robin Williams', 'Ellen DeGeneres', 'Walt Disney']
    },
    'ENTP': {
        title: 'The Visionary',
        icon: '',
        description: 'Energetic, innovative, and curious. ENTPs enjoy intellectual challenges, debate, and exploring new ideas. They thrive in dynamic environments and enjoy finding creative solutions to problems.',
        strengths: ['Quick thinker', 'Charismatic', 'Energetic', 'Creative', 'Innovative'],
        careers: ['Inventor', 'Entrepreneur', 'Marketing Specialist', 'Consultant', 'Journalist'],
        famous: ['Mark Twain', 'Thomas Edison', 'Leonardo da Vinci']
    },
    'ESFJ': {
        title: 'The Caregiver',
        icon: '',
        description: 'Supportive, responsible, and community-oriented. ESFJs value harmony, cooperation, and tradition. They enjoy helping others, maintaining relationships, and creating stable, organized environments.',
        strengths: ['Strong practical skills', 'Loyal', 'Sensitive', 'Warm', 'Good at connecting'],
        careers: ['Teacher', 'Nurse', 'Social Worker', 'Event Coordinator', 'HR Manager'],
        famous: ['Taylor Swift', 'Bill Clinton', 'Jennifer Garner']
    },
    'ESFP': {
        title: 'The Performer',
        icon: '',
        description: 'Outgoing, spontaneous, and lively. ESFPs enjoy living in the present moment and engaging with people and experiences. They learn best through action and bring energy and positivity to groups.',
        strengths: ['Bold', 'Original', 'Practical', 'Observant', 'Excellent people skills'],
        careers: ['Actor', 'Event Planner', 'Sales Representative', 'Tour Guide', 'Musician'],
        famous: ['Marilyn Monroe', 'Elvis Presley', 'Jamie Oliver']
    },
    'ESTJ': {
        title: 'The Supervisor',
        icon: '',
        description: 'Practical, structured, and dependable. ESTJs value order, rules, and responsibility. They are strong organizers who enjoy managing tasks and people to achieve clear, efficient outcomes.',
        strengths: ['Dedicated', 'Strong-willed', 'Direct', 'Honest', 'Organized'],
        careers: ['Manager', 'Administrator', 'Judge', 'Military Officer', 'Business Analyst'],
        famous: ['Henry Ford', 'John D. Rockefeller', 'Condoleezza Rice']
    },
    'ESTP': {
        title: 'The Dynamo',
        icon: '',
        description: 'Bold, adaptable, and action-oriented. ESTPs thrive in fast-paced situations and enjoy hands-on problem solving. They focus on real-world results and respond quickly to challenges.',
        strengths: ['Bold', 'Rational', 'Practical', 'Original', 'Perceptive'],
        careers: ['Entrepreneur', 'Sales Representative', 'Paramedic', 'Detective', 'Athlete'],
        famous: ['Donald Trump', 'Ernest Hemingway', 'Madonna']
    },
    'INFJ': {
        title: 'The Advocate',
        icon: '',
        description: 'Insightful, idealistic, and purpose-driven. INFJs are guided by strong values and a desire to make a meaningful impact. They combine intuition with empathy and often seek deep understanding.',
        strengths: ['Insightful', 'Creative', 'Inspiring', 'Decisive', 'Passionate'],
        careers: ['Counselor', 'Writer', 'Psychologist', 'Teacher', 'Social Worker'],
        famous: ['Martin Luther King Jr.', 'Mother Teresa', 'Nelson Mandela']
    },
    'INTJ': {
        title: 'The Architect',
        icon: '',
        description: 'Independent, analytical, and future-focused. INTJs enjoy developing long-term strategies and improving systems. They value logic, insight, and efficiency over emotional expression.',
        strengths: ['Strategic thinking', 'Independent', 'Determined', 'Innovative', 'Analytical'],
        careers: ['Software Engineer', 'Scientist', 'Architect', 'Strategic Planner', 'Professor'],
        famous: ['Elon Musk', 'Isaac Newton', 'Stephen Hawking']
    },
    'INFP': {
        title: 'The Idealist',
        icon: '',
        description: 'Sensitive, thoughtful, and values-centered. INFPs seek authenticity and meaning in life. They are deeply guided by personal beliefs and care strongly about people and causes.',
        strengths: ['Idealistic', 'Empathetic', 'Creative', 'Open-minded', 'Passionate'],
        careers: ['Writer', 'Artist', 'Counselor', 'Teacher', 'Psychologist'],
        famous: ['William Shakespeare', 'J.R.R. Tolkien', 'Princess Diana']
    },
    'INTP': {
        title: 'The Thinker',
        icon: '',
        description: 'Logical, curious, and analytical. INTPs enjoy exploring theories, concepts, and complex ideas. They value understanding how things work and prefer flexibility and intellectual freedom.',
        strengths: ['Logical', 'Creative', 'Objective', 'Analytical', 'Original'],
        careers: ['Researcher', 'Programmer', 'Mathematician', 'Philosopher', 'Analyst'],
        famous: ['Albert Einstein', 'Bill Gates', 'Marie Curie']
    },
    'ISFJ': {
        title: 'The Protector',
        icon: '',
        description: 'Loyal, practical, and caring. ISFJs value stability, responsibility, and helping others quietly. They are detail-oriented and committed to supporting people and traditions.',
        strengths: ['Supportive', 'Reliable', 'Patient', 'Practical', 'Observant'],
        careers: ['Nurse', 'Teacher', 'Administrator', 'Counselor', 'Social Worker'],
        famous: ['Mother Teresa', 'Queen Elizabeth II', 'Rosa Parks']
    },
    'ISFP': {
        title: 'The Artist',
        icon: '',
        description: 'Gentle, flexible, and present-focused. ISFPs value personal freedom, creativity, and living in harmony with their values. They prefer action over words and expression over structure.',
        strengths: ['Charming', 'Sensitive', 'Imaginative', 'Passionate', 'Curious'],
        careers: ['Artist', 'Musician', 'Designer', 'Chef', 'Veterinarian'],
        famous: ['Michael Jackson', 'Marilyn Monroe', 'Bob Dylan']
    },
    'ISTJ': {
        title: 'The Inspector',
        icon: '',
        description: 'Responsible, organized, and detail-oriented. ISTJs value rules, facts, and consistency. They are dependable individuals who take commitments seriously and work steadily toward goals.',
        strengths: ['Honest', 'Direct', 'Strong-willed', 'Dutiful', 'Practical'],
        careers: ['Accountant', 'Administrator', 'Engineer', 'Military Officer', 'Auditor'],
        famous: ['George Washington', 'Warren Buffett', 'Angela Merkel']
    },
    'ISTP': {
        title: 'The Craftsman',
        icon: '',
        description: 'Independent, practical, and problem-solving oriented. ISTPs enjoy understanding how things work and fixing real-world problems. They prefer hands-on tasks and flexible environments.',
        strengths: ['Optimistic', 'Creative', 'Practical', 'Spontaneous', 'Rational'],
        careers: ['Mechanic', 'Engineer', 'Pilot', 'Forensic Scientist', 'Athlete'],
        famous: ['Clint Eastwood', 'Tom Cruise', 'Bruce Lee']
    }
};

export function getMBTIDescription(type: string) {
    return mbtiDescriptions[type.toUpperCase()] || {
        title: 'Unknown Type',
        icon: '',
        description: 'Type description not available.',
        strengths: [],
        careers: [],
        famous: []
    };
}
