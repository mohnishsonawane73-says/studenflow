export interface SolutionData {
  solution: string;
  explanation: string; // The "anime style" explanation
  rawMarkdown: string; // Combined for display
}

export interface QuestionState {
  text: string;
  image: File | null;
  imagePreview: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}