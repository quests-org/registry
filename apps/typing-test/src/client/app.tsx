import { useState, useEffect, useRef } from "react";

interface Stats {
  wpm: number;
  accuracy: number;
  time: number;
  charactersTyped: number;
  errors: number;
}

const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice. The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice. The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is commonly used for typing practice.",
  "Programming is the art of telling another human being what one wants the computer to do. It requires patience, logic, and attention to detail. Programming is the art of telling another human being what one wants the computer to do. It requires patience, logic, and attention to detail. Programming is the art of telling another human being what one wants the computer to do.",
  "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole. In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole.",
  "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune. To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune. To be or not to be, that is the question.",
  "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief. It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief.",
];

const TEST_DURATION = 30; // 30 seconds

function App() {
  const [currentText, setCurrentText] = useState(sampleTexts[0]);
  const [userInput, setUserInput] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [isComplete, setIsComplete] = useState(false);
  const [stats, setStats] = useState<Stats>({
    wpm: 0,
    accuracy: 0,
    time: 0,
    charactersTyped: 0,
    errors: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userInput.length === 1 && startTime === null) {
      setStartTime(Date.now());
      startTimer();
    }
  }, [userInput.length, startTime]);

  useEffect(() => {
    if (timeLeft === 0 && !isComplete && startTime) {
      setIsComplete(true);
      calculateFinalStats();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isComplete, startTime]);

  useEffect(() => {
    setCurrentCharIndex(userInput.length);
  }, [userInput]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const calculateFinalStats = () => {
    if (!startTime) return;

    const timeElapsed = TEST_DURATION; // Always 30 seconds for timer-based test
    const timeInMinutes = timeElapsed / 60;
    const wordsTyped = userInput.length / 5; // Standard: 5 characters = 1 word
    const wpm = Math.round(wordsTyped / timeInMinutes);

    let errors = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] !== currentText[i]) {
        errors++;
      }
    }

    const accuracy =
      userInput.length > 0
        ? Math.round(((userInput.length - errors) / userInput.length) * 100)
        : 0;

    setStats({
      wpm,
      accuracy,
      time: timeElapsed,
      charactersTyped: userInput.length,
      errors,
    });
  };

  const getCurrentWPM = () => {
    if (!startTime || userInput.length === 0) return 0;
    const timeElapsed = TEST_DURATION - timeLeft; // Time elapsed in seconds
    if (timeElapsed === 0) return 0;
    const timeInMinutes = timeElapsed / 60;
    const wordsTyped = userInput.length / 5;
    return Math.round(wordsTyped / timeInMinutes);
  };

  const getCurrentAccuracy = () => {
    if (userInput.length === 0) return 100;
    let errors = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] !== currentText[i]) {
        errors++;
      }
    }
    return Math.round(((userInput.length - errors) / userInput.length) * 100);
  };

  const getCharacterClass = (index: number) => {
    if (index < userInput.length) {
      return userInput[index] === currentText[index]
        ? "text-green-500"
        : "text-red-500 bg-red-100";
    } else if (index === currentCharIndex) {
      return "bg-blue-500 text-white animate-pulse";
    }
    return "text-gray-400";
  };

  const restartTest = () => {
    // Always pick a new random text
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    setCurrentText(sampleTexts[randomIndex]);

    // Reset all state
    setUserInput("");
    setCurrentCharIndex(0);
    setStartTime(null);
    setTimeLeft(TEST_DURATION);
    setIsComplete(false);
    setStats({
      wpm: 0,
      accuracy: 0,
      time: 0,
      charactersTyped: 0,
      errors: 0,
    });
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComplete) return;

    if (e.key === "Backspace") {
      if (userInput.length > 0) {
        setUserInput(userInput.slice(0, -1));
      }
    } else if (e.key.length === 1) {
      if (userInput.length < currentText.length) {
        setUserInput(userInput + e.key);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-900 text-white p-8"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: "none" }}
    >
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Typing Test</h1>
          <p className="text-gray-400">30-second typing test</p>
        </header>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-8 text-lg">
              <div>
                <span className="text-gray-400">Time:</span>
                <span
                  className={`ml-2 font-mono font-bold ${
                    timeLeft <= 5 && startTime
                      ? "text-red-400"
                      : "text-blue-400"
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
              <div>
                <span className="text-gray-400">WPM:</span>
                <span className="ml-2 text-yellow-400 font-mono font-bold">
                  {isComplete ? stats.wpm : getCurrentWPM()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Accuracy:</span>
                <span className="ml-2 text-green-400 font-mono font-bold">
                  {isComplete ? stats.accuracy : getCurrentAccuracy()}%
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={restartTest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Restart Test
              </button>
            </div>
          </div>

          <div className="text-xl leading-relaxed font-mono mb-4 p-4 bg-gray-700 rounded min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500">
            {currentText.split("").map((char, index) => (
              <span key={index} className={getCharacterClass(index)}>
                {char}
              </span>
            ))}
          </div>

          {!startTime && !isComplete && (
            <div className="text-center text-gray-400 text-lg">
              Click here and start typing to begin the 30-second test
            </div>
          )}

          {isComplete && (
            <div className="text-center text-gray-400 text-lg">
              Test completed! Click "Restart Test" to try again with new text.
            </div>
          )}
        </div>

        {isComplete && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              30-Second Test Complete!
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.wpm}
                </div>
                <div className="text-sm text-gray-400">WPM</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-green-400">
                  {stats.accuracy}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-blue-400">
                  {stats.time}s
                </div>
                <div className="text-sm text-gray-400">Time</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-red-400">
                  {stats.errors}
                </div>
                <div className="text-sm text-gray-400">Errors</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
