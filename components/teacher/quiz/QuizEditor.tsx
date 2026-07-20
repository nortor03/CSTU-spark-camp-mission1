"use client";

import {
  useForm,
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import type { Quiz, QuizQuestion } from "@/lib/quiz";
import { blankChoice, blankQuestion } from "@/lib/quiz";

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
  onSave,
  onRegenerate,
  onEditPrompt,
}: {
  quiz: Quiz;
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
  const totalPoints = questions.reduce(
    (sum, q) => sum + (Number(q?.points) || 0),
    0,
  );

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
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
              <span>{quiz.week}</span>
              <span>·</span>
              <span>{fields.length} ข้อ</span>
              <span>·</span>
              <span>{totalPoints} คะแนน</span>
            </div>
          </div>
        </div>

        {/* การ์ดคำถาม */}
        {fields.map((field, index) => (
          <QuestionCard
            key={field._key}
            index={index}
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
  control,
  register,
  onRemove,
}: {
  index: number;
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
    <div className="card group relative overflow-hidden px-6 py-5 transition focus-within:shadow-lift">
      {/* แถบ accent ซ้ายเมื่อโฟกัส */}
      <span className="absolute inset-y-0 left-0 w-1 bg-tu-red-500 opacity-0 transition group-focus-within:opacity-100" />

      {/* โจทย์ */}
      <div className="flex items-start gap-3">
        <span className="display mt-1.5 w-6 flex-shrink-0 text-lg leading-none text-ink-300">
          {index + 1}
        </span>
        <textarea
          {...register(`questions.${index}.question`, { required: true })}
          rows={1}
          placeholder={`คำถามข้อที่ ${index + 1}`}
          className="min-h-[2.5rem] flex-1 resize-none rounded-md border-b border-line bg-paper-50 px-2.5 pb-2 pt-1.5 text-base text-ink-800 outline-none transition focus:border-tu-red-500 focus:bg-white"
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
