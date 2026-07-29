"use client";

import { useEffect, useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import type { QuizChoice } from "@/lib/quiz";
import type { StudentAnswers } from "@/lib/feedback";
import { quizToSurveyJSON, surveyDataToAnswers } from "@/lib/surveyjs";
import { applyTuSurveyTheme } from "@/lib/surveyTheme";

/** รับได้ทั้ง Quiz เต็ม (โหมดฝึกซ้อม) และ StudentQuiz ที่ไม่มีเฉลย (โหมดควิซจริง) */
interface AnswerableQuiz {
  questions: { id: string; question: string; choices: QuizChoice[] }[];
}

/**
 * ฟอร์มทำแบบทดสอบด้วย SurveyJS Form Library
 * - render ควิซจาก JSON ที่แปลงมาจากควิซของเรา (ไม่แตะ field เฉลยเลย ถ้ามี)
 * - เมื่อกด "ส่งคำตอบ" (onComplete) → คืนคำตอบเป็น StudentAnswers ให้ผู้เรียก
 *   ไปส่งต่อให้ backend ตรวจ (หรือ gradeQuiz ในเครื่องถ้าเป็นโหมดฝึกซ้อม)
 */
export default function SurveyQuizForm({
  quiz,
  onComplete,
}: {
  quiz: AnswerableQuiz;
  onComplete: (answers: StudentAnswers) => void;
}) {
  const model = useMemo(() => {
    const m = new Model(quizToSurveyJSON(quiz));
    applyTuSurveyTheme(m);
    m.showProgressBar = "off";
    m.questionErrorLocation = "bottom";
    return m;
  }, [quiz]);

  useEffect(() => {
    const handler = (sender: Model) =>
      onComplete(surveyDataToAnswers(quiz, sender.data));
    model.onComplete.add(handler);
    return () => {
      model.onComplete.remove(handler);
    };
  }, [model, quiz, onComplete]);

  return (
    <div className="survey-quiz">
      <Survey model={model} />
    </div>
  );
}
