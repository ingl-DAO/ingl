export interface LanguageContextProviderProps {
    children: JSX.Element;
}

export type Action = { type: "USE_ENGLISH" } | { type: "USE_FRENCH" };

export interface Language {
  activeLanguage: string;
  languageDispatch: React.Dispatch<Action>;
}

export type State = Language;
