"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { generateMockQuiz, emptyPrompt, type Quiz } from "@/lib/quiz";
import {
  gradeQuiz,
  buildGradedResult,
  type QuizResult,
  type StudentAnswers,
} from "@/lib/feedback";
import { buildStudentSummary, type StudentSummary } from "@/lib/analytics";
import {
  fetchStudentQuiz,
  fetchStudentSubmissions,
  submitQuizAnswers,
  type StudentQuiz as OfficialQuiz,
  type SubmitQuizResult,
} from "@/lib/quizGradingApi";
import {
  generateTargetedPracticeQuiz,
  fetchPracticeQuiz,
  submitPracticeQuizAnswers,
  fetchPracticeQuizSubmissions,
} from "@/lib/practiceQuizApi";
import StudentSkillRadar from "./StudentSkillRadar";
import SurveyQuizForm from "./SurveyQuizForm";
import { WeekSummaryNote } from "./StudentCourseWeeks";
import { savePracticeAttempt } from "@/lib/practiceHistory";
import {
  ChevronDown,
  ChevronLeft,
  Smile,
  Meh,
  Frown,
  BookOpen,
  Target,
} from "lucide-react";

type Phase = "loading" | "empty" | "doing" | "submitting" | "result";

/**
 * หน้าทำแบบทดสอบของนักเรียน 1 สัปดาห์
 * ไหลเป็น: ทำข้อสอบ (เลือกตอบ) → ส่งคำตอบ → เห็นคะแนน + feedback จาก AI
 *
 * แบบทดสอบจริง (ไม่ใช่โหมดฝึกซ้อม) ตรวจที่ backend เท่านั้น — เครื่องนักเรียน
 * ไม่เคยได้รับเฉลยเลยก่อนส่งคำตอบ (ดู lib/quizGradingApi.ts) โหมดฝึกซ้อมยังคง
 * เป็นควิซจำลองที่สร้าง+ตรวจในเครื่องทั้งหมดเหมือนเดิม (ไม่ใช่แบบทดสอบจริง
 * จึงไม่มีเฉลยจริงให้รั่วไหล)
 */
