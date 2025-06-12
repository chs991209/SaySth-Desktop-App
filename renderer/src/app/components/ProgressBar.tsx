import { useProcess } from "../../../context/process";

interface ProgressBarProps {
  className?: string;
}

export default function ProgressBar({ className = "" }: ProgressBarProps) {
  const { isProcessing, setIsProcessing } = useProcess();
  return (
    <div className={className}>
      <div className={isProcessing ? "progress" : ""} />
    </div>
  );
}
