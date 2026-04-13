// src/lib/storage.ts
const LOCAL_QUIZ_KEY = 'samarpan_practice_quizzes';

export interface LocalQuiz {
  _id: string;
  title: string;
  topic: string;
  questions: any[];
  aiGenerated: boolean;
  tags: string[];
  createdAt: string;
  isLocal: boolean; 
}

/**
 * Save a quiz to the browser's local storage.
 */
export const saveLocalQuiz = (quiz: any): void => {
  if (typeof window === 'undefined') return;
  
  const existingQuizzes = getLocalQuizzes();
  const newQuiz = { 
    ...quiz, 
    isLocal: true,
    createdAt: quiz.createdAt || new Date().toISOString()
  };
  
  const updated = [newQuiz, ...existingQuizzes];
  localStorage.setItem(LOCAL_QUIZ_KEY, JSON.stringify(updated));
};

/**
 * Retrieve all practice quizzes from local storage.
 */
export const getLocalQuizzes = (): LocalQuiz[] => {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(LOCAL_QUIZ_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing local quizzes", e);
    return [];
  }
};

/**
 * Delete a specific local quiz.
 */
export const deleteLocalQuiz = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  const existing = getLocalQuizzes();
  const updated = existing.filter(q => q._id !== id);
  localStorage.setItem(LOCAL_QUIZ_KEY, JSON.stringify(updated));
};

/**
 * Wipe all practice data.
 */
export const clearLocalQuizzes = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_QUIZ_KEY);
};
