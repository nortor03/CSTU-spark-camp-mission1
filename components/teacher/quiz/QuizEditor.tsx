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
 * ฟอร์มแก้ไขควิซสไตล์ Google Form (react-hook-form + useFieldArray)
 * - พื้นลาเวนเดอร์ + การ์ดขาว, ช่องกรอกแบบขีดเส้นใต้ (ลดกรอบ/กล่อง)
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
    <form
      onSubmit={handleSubmit(submit)}
      className="rounded-3xl bg-cream-100 p-3 sm:p-6"
    >
      <div className="mx-auto max-w-2xl space-y-3">
        {/* การ์ดหัวฟอร์ม — แถบสีด้านบนแบบ Google Form */}
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
          <div className="h-2.5 bg-tu-red-500" />
          <div className="px-6 pb-5 pt-4">
            <input
              {...register("title", { required: true })}
              className="w-full border-b border-slate-200 bg-transparent pb-2 text-2xl font-medium text-slate-800 outline-none transition focus:border-tu-red-500"
            />
            <p className="mt-3 text-xs text-slate-500">
              {quiz.week} · {fields.length} ข้อ · {totalPoints} คะแนน
            </p>
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
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-black/5 transition hover:text-tu-red-600"
          >
            <span className="text-lg leading-none">+</span> เพิ่มคำถาม
          </button>
        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={onEditPrompt}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white/60"
          >
            ← แก้โจทย์
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              className="rounded-lg bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
            >
              สร้างชุดใหม่
            </button>
            <button
              type="submit"
              className="rounded-lg bg-tu-red-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-tu-red-600"
            >
              บันทึกควิซ
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
    <div className="group relative overflow-hidden rounded-xl bg-white px-6 py-5 ring-1 ring-black/5 transition">
      {/* แถบ accent ซ้ายเมื่อโฟกัส (แบบ Google Form) */}
      <span className="absolute inset-y-0 left-0 w-1.5 bg-tu-red-500 opacity-0 transition group-focus-within:opacity-100" />

      {/* โจทย์ */}
      <div className="flex flex-col gap-3">
        <textarea
          {...register(`questions.${index}.question`, { required: true })}
          rows={1}
          placeholder={`คำถามข้อที่ ${index + 1}`}
          className="min-h-[2.5rem] flex-1 resize-none border-b border-slate-200 bg-slate-50/60 px-2 pb-2 pt-1.5 text-base text-slate-800 outline-none transition focus:border-tu-red-500 focus:bg-white"
        />
      </div>

      {/* ตัวเลือก (ปรนัย) — เลือกวงกลมหน้าตัวเลือกเพื่อกำหนดเฉลย */}
      <div className="mt-4">
        <div className="space-y-1">
          {choices.map((choice, ci) => (
            <div
              key={choice._key}
              className="flex items-center gap-3 rounded-md px-1 py-1 hover:bg-slate-50"
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
                className="flex-1 border-b border-transparent bg-transparent py-1 text-sm text-slate-700 outline-none transition hover:border-slate-200 focus:border-tu-red-500"
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoice(ci)}
                  className="rounded px-1.5 text-slate-300 transition hover:text-tu-red-600"
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
            className="ml-7 mt-1 text-sm font-medium text-slate-400 transition hover:text-tu-red-600"
          >
            เพิ่มตัวเลือก
          </button>
        </div>
      </div>

      {/* แถบล่าง: คะแนน + ลบข้อ */}
      <div className="mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-3">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          คะแนน
          <input
            type="number"
            min={0}
            {...register(`questions.${index}.points`, { valueAsNumber: true })}
            className="w-12 border-b border-slate-200 bg-transparent py-0.5 text-center text-sm text-slate-700 outline-none focus:border-tu-red-500"
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-semibold text-slate-400 transition hover:text-tu-red-600"
        >
          ลบข้อ
        </button>
      </div>
    </div>
  );
}
