import { createContext } from "react";

import {Language} from './language.interface'

const LanguageContext = createContext<Language>({
  activeLanguage: "en",
  languageDispatch: () => null,
});

export default LanguageContext;
