"use client";

import { useState } from "react";
import {
  useForm,
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import type { Quiz, QuizQuestion } from "@/lib/quiz";
import { blankChoice, blankQuestion } from "@/lib/quiz";
import SurveyPreview from "./SurveyPreview";

interface QuizFormValues {
  title: string;
  questions: QuizQuestion[];
}

/**
 * ฟอร์มแก้ไขควิซ (react-hook-form + useFieldArray)
 * - การ์ดขาวบนพื้นกระดาษ, ช่องกรอกแบบขีดเส้นใต้ (ลดกรอบ/กล่อง)
 * - แก้โจทย์/ตัวเลือก/เฉลย, เพิ่ม-ลบข้อ, เปลี่ยนชนิดคำถาม, บันทึก/generate ใหม่
 */
export default function QuizEditor({
  quiz,
  highlightQuestionIds = [],
  onSave,
  onRegenerate,
  onEditPrompt,
}: {
  quiz: Quiz;
  /** รหัสคำถามที่ผู้ช่วย AI เพิ่ง แก้ไข/เพิ่มมาให้ (ยังไม่ได้บันทึก) — ใช้ไฮไลต์การ์ด */
  highlightQuestionIds?: string[];
  onSave: (quiz: Quiz) => void;
  onRegenerate: () => void;
  onEditPrompt: () => void;
}) {
  const { register, control, handleSubmit, watch } = useForm<QuizFormValues>({
    defaultValues: { title: quiz.title, questions: quiz.questions },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
    keyName: "_key",
  });

  const questions = watch("questions") ?? [];
  const title = watch("title") ?? quiz.title;
  const totalPoints = questions.reduce(
    (sum, q) => sum + (Number(q?.points) || 0),
    0,
  );

  // สลับดูตัวอย่างแบบ SurveyJS (สิ่งที่นักเรียนจะเห็น) จากค่าที่กำลังแก้
  const [showPreview, setShowPreview] = useState(false);
  const previewQuiz: Quiz = { ...quiz, title, questions };

  function submit(data: QuizFormValues) {
    onSave({ ...quiz, title: data.title, questions: data.questions });
  }

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="mx-auto max-w-2xl space-y-3">
        {/* การ์ดหัวฟอร์ม — เส้นแดงด้านบน */}
        <div className="card overflow-hidden">
          <div className="h-1.5 bg-tu-red-500" />
          <div className="px-6 pb-5 pt-5">
            <p className="eyebrow mb-2">แบบทดสอบ</p>
            <input
              {...register("title", { required: true })}
              className="display w-full border-b border-line bg-transparent pb-2 text-2xl outline-none transition focus:border-tu-red-500"
            />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
              <span>{quiz.week}</span>
              <span>·</span>
              <span>{fields.length} ข้อ</span>
              <span>·</span>
              <span>{totalPoints} คะแนน</span>
              <button
                type="button"
                onClick={() => setShowPreview((s) => !s)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 font-semibold text-ink-600 transition hover:border-tu-red-300 hover:text-tu-red-600"
                aria-pressed={showPreview}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-tu-red-500" />
                {showPreview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่างควิซ"}
              </button>
            </div>
          </div>
        </div>

        {/* ตัวอย่างแบบ SurveyJS — สิ่งที่นักเรียนจะเห็น (อัปเดตตามที่แก้) */}
        {showPreview && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line-soft bg-paper-50 px-5 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                ตัวอย่างสำหรับนักเรียน
              </span>
              <span className="rounded bg-tu-gold-50 px-1.5 py-0.5 text-[10px] font-bold text-tu-gold-700">
                SurveyJS
              </span>
            </div>
            <div className="px-2 py-2 sm:px-4">
              <SurveyPreview quiz={previewQuiz} />
            </div>
          </div>
        )}

        {/* การ์ดคำถาม */}
        {fields.map((field, index) => (
          <QuestionCard
            key={field._key}
            index={index}
            field={field}
            isChanged={highlightQuestionIds.includes(field.id)}
            control={control}
            register={register}
            onRemove={() => remove(index)}
          />
        ))}

        {/* เพิ่มคำถาม */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => append(blankQuestion())}
            className="btn-secondary rounded-full px-5"
          >
            <span className="text-base leading-none">+</span> เพิ่มคำถาม
          </button>
        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="button" onClick={onEditPrompt} className="btn-ghost">
            ← แก้โจทย์
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              className="btn-secondary"
            >
              สร้างชุดใหม่
            </button>
            <button type="submit" className="btn-primary px-6">
              บันทึกแบบทดสอบ
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ---------- การ์ดคำถาม 1 ข้อ ---------- */

function QuestionCard({
  index,
  field,
  isChanged = false,
  control,
  register,
  onRemove,
}: {
  index: number;
  /** ข้อมูลต้นฉบับของคำถามข้อนี้ — ใช้โชว์ metadata ที่ AI แนบมา (อ่านอย่างเดียว ไม่ผูกกับฟอร์ม) */
  field: QuizQuestion;
  /** true = ผู้ช่วย AI เพิ่งแก้ไข/เพิ่มข้อนี้มาให้ (ยังไม่ได้บันทึก) — ไฮไลต์ให้เห็นชัด */
  isChanged?: boolean;
  control: Control<QuizFormValues>;
  register: UseFormRegister<QuizFormValues>;
  onRemove: () => void;
}) {
  const {
    fields: choices,
    append: appendChoice,
    remove: removeChoice,
  } = useFieldArray({
    control,
    name: `questions.${index}.choices`,
    keyName: "_key",
  });

  return (
    <div
      className={`card group relative overflow-hidden px-6 py-5 transition focus-within:shadow-lift ${
        isChanged ? "ring-2 ring-tu-gold-400" : ""
      }`}
    >
      {/* แถบ accent ซ้าย — ค้างไว้ถ้า AI เพิ่งแก้ข้อนี้ ไม่งั้นโชว์แค่ตอนโฟกัส */}
      <span
        className={`absolute inset-y-0 left-0 w-1 bg-tu-gold-500 transition ${
          isChanged ? "opacity-100" : "opacity-0 group-focus-within:bg-tu-red-500 group-focus-within:opacity-100"
        }`}
      />

      {/* โจทย์ */}
      <div className="flex items-start gap-3">
        <span className="display mt-1.5 w-6 flex-shrink-0 text-lg leading-none text-ink-300">
          {index + 1}
        </span>
        {isChanged && (
          <span className="mt-1.5 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-tu-gold-100 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path d="M12 2.5c.3 0 .55.2.62.48l1.2 4.6 4.6 1.2a.64.64 0 0 1 0 1.24l-4.6 1.2-1.2 4.6a.64.64 0 0 1-1.24 0l-1.2-4.6-4.6-1.2a.64.64 0 0 1 0-1.24l4.6-1.2 1.2-4.6c.07-.28.32-.48.62-.48Z" />
              <path d="M19 14.2c.24 0 .45.16.51.4l.42 1.6 1.6.42a.53.53 0 0 1 0 1.02l-1.6.42-.42 1.6a.53.53 0 0 1-1.02 0l-.42-1.6-1.6-.42a.53.53 0 0 1 0-1.02l1.6-.42.42-1.6c.06-.24.27-.4.51-.4Z" />
            </svg>
            AI แก้ไขแล้ว
          </span>
        )}
        <textarea
          {...register(`questions.${index}.question`, { required: true })}
          rows={2}
          placeholder={`คำถามข้อที่ ${index + 1}`}
          className="min-h-[3.75rem] flex-1 resize-y rounded-md border-b border-line bg-paper-50 px-2.5 pb-2 pt-1.5 text-base text-ink-800 outline-none transition focus:border-tu-red-500 focus:bg-white"
        />
      </div>

      {/* ตัวเลือก (ปรนัย) — เลือกวงกลมหน้าตัวเลือกเพื่อกำหนดเฉลย */}
      <div className="mt-4 pl-9">
        <div className="space-y-1">
          {choices.map((choice, ci) => (
            <div
              key={choice._key}
              className="flex items-center gap-3 rounded-md px-1 py-1 transition hover:bg-paper-100"
            >
              <input
                type="radio"
                value={choice.id}
                {...register(`questions.${index}.answer`)}
                className="h-4 w-4 accent-tu-red-500"
                title="ตั้งเป็นคำตอบที่ถูก"
              />
              <input
                {...register(`questions.${index}.choices.${ci}.text`, {
                  required: true,
                })}
                placeholder={`ตัวเลือกที่ ${ci + 1}`}
                className="flex-1 border-b border-transparent bg-transparent py-1 text-sm text-ink-700 outline-none transition hover:border-line focus:border-tu-red-500"
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(ci)}
                  className="rounded px-1.5 text-ink-300 transition hover:text-tu-red-600"
                  aria-label="ลบตัวเลือก"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendChoice(blankChoice())}
            className="ml-7 mt-1 text-sm font-semibold text-ink-400 transition hover:text-tu-red-600"
          >
            เพิ่มตัวเลือก
          </button>
        </div>
      </div>

      {/* metadata ที่ AI แนบมาตอน generate — อ่านอย่างเดียว, ไม่มีถ้าเป็นคำถามที่อาจารย์เพิ่มเอง */}
      {(field.explanation ||
        field.relatedClos?.length ||
        field.topicTags?.length ||
        field.sources?.length) && (
        <div className="mt-4 ml-9 space-y-1.5 rounded-md bg-paper-50 px-3 py-2.5 text-xs text-ink-600">
          {(field.relatedClos?.length || field.topicTags?.length) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {field.relatedClos?.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-tu-red-50 px-2 py-0.5 font-semibold text-tu-red-600"
                >
                  {c}
                </span>
              ))}
              {field.topicTags?.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-paper-200 px-2 py-0.5 text-ink-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {field.explanation && (
            <p>
              <span className="font-semibold text-ink-500">คำอธิบายเฉลย: </span>
              {field.explanation}
            </p>
          )}
          {field.sources && field.sources.length > 0 && (
            <p className="text-ink-500">
              <span className="font-semibold">ที่มา: </span>
              {field.sources
                .map((s) =>
                  s.sourceLocation
                    ? `${s.filename} (${s.sourceLocation})`
                    : s.filename,
                )
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {/* แถบล่าง: คะแนน + ลบข้อ */}
      <div className="mt-4 flex items-center justify-end gap-4 border-t border-line-soft pt-3">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
          คะแนน
          <input
            type="number"
            min={0}
            {...register(`questions.${index}.points`, { valueAsNumber: true })}
            className="w-12 border-b border-line bg-transparent py-0.5 text-center text-sm text-ink-800 outline-none focus:border-tu-red-500"
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-semibold text-ink-400 transition hover:text-tu-red-600"
        >
          ลบข้อ
        </button>
      </div>
    </div>
  );
}
