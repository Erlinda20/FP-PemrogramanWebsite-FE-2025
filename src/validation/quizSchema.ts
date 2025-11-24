import { z } from "zod";

export const answerSchema = z.object({
  text: z.string().min(1, "Answer cannot be empty"),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  questionText: z.string().min(3, "Question text too short"),
  questionImages: z.union([z.instanceof(File), z.null()]),
  answers: z
    .array(answerSchema)
    .length(4, "Each question must have 4 answers")
    .refine(
      (answers) => answers.some((a) => a.isCorrect),
      "At least one answer must be correct on each question",
    ),
});

export const quizSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().optional(),
  thumbnail: z.instanceof(File),
  questions: z.array(questionSchema).min(1, "At least one question required"),
  settings: z.object({
    isPublishImmediately: z.boolean(),
    isQuestionRandomized: z.boolean(),
    isAnswerRandomized: z.boolean(),
    scorePerQuestion: z.number().min(1, "Score must be at least 1"),
  }),
});

export type QuizForm = z.infer<typeof quizSchema>;
