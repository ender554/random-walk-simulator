import { createContext } from 'react';

// The current tool's slug, set by ToolPage, so shared pieces (Next experiment, Challenge) know where they are.
export const ToolSlug = createContext(null);
