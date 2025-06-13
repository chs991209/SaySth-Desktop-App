"use client";
import styles from "./ProgressBar.module.css";
import { useProcess } from "../../../context/process";

export default function ProgressBar() {
  const { isProcessing, setIsProcessing } = useProcess();
  return (
    <div className={styles.progress_container}>
      <div
        className={`${styles.progress_bar} ${isProcessing ? "progress" : ""}`}
      />
    </div>
  );
}
