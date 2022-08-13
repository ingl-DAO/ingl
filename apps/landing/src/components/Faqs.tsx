import React from 'react';
import Question from './Question';
import SectionTitle from './SectionTitle';

export default function Faqs() {
  const QUESTIONS: { question: string; answer: string }[] = [
    {
      question:
        "How can ingl DAO fulfill it's goal while allowing sol backed gems to be redeemable?",
      answer:
        "The sol used to mint gems is used only to stake and is never converted or subjected to any other token's volatility",
    },
    {
      question: 'who can onboard a computing unit?',
      answer:
        'anyone, provided they mean the minimum solana validator requirements',
    },
    {
      question: 'How are yields generated ?',
      answer:
        'validators earn voting rewards that are later redistributed to all participants.',
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
