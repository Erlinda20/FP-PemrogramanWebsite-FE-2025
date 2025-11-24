import api from "@/api/axios";
import toast from "react-hot-toast";

export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  questionText: string;
  questionImages?: File | null;
  answers: Answer[];
}

export interface Settings {
  isPublishImmediately: boolean;
  isQuestionRandomized: boolean;
  isAnswerRandomized: boolean;
  scorePerQuestion: number;
}

export interface QuizPayload {
  title: string;
  description?: string;
  thumbnail: File;
  questions: Question[];
  settings: Settings;
}

interface QuizQuestion {
  question_text: string;
  question_image_array_index?: number;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
}

export const useCreateQuiz = async (payload: QuizPayload) => {
  try {
    const formData = new FormData();

    formData.append("thumbnail_image", payload.thumbnail);
    formData.append("name", payload.title);
    if (payload.description)
      formData.append("description", payload.description);

    formData.append(
      "is_publish_immediately",
      String(payload.settings.isPublishImmediately),
    );
    formData.append(
      "is_question_randomized",
      String(payload.settings.isQuestionRandomized),
    );
    formData.append(
      "is_answer_randomized",
      String(payload.settings.isAnswerRandomized),
    );
    formData.append(
      "score_per_question",
      String(payload.settings.scorePerQuestion),
    );

    const allFiles: File[] = [];
    payload.questions.forEach((q) => {
      if (q.questionImages) allFiles.push(q.questionImages);
    });

    allFiles.forEach((file) => formData.append("files_to_upload", file));

    const questionsPayload: QuizQuestion[] = payload.questions.map((q) => ({
      question_text: q.questionText,
      answers: q.answers.map((a) => ({
        answer_text: a.text,
        is_correct: a.isCorrect,
      })),
      question_image_array_index: q.questionImages
        ? allFiles.indexOf(q.questionImages)
        : undefined,
    }));

    formData.append("questions", JSON.stringify(questionsPayload));

    const res = await api.post("/api/game/game-type/quiz", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (err: unknown) {
    console.error("Gagal membuat quiz:", err);
    toast.error("Gagal membuat quiz. Silakan coba lagi.");
    throw err;
  }
};
