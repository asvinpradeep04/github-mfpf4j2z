import { useState } from 'react';
import { Landing } from '@/screens/Landing';
import { Setup } from '@/screens/Setup';
import { Interview } from '@/screens/Interview';
import { Debrief } from '@/screens/Debrief';
import { Practice } from '@/screens/Practice';
import { Comparison } from '@/screens/Comparison';
import { getCaseForDomain } from '@/data/cases';
import { compareAttempts } from '@/data/simulation';
import { resetCounters } from '@/data/simulation';
import type { Attempt, AttemptComparison, SetupData } from '@/types';

type Screen =
  | 'landing'
  | 'setup'
  | 'interview1'
  | 'debrief1'
  | 'practice'
  | 'interview2'
  | 'comparison';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [attempt1, setAttempt1] = useState<Attempt | null>(null);
  const [attempt2, setAttempt2] = useState<Attempt | null>(null);
  const [comparison, setComparison] = useState<AttemptComparison | null>(null);

  const handleStart = () => setScreen('setup');

  const handleSetupComplete = (data: SetupData) => {
    setSetupData(data);
    resetCounters();
    setScreen('interview1');
  };

  const handleInterview1Complete = (attempt: Attempt) => {
    setAttempt1(attempt);
    setScreen('debrief1');
  };

  const handleDebriefContinue = () => {
    setScreen('practice');
  };

  const handlePracticeComplete = (practiceResponse: string) => {
    if (attempt1) {
      setAttempt1({ ...attempt1, practiceResponse });
    }
    resetCounters();
    setScreen('interview2');
  };

  const handleInterview2Complete = (attempt: Attempt) => {
    setAttempt2(attempt);
    if (attempt1) {
      const result = compareAttempts(
        attempt1,
        attempt,
        attempt1.practiceExercise,
      );
      setComparison(result);
    }
    setScreen('comparison');
  };

  const handleRestart = () => {
    setSetupData(null);
    setAttempt1(null);
    setAttempt2(null);
    setComparison(null);
    setScreen('landing');
  };

  const handleExit = () => {
    setScreen('landing');
  };

  switch (screen) {
    case 'landing':
      return <Landing onStart={handleStart} />;

    case 'setup':
      return <Setup onComplete={handleSetupComplete} onBack={handleExit} />;

    case 'interview1':
      if (!setupData) return <Landing onStart={handleStart} />;
      return (
        <Interview
          setup={setupData}
          casePrompt={getCaseForDomain(setupData.domain, 1)}
          attemptNumber={1}
          onComplete={handleInterview1Complete}
          onExit={handleExit}
        />
      );

    case 'debrief1':
      if (!attempt1) return <Landing onStart={handleStart} />;
      return (
        <Debrief
          attempt={attempt1}
          onContinue={handleDebriefContinue}
          onExit={handleExit}
        />
      );

    case 'practice':
      if (!attempt1) return <Landing onStart={handleStart} />;
      return (
        <Practice
          attempt={attempt1}
          onComplete={handlePracticeComplete}
          onExit={handleExit}
        />
      );

    case 'interview2':
      if (!setupData) return <Landing onStart={handleStart} />;
      return (
        <Interview
          setup={setupData}
          casePrompt={getCaseForDomain(setupData.domain, 2)}
          attemptNumber={2}
          onComplete={handleInterview2Complete}
          onExit={handleExit}
        />
      );

    case 'comparison':
      if (!attempt1 || !attempt2 || !comparison) {
        return <Landing onStart={handleStart} />;
      }
      return (
        <Comparison
          attempt1={attempt1}
          attempt2={attempt2}
          comparison={comparison}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      );

    default:
      return <Landing onStart={handleStart} />;
  }
}

export default App;
