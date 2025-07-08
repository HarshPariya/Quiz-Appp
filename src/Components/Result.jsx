const Result = ({ score, allQuestions }) => {
    return (
      <div className="result-container">
        <h2>Quiz Finished!</h2>
        <p>Your score: {score}/{allQuestions.length}</p>
      </div>
    );
  };
  
  export default Result;
  