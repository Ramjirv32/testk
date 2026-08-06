'use client';

import React, { useState } from 'react';

interface DepartmentsProps {
    departments: string[];
    collegeName: string;
}

export default function Departments({ departments, collegeName }: DepartmentsProps) {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filteredDepartments = departments.filter(dept =>
        dept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = [
        { name: 'Engineering', icon: '', keywords: ['engineering', 'computer', 'electrical', 'mechanical', 'civil', 'chemical'] },
        { name: 'Science', icon: '', keywords: ['science', 'biology', 'chemistry', 'physics', 'mathematics'] },
        { name: 'Arts & Humanities', icon: '', keywords: ['art', 'history', 'literature', 'philosophy', 'languages'] },
        { name: 'Business', icon: '', keywords: ['business', 'management', 'economics', 'finance', 'marketing'] },
        { name: 'Medicine', icon: '', keywords: ['medicine', 'nursing', 'health', 'medical', 'pharmacy'] },
        { name: 'Law', icon: '', keywords: ['law', 'legal', 'justice'] },
    ];

    const getDepartmentCategory = (dept: string): string => {
        const lowerDept = dept.toLowerCase();
        for (const cat of categories) {
            if (cat.keywords.some(keyword => lowerDept.includes(keyword))) {
                return cat.name;
            }
        }
        return 'Other';
    };

    const groupedDepartments = categories.reduce((acc, cat) => {
        acc[cat.name] = filteredDepartments.filter(dept => getDepartmentCategory(dept) === cat.name);
        return acc;
    }, {} as Record<string, string[]>);

    groupedDepartments['Other'] = filteredDepartments.filter(dept => getDepartmentCategory(dept) === 'Other');

    return (
        <>
            {/* Department Search and Browse */}
            <section className="content-section">
                <h2 className="section-title"> Departments ({departments?.length || 0})</h2>

                {/* Search Bar */}
                <div className="department-search">
                    <input
                        type="text"
                        placeholder=" Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Category Grid */}
                <div className="department-categories">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="category-card">
                            <div className="category-icon">{cat.icon}</div>
                            <div className="category-name">{cat.name}</div>
                            <div className="category-count">{groupedDepartments[cat.name]?.length || 0}</div>
                        </div>
                    ))}
                </div>
            </section>



            {/* Department Detail Modal/Panel */}
            {selectedDepartment && (
                <section className="content-section department-detail-panel">
                    <div className="department-detail-header">
                        <h3>{selectedDepartment}</h3>
                        <button
                            className="close-button"
                            onClick={() => setSelectedDepartment('')}
                        >
                            
                        </button>
                    </div>
                    <div className="department-detail-content">
                        <p><strong>Institution:</strong> {collegeName}</p>
                        <p><strong>Department:</strong> {selectedDepartment}</p>
                        <p><strong>Category:</strong> {getDepartmentCategory(selectedDepartment)}</p>
                        <div className="department-actions">
                            <button className="action-button primary">
                                 View Courses
                            </button>
                            <button className="action-button secondary">
                                 Contact Department
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* All Departments Grid (Compact View) */}
            <section className="content-section">
                <h2 className="section-title"> All Departments</h2>
                <div className="all-departments-compact">
                    {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((dept, idx) => (
                            <div key={idx} className="dept-tag-compact">
                                {categories.find(c => c.name === getDepartmentCategory(dept))?.icon || ''} {dept}
                            </div>
                        ))
                    ) : (
                        <p className="no-data">No departments match your search</p>
                    )}
                </div>
            </section>
        </>
    );
}
