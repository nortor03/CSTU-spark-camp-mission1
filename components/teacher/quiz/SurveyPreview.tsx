"use client";

import { useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import type { Quiz } from "@/lib/quiz";
import { quizToSurveyJSON } from "@/lib/surveyjs";
import { applyTuSurveyTheme } from "@/lib/surveyTheme";

/**
 * พรีวิวควิซด้วย SurveyJS — แสดง "สิ่งที่นักเรียนจะเห็น" จากค่าที่อาจารย์กำลังแก้
 * เป็นแค่ตัวอย่าง: ซ่อนปุ่มส่ง และตอบไม่นับคะแนน
 */
export default function SurveyPreview({ quiz }: { quiz: Quiz }) {
  // rebuild เฉพาะเมื่อเนื้อหาควิซเปลี่ยนจริง (กันการสร้าง model ถี่เกินไป)
  const json = useMemo(() => quizToSurveyJSON(quiz), [quiz]);
  const model = useMemo(() => {
    const m = new Model(json);
    applyTuSurveyTheme(m);
    m.showNavigationButtons = false;
    m.showProgressBar = "off";
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(json)]);

  return (
    <div className="survey-quiz">
      <Survey model={model} />
    </div>
  );
}
