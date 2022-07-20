import React from 'react';
import Question from './Question';
import SectionTitle from './SectionTitle';

export default function Faqs() {
  const QUESTIONS: { question: string; answer: string }[] = [
    {
      question: 'What is the best category of dsolers?',
      answer:
        "There's no best as they all have their values. the best ones will be the first generation as they have way more value",
    },
  ];
  return (
    <>
      <SectionTitle title="FAQS" center />
      {QUESTIONS.map((question, index) => (
        <Question question={question} key={index} />
      ))}
    </>
  );
}
