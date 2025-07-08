import React, { useState, useEffect } from "react";
import { allQuestions } from "./Components/allQuestions";
import { useTimer } from "react-timer-hook";
import Confetti from "react-confetti";
import "./index.css";

const categories = ["General Knowledge", "Science", "History", "Geography", "Random"];

// Result Component

const Result = ({ score, totalQuestions, leaderboard, userAnswers, isDarkMode }) => {
  return (
    <div className={`result-container text-center ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-8 rounded-2xl shadow-lg`}>
      <h2 className="text-4xl font-bold mb-6">Quiz Results</h2>
      <p className="text-2xl mb-4">
        You scored {score} out of {totalQuestions}!
      </p>
      {score >= totalQuestions * 0.8 && (
        <p className="text-green-500 text-xl mb-4">🎉 Congratulations! You did an amazing job!</p>
      )}
     
      <div className="user-answers mt-8 text-left">
        <h3 className="text-3xl font-bold mb-4">📝 Your Answers</h3>
        <ul className="space-y-4">
          {userAnswers.map((answer, index) => (
            <li key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl">
              <p><strong>Q:</strong> {answer.question}</p>
              <p><strong>Your Answer:</strong> {answer.userAnswer}</p>
              <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [category, setCategory] = useState("General Knowledge");
  const [difficulty, setDifficulty] = useState("Easy");
  const [hintsUsed, ] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userName, setUserName] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state
  const [progress, setProgress] = useState(0);
  const [skippedQuestions, setSkippedQuestions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lifelines, setLifelines] = useState({
    fiftyFifty: 1,
    askAudience: 1,
  });
  const [userAnswers, setUserAnswers] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const { seconds, minutes, start, pause, restart, isRunning } = useTimer({
    expiryTimestamp: new Date().getTime() + timePerQuestion * 1000,
    onExpire: () => handleQuestionTimeout(),
  });

  
  useEffect(() => {
    const fetchQuestions = () => {
      let filteredQuestions = [];
      if (category === "Random") {
        filteredQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
      } else {
        filteredQuestions = allQuestions.filter(
          (question) => question.category === category
        );
      }
      const shuffledQuestions = filteredQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
    };

    if (isQuizStarted) {
      fetchQuestions();
    }
  }, [isQuizStarted, category]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartQuiz = () => {
    if (!userName) {
      alert("Please enter your name to start the quiz!");
      return;
    }
    setIsQuizStarted(true);
    start();
  };

  const handleAnswerOptionClick = (isCorrect) => {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = {
      question: currentQuestion.questionText,
      correctAnswer: currentQuestion.answerOptions.find((opt) => opt.isCorrect).answerText,
      userAnswer: isCorrect ? "Correct" : "Incorrect",
    };
    setUserAnswers([...userAnswers, userAnswer]);

    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      setTimeBonus(timeBonus + Math.max(0, 5 - seconds));
      setAnswerFeedback("Correct!");
      if (streak >= 3) {
        setScore(score + 1); // Bonus point for streaks
        setAnswerFeedback("Correct! Streak Bonus!");
      }
    } else {
      setStreak(0);
      setAnswerFeedback("Incorrect!");
    }

    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setTimeout(() => {
        setCurrentQuestionIndex(nextQuestion);
        setAnswerFeedback("");
        setProgress(((nextQuestion + 1) / questions.length) * 100);
        restart(new Date().getTime() + timePerQuestion * 1000);
      }, 1000);
    } else {
      setTimeout(() => {
        setShowResult(true);
        saveScore();
        if (score >= questions.length * 0.8) {
          setShowConfetti(true);
        }
      }, 1000);
    }
  };

  const handleQuestionTimeout = () => {
    setAnswerFeedback("Time's up!");
    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setTimeout(() => {
        setCurrentQuestionIndex(nextQuestion);
        setAnswerFeedback("");
        setProgress(((nextQuestion + 1) / questions.length) * 100);
        restart(new Date().getTime() + timePerQuestion * 1000);
      }, 1000);
    } else {
      setTimeout(() => {
        setShowResult(true);
        saveScore();
      }, 1000);
    }
  };

  const handlePauseResume = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleSkipQuestion = () => {
    setSkippedQuestions(skippedQuestions + 1);
    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setTimeout(() => {
        setCurrentQuestionIndex(nextQuestion);
        setAnswerFeedback("");
        setProgress(((nextQuestion + 1) / questions.length) * 100);
        restart(new Date().getTime() + timePerQuestion * 1000);
      }, 1000);
    } else {
      setTimeout(() => {
        setShowResult(true);
        saveScore();
      }, 1000);
    }
  };

  const handleFiftyFifty = () => {
    if (lifelines.fiftyFifty > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      const incorrectAnswers = currentQuestion.answerOptions
        .filter((opt) => !opt.isCorrect)
        .slice(0, 2);
      const updatedOptions = currentQuestion.answerOptions.filter(
        (opt) => !incorrectAnswers.includes(opt)
      );
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === currentQuestionIndex ? { ...q, answerOptions: updatedOptions } : q
        )
      );
      setLifelines((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
    }
  };

  const handleAskAudience = () => {
    if (lifelines.askAudience > 0) {
      const correctAnswer = questions[currentQuestionIndex].answerOptions.find(
        (opt) => opt.isCorrect
      );
      const audienceResponse = `Audience thinks: ${correctAnswer.answerText} (${Math.floor(
        Math.random() * 50 + 50
      )}%)`;
      setAnswerFeedback(audienceResponse);
      setLifelines((prev) => ({ ...prev, askAudience: prev.askAudience - 1 }));
    }
  };

  const saveScore = async () => {
    if (!userName) return;

    const quizResult = {
      userName,
      score,
      totalQuestions: questions.length,
      hintsUsed,
      skippedQuestions,
      timeBonus,
    };

    try {
      const response = await fetch("https://quiz-app-iyqt.onrender.com/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizResult),
      });

      if (!response.ok) {
        throw new Error("Failed to save score to the leaderboard.");
      }

      const data = await response.json();
      console.log("Backend Response:", data);

      const leaderboardResponse = await fetch("https://quiz-app-iyqt.onrender.com/leaderboard");
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  return (
    <div className={`quiz-container flex flex-col items-center p-8 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-all duration-300`}>
      {showConfetti && <Confetti />}
      <h1 className={`text-6xl font-extrabold mb-10 ${isDarkMode ? 'text-yellow-300' : 'text-gray-900'} text-center`}>
        Quiz Master
      </h1>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-5 right-5 py-2 px-4 rounded-full transition duration-300 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'} hover:bg-gray-600`}
      >
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>

      {!isQuizStarted ? (
        <div className={`start-screen w-full max-w-md mx-auto rounded-2xl p-8 ${isDarkMode ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-indigo-500'} shadow-xl transition-transform duration-300 transform hover:scale-105`}>
          <input
            type="text"
            placeholder="Enter your name"
            className={`border p-4 rounded-lg w-full mb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} focus:ring-2 focus:ring-pink-500`}
            onChange={(e) => setUserName(e.target.value)}
            value={userName}
          />
          <button
            className={`start-btn py-4 px-12 ${isDarkMode ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gradient-to-r from-yellow-400 to-pink-500'} text-white rounded-xl`}
            onClick={handleStartQuiz}
          >
            Start Quiz
          </button>

          <div className="quiz-settings mt-8 space-y-5">
            <label className="block text-lg font-semibold">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`border p-4 rounded-lg w-full mt-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} focus:ring-2 focus:ring-pink-500`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="block text-lg font-semibold">Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={`border p-4 rounded-lg w-full mt-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} focus:ring-2 focus:ring-pink-500`}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <label className="block text-lg font-semibold">Time per Question (seconds):</label>
            <input
              type="number"
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              min="10"
              max="60"
              className={`border p-4 rounded-lg w-full mt-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} focus:ring-2 focus:ring-pink-500`}
            />
          </div>
        </div>
      ) : (
        <div className={`quiz-container bg-gradient-to-br ${isDarkMode ? 'from-purple-500 to-blue-600' : 'from-indigo-500 to-pink-500'} p-8 rounded-2xl shadow-xl w-full max-w-3xl mx-auto transition-transform duration-300 transform hover:scale-105`}>
          {showResult ? (
            <Result
              score={score}
              totalQuestions={questions.length}
              leaderboard={leaderboard}
              userAnswers={userAnswers}
              isDarkMode={isDarkMode}
            />
          ) : (
            <>
              <div className="progress-bar-container w-full mt-4">
                <div
                  className="progress-bar bg-green-400 rounded-full"
                  style={{ width: `${progress}%`, height: "10px" }}
                ></div>
              </div>

              <div className="timer flex justify-between items-center mb-8">
                <p className="text-3xl font-bold">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</p>
                <button
                  onClick={handlePauseResume}
                  className={`pause-resume-btn py-2 px-8 rounded-lg transition duration-300 ${isDarkMode ? 'bg-gradient-to-r from-teal-400 to-cyan-500' : 'bg-gradient-to-r from-teal-500 to-cyan-600'} text-white`}
                >
                  {isRunning ? "Pause" : "Resume"}
                </button>
              </div>

              <div className="question mb-8 text-center">
                <p className="text-xl font-semibold mb-4">{questions[currentQuestionIndex]?.questionText}</p>
                <div className="answer-options flex flex-col space-y-5">
                  {questions[currentQuestionIndex]?.answerOptions.map((option, index) => (
                    <button
                      key={index}
                      className={`answer-option py-4 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105 ${isDarkMode ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'} text-white`}
                      onClick={() => handleAnswerOptionClick(option.isCorrect)}
                    >
                      {option.answerText}
                    </button>
                  ))}
                </div>
              </div>

              <p className="answer-feedback text-lg font-medium text-yellow-300">{answerFeedback}</p>

              <div className="lifelines flex justify-center space-x-4 mt-6">
                {lifelines.fiftyFifty > 0 && (
                  <button
                    onClick={handleFiftyFifty}
                    className={`lifeline-btn py-3 px-8 rounded-lg transition duration-300 ${isDarkMode ? 'bg-gradient-to-r from-green-400 to-teal-500' : 'bg-gradient-to-r from-green-500 to-teal-600'} text-white`}
                  >
                    50:50
                  </button>
                )}
                {lifelines.askAudience > 0 && (
                  <button
                    onClick={handleAskAudience}
                    className={`lifeline-btn py-3 px-8 rounded-lg transition duration-300 ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white`}
                  >
                    Ask Audience
                  </button>
                )}
              </div>

              <button
                onClick={handleSkipQuestion}
                className={`skip-btn mt-6 py-3 px-8 rounded-lg transition duration-300 ${isDarkMode ? 'bg-gradient-to-r from-red-400 to-yellow-500' : 'bg-gradient-to-r from-red-500 to-yellow-600'} text-white`}
              >
                Skip Question
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;