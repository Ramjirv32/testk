'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateProps {
    userName: string;
    testType: 'MVTI' | 'Cognitive' | 'Psychometric' | 'PESCIO';
    score: number;
    maxScore: number;
    completedDate: string;
    certificateId: string;
    mbtiType?: string;
    topCategories?: Array<{ name: string; score: number; key: string; color: string }>;
}

export default function Certificate({
    userName,
    testType,
    score,
    maxScore,
    completedDate,
    certificateId,
    mbtiType,
    topCategories
}: CertificateProps) {
    const certificateRef = useRef<HTMLDivElement>(null);

    const getTestTitle = () => {
        switch (testType) {
            case 'MVTI':
                return 'Myers-Briggs Type Indicator Assessment';
            case 'Cognitive':
                return 'Cognitive Ability Assessment';
            case 'Psychometric':
                return 'Psychometric Evaluation';
            case 'PESCIO':
                return 'PESCIO Interest Assessment';
            default:
                return 'Assessment';
        }
    };

    const getPsychometricInterpretation = () => {
        if (testType !== 'Psychometric') return null;

        if (score >= 60) {
            return {
                level: 'Highly Developed',
                traits: 'Strong adaptability, creativity, and social awareness',
                description: 'Shows highly developed cognitive, emotional, and behavioural skills.'
            };
        } else if (score >= 45) {
            return {
                level: 'Moderately Developed',
                traits: 'Good emotional control and problem-solving',
                description: 'The individual has good strengths but can improve consistency in emotional regulation or focus.'
            };
        } else if (score >= 30) {
            return {
                level: 'Average Range',
                traits: 'Balanced tendencies',
                description: 'Indicates balanced tendencies but may need support in maintaining confidence or concentration.'
            };
        } else {
            return {
                level: 'Needs Improvement',
                traits: 'Developing resilience and focus',
                description: 'Suggests challenges in emotional control, confidence, attention, or social interaction. Additional guidance or structured coaching may help.'
            };
        }
    };

    const getGrade = () => {
        if (testType === 'Psychometric') {
            const interpretation = getPsychometricInterpretation();
            return interpretation?.level || 'Completed';
        }

        if (testType === 'PESCIO') {
            const percentage = (score / maxScore) * 100;
            if (percentage >= 80) return 'Strong Interest';
            if (percentage >= 60) return 'Developing';
            return 'Exploratory';
        }

        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 80) return 'Very Good';
        if (percentage >= 70) return 'Good';
        if (percentage >= 60) return 'Satisfactory';
        return 'Completed';
    };

    const downloadCertificate = async () => {
        if (!certificateRef.current) return;

        try {
            const element = certificateRef.current;

            const canvas = await html2canvas(element, {
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: -window.scrollY,
                width: element.offsetWidth,
                height: element.offsetHeight,
                onclone: (clonedDoc) => {

                    if (clonedDoc.body) {
                        clonedDoc.body.style.background = 'white';
                        clonedDoc.body.style.backgroundColor = 'white';
                    }
                    const clonedElement = clonedDoc.querySelector('[data-cert-ref="true"]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.margin = '0';
                        clonedElement.style.boxShadow = 'none';
                        clonedElement.style.background = '#ffffff';
                        clonedElement.style.backgroundColor = '#ffffff';
                        clonedElement.style.transform = 'none';

                        const allDivs = clonedElement.querySelectorAll('div');
                        allDivs.forEach((div: any) => {

                            if (div.style.letterSpacing) {
                                div.style.letterSpacing = '0px';
                            }

                            div.style.lineHeight = '1.3';
                        });

                        const titles = clonedElement.querySelectorAll('div[style*="fontSize"]');
                        titles.forEach((el: any) => {
                            el.style.display = 'block';
                            el.style.position = 'relative';
                            el.style.visibility = 'visible';
                        });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

            pdf.save(`TRU_${testType}_Certificate_${userName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generating certificate:', error);
            alert('Failed to download certificate. Please try again.');
        }
    };

    return (
        <div data-certificate={testType.toLowerCase()} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#faf4ec', padding: '20px 0' }}>
            {}
            <div
                ref={certificateRef}
                data-cert-ref="true"
                style={{
                    width: '980px',
                    height: testType === 'Psychometric' ? '850px' : '693px',
                    background: '#ffffff',
                    backgroundColor: '#ffffff',
                    padding: '50px',
                    position: 'relative',
                    fontFamily: "'Georgia', serif",
                    border: '18px solid #070642',
                    boxShadow: '0 0 0 2px #9a3197 inset',
                }}
            >
                {}
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    left: '50px',
                    width: '120px',
                    height: '120px',
                    border: '4px solid #9a3197',
                    borderRight: 'none',
                    borderBottom: 'none',
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '50px',
                    width: '120px',
                    height: '120px',
                    border: '4px solid #9a3197',
                    borderLeft: 'none',
                    borderBottom: 'none',
                }}></div>

                {}
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div style={{
                        fontSize: '60px',
                        fontWeight: 'bold',
                        color: '#070642',
                        marginBottom: '12px',
                        letterSpacing: '3px'
                    }}>
                        TRU UNIVERSITY
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        letterSpacing: '4px',
                        textTransform: 'uppercase'
                    }}>
                        Certificate of Achievement
                    </div>
                </div>

                {}
                <div style={{
                    width: '175px',
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #9a3197, transparent)',
                    margin: '0 auto 35px'
                }}></div>

                {}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '14px',
                        fontStyle: 'italic'
                    }}>
                        This is to certify that
                    </div>
                    <div style={{
                        fontSize: '39px',
                        fontWeight: 'bold',
                        color: '#070642',
                        marginBottom: '21px',
                        fontFamily: "'Brush Script MT', cursive",
                        borderBottom: '2px solid #9a3197',
                        display: 'inline-block',
                        padding: '0 28px 7px'
                    }}>
                        {userName}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '14px'
                    }}>
                        has successfully completed the
                    </div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#9a3197',
                        marginBottom: testType === 'MVTI' && mbtiType ? '14px' : '21px'
                    }}>
                        {getTestTitle()}
                    </div>

                    {}
                    {testType === 'MVTI' && mbtiType && (
                        <div style={{
                            fontSize: '34px',
                            fontWeight: 'bold',
                            color: '#070642',
                            letterSpacing: '6px',
                            marginBottom: '21px',
                            padding: '7px 21px',
                            backgroundColor: '#f3e8ff',
                            borderRadius: '8px',
                            display: 'inline-block'
                        }}>
                            {mbtiType}
                        </div>
                    )}

                    {}
                    {testType === 'Psychometric' && getPsychometricInterpretation() && (
                        <div style={{
                            backgroundColor: '#f9fafb',
                            padding: '20px',
                            borderRadius: '8px',
                            marginTop: '20px',
                            border: '2px solid #9a3197'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                color: '#1f2937',
                                lineHeight: '1.6',
                                textAlign: 'left'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong>Character Traits:</strong> {getPsychometricInterpretation()?.traits}
                                </div>
                                <div>
                                    <strong>Assessment:</strong> {getPsychometricInterpretation()?.description}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {}
                {testType === 'PESCIO' && topCategories ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '28px',
                        marginBottom: '28px'
                    }}>
                        {topCategories.slice(0, 3).map((cat, index) => (
                            <div key={cat.key} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                                    TOP {index + 1} INTEREST
                                </div>
                                <div style={{
                                    fontSize: '34px',
                                    fontWeight: 'bold',
                                    color: '#9a3197',
                                    marginBottom: '3px'
                                }}>
                                    {cat.key}
                                </div>
                                <div style={{ fontSize: '11px', color: '#070642', fontWeight: '600' }}>
                                    {cat.name}
                                </div>
                                <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#9a3197', marginTop: '6px' }}>
                                    {cat.score}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '42px',
                        marginBottom: '28px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                                SCORE
                            </div>
                            <div style={{ fontSize: '25px', fontWeight: 'bold', color: '#070642' }}>
                                {score}/{maxScore}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                                GRADE
                            </div>
                            <div style={{ fontSize: '25px', fontWeight: 'bold', color: '#9a3197' }}>
                                {getGrade()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                                DATE
                            </div>
                            <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#070642' }}>
                                {new Date(completedDate).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {}
                <div style={{
                    position: 'absolute',
                    bottom: '42px',
                    left: '42px',
                    right: '42px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            borderTop: '2px solid #070642',
                            width: '140px',
                            marginBottom: '6px'
                        }}></div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#070642' }}>
                            Director
                        </div>
                        <div style={{ fontSize: '8px', color: '#6b7280' }}>
                            TRU University
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#9ca3af', marginBottom: '3px' }}>
                            Certificate ID
                        </div>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#070642', fontFamily: 'monospace' }}>
                            {certificateId}
                        </div>
                        <div style={{ fontSize: '7px', color: '#9ca3af', marginTop: '3px' }}>
                            Verify at: tru.university/verify
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            borderTop: '2px solid #070642',
                            width: '200px',
                            marginBottom: '8px'
                        }}></div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#070642' }}>
                            Assessment Coordinator
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            TRU University
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                    onClick={downloadCertificate}
                    style={{
                        backgroundColor: '#9a3197',
                        color: 'white',
                        padding: '16px 48px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(154, 49, 151, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(154, 49, 151, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(154, 49, 151, 0.3)';
                    }}
                >
                    <i className="fas fa-download" style={{ marginRight: '8px' }}></i>
                    Download Certificate (PDF)
                </button>
            </div>
        </div>
    );
}
