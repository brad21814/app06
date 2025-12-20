import React from 'react';

interface DeveloperQuestionsProps {
    questions: any[];
    sessionId?: string;
    timePerQuestion?: number;
    onComplete?: () => void;
    onQuestionChange?: (questionId: string, index: number) => void;
    className?: string;
}

export const DeveloperQuestions: React.FC<DeveloperQuestionsProps> = ({
    questions,
    onComplete,
    className
}) => {
    return (
        <div className={className}>
            <h2>Developer Questions</h2>
            <p>Questions placeholder ({questions.length} questions)</p>
            <button onClick={onComplete}>Complete Session</button>
        </div>
    );
};
