import { useEffect, useState } from "react";
import VideoRecorder from "./components/VideoRecorder";
import data from "./data/questions.json";

function App() {
  const totalQuestions = data.total;
  const questions = data.questions;
  const [questionIndex, setQuestionIndex] = useState(0);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [results, setResults] = useState([]);
  const [interviewStatus, setInterviewStatus] = useState<
    "not-started" | "analysing" | "announced"
  >("not-started");

  useEffect(() => {
    const getResults = () => {
      fetch("http://127.0.0.1:8000/results")
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results);
          setInterviewStatus("announced");
          console.log(data);
        });
    };

    if (questionIndex == totalQuestions) {
      setInterviewStatus("analysing");
      getResults();
    }
  }, [questionIndex]);

  if (interviewStatus === "announced")
    return (
      <>
        <h1 className="text-center mb-10">Feedback</h1>
        <table className="text-white m-5">
          <tr className="border-b-2">
            <td className="border-2 p-2">ID</td>
            <td className="border-2 p-2">Question</td>
            <td className="border-2 p-2">Your Answer</td>
            <td className="border-2 p-2">Sample Answer</td>
            <td className="border-2 p-2">Similarity Score</td>
          </tr>
          {results.map((r) => (
            <tr>
              <td className="border-2 p-2">{r.id}</td>
              <td className="border-2 p-2">{r.question}</td>
              <td className="border-2 p-2">{r.candidate_response}</td>
              <td className="border-2 p-2">{r.sample_answer}</td>
              <td className="border-2 p-2">{r.similarity}</td>
            </tr>
          ))}
        </table>
      </>
    );

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen">
      <nav className="bg-[#212134] text-white px-8 py-4 flex justify-between items-center absolute top-0 w-full">
        <div>
          <p className="text-2xl">Interview Mate</p>
        </div>
        <p className="text-xl">Python Interview</p>
        <div
          className="bg-[#7b79ff]
        p-2 rounded-full flex justify-center items-center
        uppercase"
        >
          dm
        </div>
      </nav>
      {interviewStatus === "analysing" || questionIndex === totalQuestions ? (
        <div className="bg-[#212134] p-8 text-white">Analysing</div>
      ) : (
        <div className="px-8 w-full h-[80%]  flex mt-14 justify-center">
          <div className="w-[48%] bg-[#212134] rounded-md h-full shadow-2xl mr-3 flex justify-center items-center">
            {interviewStarted ? (
              <p className="text-white w-[80%] text-center text-2xl">
                {questionIndex + 1}. {questions[questionIndex].question}
              </p>
            ) : (
              <button
                onClick={() => setInterviewStarted(true)}
                className="text-white px-3 py-2 rounded-md bg-[#7b79ff] cursor-pointer"
              >
                Start Interview
              </button>
            )}
          </div>
          <div className="w-[48%] bg-[#212134] rounded-md h-full shadow-2xl flex justify-center items-center ml-3">
            <VideoRecorder
              setQuestionIndex={setQuestionIndex}
              interviewStarted={interviewStarted}
              questionIndex={questionIndex}
              totalQuestions={totalQuestions}
              setInterviewStarted={setInterviewStarted}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
