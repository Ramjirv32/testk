import React from 'react';
import OnlineTest from '../components/learningclub/OnlineTest';
import AssignTest from '../components/learningclub/AssignTest';
import UploadTest from '../components/learningclub/UploadTest';
import GenerateTest from '../components/learningclub/GenerateTest';

const LearningHub = () => {
    return (
        <div className="learning-hub">
            <h1>Learning Hub</h1>
            <div className="features">
                <OnlineTest />
                <AssignTest />
                <UploadTest />
                <GenerateTest />
            </div>
        </div>
    );
};

export default LearningHub;
