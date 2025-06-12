"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type IProcessType = {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
};

const ProcessContext = createContext<IProcessType | undefined>(undefined);

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  return (
    <ProcessContext.Provider value={{ isProcessing, setIsProcessing }}>
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcess() {
  const context = useContext(ProcessContext);
  if (!context)
    throw new Error("Process must be used within a ProcessProvider");
  return context;
}