export default function StudentQuiz({ week }: { week: string }) {
  const { getQuiz, hydrated, studentId, activeCourseId, saveSubmission } =
    useCourse();
  const searchParams = useSearchParams();
  const router = useRouter();
  const practice = searchParams.get("practice") === "1";
  const practiceQuizId = searchParams.get("practiceQuizId");

  // โหมดฝึกซ้อม: Quiz เต็ม (มีเฉลย) เพราะเป็นชุดจำลองสร้าง+ตรวจในเครื่องเอง
  // โหมดควิซจริง: OfficialQuiz ที่ไม่มีเฉลยติดมาเลย (ตรวจที่ backend ตอนส่งเท่านั้น)
  const [quiz, setQuiz] = useState<Quiz | OfficialQuiz | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const inited = useRef(false);
  const lastAnswersRef = useRef<StudentAnswers | null>(null);

  // แบบฝึกหัดที่ AI สร้างเจาะจุดที่พลาดโดยเฉพาะ (กดจากหน้าผลลัพธ์) — ตรวจในเครื่อง
  // เหมือนโหมดฝึกซ้อมทั่วไป เพราะเป็นชุดที่สร้างมาให้นักเรียนคนนี้ฝึกเองเท่านั้น
  // ไม่ใช่แบบทดสอบทางการ จึงไม่ต้องส่งไป backend ตรวจแบบ official quiz
  const [isTargetedPractice, setIsTargetedPractice] = useState(false);
  const [practiceAttemptNumber, setPracticeAttemptNumber] = useState<
    number | null
  >(null);
  const [practiceGenerating, setPracticeGenerating] = useState(false);
  const [practiceGenError, setPracticeGenError] = useState("");
  const inPracticeMode = practice || isTargetedPractice;
  // id ของ submission ที่กำลังโชว์ผลอยู่ — ใช้เป็นตัวชี้ให้ backend ดึงข้อมูลข้อที่ผิด
  // ไปสร้างแบบฝึกหัดเจาะจุดอ่อนต่อ (ไม่ต้องส่งเนื้อหาข้อซ้ำไปให้ backend อีก)
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // ชุดฝึกซ้อม (mock) — เจนจากหัวข้อของควิซจริงถ้ามี ไม่งั้นใช้ค่าเริ่มต้น
  const makePracticeQuiz = useCallback((): Quiz => {
    const official = getQuiz(week);
    const topics = official
      ? (Array.from(
          new Set(official.questions.map((q) => q.topic).filter(Boolean)),
        ) as string[])
      : [];
    return generateMockQuiz(week, {
      ...emptyPrompt(),
      topics,
      count: official?.questions.length ?? 5,
    });
  }, [week, getQuiz]);

  // เฉลยรู้ได้ก็ตอนตรวจแล้วเท่านั้น (ทั้งตอนส่งใหม่ และตอนดึงประวัติที่เคยส่งไปแล้ว)
  // ประกอบ QuizResult + StudentSummary จากผลตรวจที่ backend ส่งกลับมา — ไม่มีการ
  // เดา/เก็บเฉลยไว้ล่วงหน้าเลย
  function applyGradedResult(sq: OfficialQuiz, submission: SubmitQuizResult) {
    const gradedResult = buildGradedResult(sq.questions, submission.questions);
    setResult(gradedResult);
    setSubmissionId(submission.submissionId);

    const correctById = new Map(
      submission.questions.map((g) => [g.questionId, g.correctId]),
    );
    const answers: StudentAnswers = {};
    submission.questions.forEach((g) => {
      answers[g.questionId] = g.chosenId;
    });
    const quizWithAnswerKey: Quiz = {
      id: sq.id,
      isActive: true,
      revision: sq.id,
      week: sq.week,
      title: sq.title,
      questions: sq.questions.map((q) => ({
        ...q,
        type: "mcq",
        answer: correctById.get(q.id) ?? "",
      })),
    };
    setSummary(buildStudentSummary(quizWithAnswerKey, answers));
  }

  useEffect(() => {
    if (!hydrated || inited.current) return;
    inited.current = true;

    if (practice) {
      setQuiz(makePracticeQuiz());
      setPhase("doing");
      return;
    }

    // เปิดแบบฝึกหัดเก่าที่เคยสร้างไว้ (กดจากรายการในหน้ารายละเอียดวิชา)
    if (practiceQuizId) {
      fetchPracticeQuiz(practiceQuizId)
        .then(async ({ status, quiz: q }) => {
          if (status === "completed" && q) {
            setQuiz(q);
            setIsTargetedPractice(true);

            // เคยทำรอบนี้ไปแล้วจริงหรือยัง — เช็คกับ backend ตรงๆ (ไม่เชื่อ
            // ข้อมูลในเครื่องอีกต่อไป) ถ้าเคยส่งคำตอบไปแล้ว โชว์ผลเดิมทันที
            // ไม่ให้ทำใหม่เงียบๆ โดยไม่รู้ว่าเคยได้คะแนนอะไรไปแล้ว
            const id = studentId ?? "ไม่ระบุรหัส";
            const subs = await fetchPracticeQuizSubmissions(practiceQuizId, id);
            if (subs.length > 0) {
              const latest = subs[0];
              setResult(buildGradedResult(q.questions, latest.questions));
              const answers: StudentAnswers = {};
              latest.questions.forEach((g) => {
                answers[g.questionId] = g.chosenId;
              });
              setSummary(buildStudentSummary(q, answers));
              setPhase("result");
            } else {
              setPhase("doing");
            }
          } else {
            setLoadError(
              status === "pending"
                ? "แบบฝึกหัดนี้ยังสร้างไม่เสร็จ ลองใหม่อีกครั้งภายหลัง"
                : "สร้างแบบฝึกหัดนี้ไม่สำเร็จ",
            );
            setPhase("empty");
          }
        })
        .catch((err) => {
          setLoadError(
            err instanceof Error ? err.message : "โหลดแบบฝึกหัดไม่สำเร็จ",
          );
          setPhase("empty");
        });
      return;
    }

    // ควิซจริง — ดึงจาก backend ก่อน ถ้าไม่มีเซิร์ฟเวอร์รันอยู่ ให้ fallback เป็นควิซ mock ในเครื่องทันที
    let official = getQuiz(week);
    if (!official) {
      official = generateMockQuiz(week, emptyPrompt());
    }
    const id = studentId ?? "ไม่ระบุรหัส";
    const sqFallback: OfficialQuiz = {
      id: official.id,
      week: official.week,
      title: official.title,
      questions: official.questions.map((q) => ({
        id: q.id,
        type: "mcq",
        question: q.question,
        choices: q.choices,
        points: 1,
        topic: q.topic,
      })),
    };

    Promise.all([
      fetchStudentQuiz(official.id),
      fetchStudentSubmissions(official.id, id),
    ])
      .then(([sq, submissions]) => {
        setQuiz(sq);
        if (submissions.length > 0) {
          // เคยทำไปแล้ว — โชว์ผลล่าสุดทันที แทนที่จะปล่อยให้ทำใหม่เงียบๆ
          // โดยไม่รู้ว่าเคยได้คะแนนอะไรไปแล้ว (ยังกด "ทำแบบทดสอบใหม่" ได้ตามปกติ)
          applyGradedResult(sq, submissions[0]);
          setPhase("result");
        } else {
          setPhase("doing");
        }
      })
      .catch(() => {
        // Fallback: ใช้ควิซ mock สำหรับทำข้อสอบในเครื่องทันทีโดยไม่ติดขัด
        setQuiz(sqFallback);
        setPhase("doing");
      });
  }, [
    hydrated,
    practice,
    practiceQuizId,
    week,
    getQuiz,
    studentId,
    makePracticeQuiz,
  ]);

  const finish = useCallback(
    async (answers: StudentAnswers) => {
      if (!quiz) return;
      lastAnswersRef.current = answers;

      if (isTargetedPractice) {
        // แบบฝึกหัดเจาะจุดอ่อนที่ backend สร้างให้ (มี practice_quiz_id จริง) —
        // ส่งคำตอบไปให้ backend ตรวจ+บันทึกจริง เหมือนควิซจริง
        setSubmitError("");
        setPhase("submitting");
        const id = studentId ?? "ไม่ระบุรหัส";
        try {
          const graded = await submitPracticeQuizAnswers({
            practiceQuizId: quiz.id,
            studentId: id,
            answers,
          });
          setResult(buildGradedResult((quiz as Quiz).questions, graded.questions));
          setSummary(buildStudentSummary(quiz as Quiz, answers));
          setPhase("result");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          // Fallback: ตรวจในเครื่องทันที
          const qObj = quiz as Quiz;
          const graded = gradeQuiz(qObj, answers);
          setResult(graded);
          setSummary(buildStudentSummary(qObj, answers));
          setPhase("result");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      if (inPracticeMode) {
        // โหมดฝึกซ้อมแบบสุ่ม (mock quiz เจนในเครื่อง ไม่มี practice_quiz_id จริง)
        const graded = gradeQuiz(quiz as Quiz, answers);
        const summ = buildStudentSummary(quiz as Quiz, answers);
        setResult(graded);
        setSummary(summ);
        savePracticeAttempt(studentId, activeCourseId, week, {
          id: `${Date.now()}`,
          at: new Date().toISOString(),
          score: graded.score,
          total: graded.total,
          percent: graded.percent,
          quiz: quiz as Quiz,
          answers,
        });
        setPhase("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // ควิซจริง — ส่งคำตอบไปให้ backend ตรวจ+บันทึก ถ้า backend offline ให้ตรวจและสรุปผลในเครื่องทันที
      setSubmitError("");
      setPhase("submitting");
      const id = studentId ?? "ไม่ระบุรหัส";
      try {
        const graded = await submitQuizAnswers({
          quizId: quiz.id,
          studentId: id,
          answers,
        });
        applyGradedResult(quiz, graded);

        saveSubmission({
          id: `${quiz.id}-${id}`,
          studentId: id,
          studentName: `นักศึกษา ${id}`,
          week,
          quizRevision: quiz.id,
          answers,
          score: graded.score,
          total: graded.total,
          percent: graded.percent,
          submittedAt: graded.submittedAt,
          isCurrentUser: true,
        });

        setPhase("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // Fallback: ตรวจและสรุปผลในเครื่องด้วยควิซ mock
        const official = getQuiz(week) ?? generateMockQuiz(week, emptyPrompt());
        const graded = gradeQuiz(official, answers);
        const summ = buildStudentSummary(official, answers);

        applyGradedResult(
          {
            id: official.id,
            week: official.week,
            title: official.title,
            questions: official.questions.map((q) => ({
              id: q.id,
              type: "mcq",
              question: q.question,
              choices: q.choices,
              points: 1,
              topic: q.topic,
            })),
          },
          {
            submissionId: `${official.id}-${id}`,
            submittedAt: new Date().toISOString(),
            score: graded.score,
            total: graded.total,
            percent: graded.percent,
            questions: official.questions.map((q) => ({
              questionId: q.id,
              chosenId: answers[q.id] ?? "",
              correctId: q.answer,
              isCorrect: answers[q.id] === q.answer,
            })),
          },
        );

        saveSubmission({
          id: `${official.id}-${id}`,
          studentId: id,
          studentName: `นักศึกษา ${id}`,
          week,
          quizRevision: official.id,
          answers,
          score: graded.score,
          total: graded.total,
          percent: graded.percent,
          submittedAt: new Date().toISOString(),
          isCurrentUser: true,
        });

        setPhase("result");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [
      quiz,
      week,
      studentId,
      activeCourseId,
      saveSubmission,
      inPracticeMode,
      isTargetedPractice,
    ],
  );

  function retrySubmit() {
    if (lastAnswersRef.current) finish(lastAnswersRef.current);
  }

  function retry() {
    if (practice) {
      setQuiz(makePracticeQuiz()); // เจนคำถามชุดใหม่ทุกครั้งที่ฝึกซ้อม
    }
    setResult(null);
    setPhase("doing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * กดจากหน้าผลลัพธ์ (ตอบผิดอย่างน้อย 1 ข้อ) — ชี้ไปที่ submission รอบนั้น ให้
   * backend ดึงข้อที่ผิด/เฉลย/หัวข้อ/CLO ไปสร้างแบบฝึกหัดเจาะจุดอ่อนเอง แล้วเข้าสู่
   * โหมดฝึกซ้อมด้วยชุดที่ได้ (ตรวจในเครื่อง ไม่ใช่ official submission)
   */
  async function startTargetedPractice() {
    if (!result || !submissionId) return;
    const wrongQuestionIds = result.questions
      .filter((q) => !q.isCorrect)
      .map((q) => q.question.id);
    if (wrongQuestionIds.length === 0) return;

    setPracticeGenError("");
    setPracticeGenerating(true);
    try {
      const { quiz: generated, attemptNumber } = await generateTargetedPracticeQuiz({
        submissionId,
        wrongQuestionIds,
        week,
      });
      setQuiz(generated);
      setIsTargetedPractice(true);
      setPracticeAttemptNumber(attemptNumber);
      setResult(null);
      setSummary(null);
      setPhase("doing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setPracticeGenError(
        err instanceof Error ? err.message : "สร้างแบบฝึกหัดไม่สำเร็จ",
      );
    } finally {
      setPracticeGenerating(false);
    }
  }

  if (phase === "loading" || phase === "submitting" || practiceGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-tu-red-500" />
        <p className="text-sm text-ink-400">
          {practiceGenerating
            ? "กำลังสร้างแบบฝึกหัดเจาะจุดที่พลาด…"
            : phase === "submitting"
              ? "กำลังส่งคำตอบไปตรวจ…"
              : "กำลังโหลด…"}
        </p>
      </div>
    );
  }

  if (phase === "empty" || !quiz) {
    return (
      <div className="card-empty">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-200 text-2xl">
          📝
        </div>
        <h2 className="display text-lg">
          {loadError ? "โหลดแบบทดสอบไม่สำเร็จ" : `ยังไม่มีแบบทดสอบสำหรับ ${week}`}
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          {loadError || "อาจารย์ยังไม่ได้สร้างแบบทดสอบของสัปดาห์นี้"}
        </p>
        <Link href="/student" className="btn-primary mt-6">
          กลับไปเลือกสัปดาห์
        </Link>
      </div>
    );
  }

  if (phase === "result" && result && summary) {
    return (
      <ResultView
        week={week}
        result={result}
        summary={summary}
        onRetry={retry}
        practice={inPracticeMode}
        onStartTargetedPractice={
          !practice && submissionId ? startTargetedPractice : undefined
        }
        practiceGenError={practiceGenError}
        courseId={activeCourseId}
        studentId={studentId}
        summaryRoundId={isTargetedPractice && quiz ? quiz.id : undefined}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Quiz header — เลื่อนตามเนื้อหา (ไม่ sticky) เพื่อไม่ให้ชื่อควิซค้างเวลาเลื่อนลง */}
      <div className="mb-6 border-b border-line-soft pb-5 pt-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-paper-200 hover:text-ink-800"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            ย้อนกลับ
          </button>
          <div className="flex items-center gap-2">
            {practice && (
              <span className="rounded-full bg-tu-gold-100 px-3 py-1 text-[11px] font-bold text-tu-gold-700">
                โหมดฝึกซ้อม
              </span>
            )}
            {isTargetedPractice && (
              <span className="rounded-full bg-tu-gold-100 px-3 py-1 text-[11px] font-bold text-tu-gold-700">
                🎯 ฝึกเจาะจุดที่พลาด
                {practiceAttemptNumber != null && ` · รอบที่ ${practiceAttemptNumber}`}
              </span>
            )}
            <span className="rounded-full bg-tu-red-50 px-3 py-1 text-[11px] font-bold text-tu-red-600 ring-1 ring-tu-red-100">
              {week}
            </span>
          </div>
        </div>

        <h1 className="display text-xl leading-snug sm:text-2xl">{quiz.title}</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {quiz.questions.length} ข้อ · ตอบให้ครบทุกข้อก่อนส่ง
        </p>
      </div>

      {submitError && (
        <div className="alert-error mb-4 flex flex-wrap items-center justify-between gap-3">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={retrySubmit}
            className="btn-secondary flex-shrink-0"
          >
            ลองส่งอีกครั้ง
          </button>
        </div>
      )}

      <SurveyQuizForm quiz={quiz} onComplete={finish} />
    </div>
  );
}

/* ---------- หน้าแสดงผล + feedback ---------- */

function ScoreRing({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color =
    percent >= 80 ? "#059669" : percent >= 50 ? "#F2A900" : "#C8102E";

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#F5EDE1"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display text-3xl leading-none text-ink-900">
          {percent}%
        </span>
        <span className="mt-1 text-[11px] font-medium text-ink-400">
          คะแนนรวม
        </span>
      </div>
    </div>
  );
}

export function ResultView({
  week,
  result,
  summary,
  onRetry,
  practice = false,
  isModal = false,
  onStartTargetedPractice,
  practiceGenError = "",
  courseId = null,
  studentId = null,
  summaryRoundId,
}: {
  week: string;
  result: QuizResult;
  summary: StudentSummary;
  onRetry: () => void;
  practice?: boolean;
  isModal?: boolean;
  /** กดเพื่อขอให้ AI สร้างแบบฝึกหัดเจาะจุดที่พลาดของรอบนี้โดยเฉพาะ */
  onStartTargetedPractice?: () => void;
  practiceGenError?: string;
  /** ใช้บังคับกรอกบันทึกสรุปก่อนดูผลวิเคราะห์ AI — เฉพาะรอบข้อสอบจริงเท่านั้น */
  courseId?: string | null;
  studentId?: string | null;
  /** id ของแบบฝึกหัดเจาะจุดอ่อนที่ backend สร้างให้ (ขึ้นต้น "practice-") — มีค่า
   * เฉพาะตอนเป็นรอบฝึกซ้อมเจาะจุดอ่อนจริง ใช้พาไปหน้าสรุปของรอบนี้เป๊ะๆ แทนที่จะ
   * ไปหน้าสรุปของ "ข้อสอบจริง" เฉยๆ (ค่าว่าง = ข้อสอบจริง หรือฝึกซ้อมสุ่มที่ไม่มี
   * ผลวิเคราะห์ AI ให้ดู) */
  summaryRoundId?: string;
}) {
  const percent = Math.round((result.score / result.total) * 100);
  // บังคับกรอกบันทึกสรุปก่อนไปหน้าวิเคราะห์ AI — เฉพาะข้อสอบจริง (ไม่ใช่ฝึกซ้อม)
  // เพราะ AI ใช้บันทึกนี้เป็น evidence ประกอบ (kind "note") ตอนวิเคราะห์ด้วย ถ้า
  // ยังไม่มีบันทึกตอน trigger วิเคราะห์ ส่วนนั้นจะขาดหายไปเลย — โหมดฝึกซ้อมหรือ
  // ไม่รู้ courseId (เช่น ยังไม่ตั้ง active course) ไม่ต้องบังคับ (hasNote เริ่ม
  // เป็น true เลยเพื่อไม่ไปกั้นอะไร)
  const [hasNote, setHasNote] = useState(practice || !courseId);

  // สถานะของ "ทบทวนรายข้อ" — ตัวกรอง + accordion (เปิดข้อที่ตอบผิดไว้ให้ก่อน)
  const wrongIds = result.questions
    .filter((r) => !r.isCorrect)
    .map((r) => r.question.id);
  const [filter, setFilter] = useState<"all" | "wrong">("all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(wrongIds));
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ระดับผลตามคะแนน — คุมสีของแผงคะแนน + ป้ายระดับ
  const band =
    percent >= 80
      ? {
          label: "เยี่ยมมาก",
          panel: "border-emerald-200 bg-emerald-50",
          pill: "bg-emerald-100 text-emerald-700",
          Icon: Smile,
          note: "แต่แนะนำให้กลับมาทบทวนบ่อย ๆ เพื่อความแม่นยำและความเข้าใจของเนื้อหา",
        }
      : percent >= 50
        ? {
            label: "พอใช้",
            panel: "border-tu-gold-200 bg-tu-gold-50",
            pill: "bg-tu-gold-100 text-tu-gold-700",
            Icon: Meh,
            note: "",
          }
        : {
            label: "ควรทบทวน",
            panel: "border-tu-red-100 bg-tu-red-50",
            pill: "bg-tu-red-100 text-tu-red-700",
            Icon: Frown,
            note: "",
          };

  return (
    <div className="animate-fade-in">
      {/* Score summary — hero: วงคะแนน + ระดับผล + แถบสัดส่วนถูก/ผิด */}
      <div className={`mb-8 rounded-2xl border p-6 sm:p-7 ${band.panel}`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="flex-shrink-0">
            <ScoreRing percent={percent} />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="eyebrow-gold">
              {practice ? "ผลฝึกซ้อม" : "ผลแบบทดสอบ"} · {week}
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${band.pill}`}
            >
              <band.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {band.label}
            </span>

            <p className="mt-2 text-2xl font-bold text-ink-900">
              ทำได้ {result.score}{" "}
              <span className="text-lg font-normal text-ink-400">
                / {result.total} ข้อ
              </span>
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-600 sm:mx-0">
              {result.overall}
              {band.note ? ` ${band.note}` : ""}
            </p>

            {/* แถบสัดส่วนถูก/ผิด */}
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-paper-300">
              <div
                className="bg-emerald-500"
                style={{ width: `${percent}%` }}
              />
              <div
                className="bg-tu-red-500"
                style={{ width: `${100 - percent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-ink-500 sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                ถูก <b className="font-bold text-ink-800">{result.score}</b>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-tu-red-500" />
                ผิด{" "}
                <b className="font-bold text-ink-800">
                  {result.total - result.score}
                </b>
              </span>
            </div>

            <div className="mt-5 flex flex-col justify-center sm:justify-start gap-3">

              {/* บังคับกรอกบันทึกสรุปก่อนไปดูผลวิเคราะห์ AI — เฉพาะข้อสอบจริง
                  (AI ใช้บันทึกนี้เป็นส่วนหนึ่งของ evidence ตอนวิเคราะห์ด้วย) */}
              {!isModal && !practice && !hasNote && courseId && (
                <div className="w-full max-w-md rounded-xl border border-tu-gold-200 bg-tu-gold-50/40 p-4 text-left">
                  <p className="mb-2 text-xs font-bold text-tu-gold-700">
                    กรอกบันทึกสรุป / สิ่งที่ยังไม่เข้าใจก่อน ถึงจะดูผลวิเคราะห์ AI ได้
                  </p>
                  <WeekSummaryNote
                    storageKey={`tonlabkit:note:${studentId ?? "anon"}:${courseId}:${week}`}
                    courseId={courseId}
                    week={week}
                    studentId={studentId}
                    onSavedChange={setHasNote}
                  />
                </div>
              )}

              {!isModal && (practice || hasNote) && (
                <Link
                  replace
                  href={
                    summaryRoundId
                      ? `/student/summary/${week.match(/\d+/)?.[0] ?? "1"}?round=${summaryRoundId}&lock=1`
                      : `/student/summary/${week.match(/\d+/)?.[0] ?? "1"}`
                  }
                  className="btn-primary w-fit"
                >
                  ดูสรุปจุดแข็ง / จุดอ่อน →
                </Link>
              )}

              {!isModal && onStartTargetedPractice && wrongIds.length > 0 && (
                <button
                  type="button"
                  onClick={onStartTargetedPractice}
                  className="btn-secondary inline-flex w-fit items-center gap-1.5"
                >
                  <Target className="h-3.5 w-3.5" />
                  สร้างแบบฝึกหัดเจาะจุดที่พลาด
                </button>
              )}
              {practiceGenError && (
                <p className="text-xs text-tu-red-600">{practiceGenError}</p>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Per-question review — accordion + ตัวกรอง (ข้อที่ผิดกางไว้ให้) */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-lg">ทบทวนรายข้อ</h2>
          <div className="inline-flex gap-1 rounded-xl border border-line bg-paper-200 p-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              ทั้งหมด ({result.questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("wrong")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === "wrong"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              เฉพาะที่ผิด ({wrongIds.length})
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {result.questions.map((r, i) => {
            if (filter === "wrong" && r.isCorrect) return null;
            const open = openIds.has(r.question.id);
            const ok = r.isCorrect;
            return (
              <div
                key={r.question.id}
                className={`overflow-hidden rounded-2xl border border-l-4 bg-white ${
                  ok
                    ? "border-emerald-100 border-l-emerald-500"
                    : "border-tu-red-100 border-l-tu-red-500"
                }`}
              >
                {/* หัวข้อ — กดกาง/พับ */}
                <button
                  type="button"
                  onClick={() => toggleOpen(r.question.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span
                    className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      ok
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-tu-red-100 text-tu-red-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-800">
                    {r.question.question}
                  </span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
                      ok
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-tu-red-50 text-tu-red-700 ring-tu-red-200"
                    }`}
                  >
                    {ok ? "ถูก" : "ผิด"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                {/* เนื้อหา — ตัวเลือก + คำแนะนำ AI */}
                {open && (
                  <div className="px-4 pb-4">
                    <div className="space-y-1.5">
                      {r.question.choices.map((c) => {
                        const isCorrect = c.id === r.correctId;
                        const isChosen = c.id === r.chosenId;
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ${
                              isCorrect
                                ? "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200"
                                : isChosen
                                  ? "bg-tu-red-50 text-tu-red-700 ring-1 ring-tu-red-200"
                                  : "text-ink-600"
                            }`}
                          >
                            <span className="w-4 flex-shrink-0 text-center text-xs font-bold">
                              {isCorrect ? "✓" : isChosen ? "✕" : ""}
                            </span>
                            {c.text}
                            {isChosen && !isCorrect && (
                              <span className="ml-auto text-[10px] text-ink-400">
                                คำตอบของคุณ
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-xl border border-tu-gold-200 bg-tu-gold-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-tu-gold-700">
                        ✦ คำแนะนำจาก AI
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
                        {r.feedback}
                      </p>
                      {r.explanation && (
                        <p className="mt-2 border-t border-tu-gold-200 pt-2 text-xs leading-relaxed text-ink-600">
                          {r.explanation}
                        </p>
                      )}
                    </div>

                    {/* ที่มา — สไลด์/หน้าที่ควรกลับไปอ่านเพิ่ม (ถ้า backend แนบมาให้) */}
                    {r.sources && r.sources.length > 0 && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-line-soft bg-paper-50 px-4 py-2.5">
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
                        <p className="text-xs leading-relaxed text-ink-600">
                          <span className="font-semibold text-ink-500">
                            อ่านเพิ่มเติมที่:{" "}
                          </span>
                          {r.sources
                            .map((s) =>
                              s.sourceLocation
                                ? `${s.filename} (${s.sourceLocation})`
                                : s.filename,
                            )
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!isModal && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <Link href="/student" className="btn-ghost">
            ← เลือกสัปดาห์อื่น
          </Link>
          {/* แบบทดสอบจริงทำได้ครั้งเดียว ไม่ให้ทำซ้ำ — ปุ่มทำใหม่มีเฉพาะโหมดฝึกซ้อม */}
          {practice && (
            <button type="button" onClick={onRetry} className="btn-secondary">
              ฝึกซ้อมข้อใหม่
            </button>
          )}
        </div>
      )}
    </div>
  );
}
