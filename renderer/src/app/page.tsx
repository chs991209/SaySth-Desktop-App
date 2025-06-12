"use client";

import styles from "./page.module.css";
import ProgressBar from "./components/ProgressBar";
import UserInput from "./components/UserInput";

export default function Home() {
  return (
    <div className={styles.container}>
      <ProgressBar className={styles.progress_container} />
      <div className={styles.input_group}>
        <UserInput
          classNames={{
            input: styles.user_input,
            micIcon: styles.mic_icon,
          }}
        />
      </div>
    </div>
  );
}
