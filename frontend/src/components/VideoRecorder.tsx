import * as faceapi from "face-api.js";
import React, { useRef, useState } from "react";

function App({
  setQuestionIndex,
  interviewStarted,
  questionIndex,
  setInterviewStarted,
  totalQuestions,
}) {
  const [isAnswering, setIsAnswering] = useState(false);

  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [captureVideo, setCaptureVideo] = React.useState(false);
  const [isRecording, setIsRecording] = useState<{ duration: number } | false>(
    false
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Array<Blob>>([]);

  const videoRef = React.useRef();
  const videoHeight = 480;
  const videoWidth = 800;
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(() => {
        setModelsLoaded(true);
        startVideo();
      });
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
          videoRef.current
        );
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvasRef &&
          canvasRef.current &&
          canvasRef.current
            .getContext("2d")
            .clearRect(0, 0, videoWidth, videoHeight);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawFaceExpressions(
            canvasRef.current,
            resizedDetections
          );
      }
    }, 100);
  };

  const startRecording = async () => {
    try {
      setIsAnswering(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/mp3" });
        const audioFile = new File([audioBlob], "audio.mp3");
        console.log(audioBlob);
        const formData = new FormData();
        formData.append("audio_file", audioBlob, `${questionIndex + 1}.mp3`);

        console.log(formData);
        try {
          const response = await fetch("http://127.0.0.1:8000/audio", {
            method: "POST",

            body: formData,
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log("API response:", responseData);
            // Handle the API response as needed
          } else {
            console.log("Failed to upload audio. Server returned:", response);
          }
        } catch (error) {
          console.log("Error uploading audio:", error);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording({ duration: 0 });
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnswering(false);
      if (questionIndex === totalQuestions) setInterviewStarted(false);
      else setQuestionIndex((prev) => prev + 1);
    }
  };

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  };

  return (
    <div className="relative">
      {captureVideo ? (
        modelsLoaded ? (
          <div className="flex flex-col items-center">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <video
                ref={videoRef}
                height={videoHeight}
                width={videoWidth}
                onPlay={handleVideoOnPlay}
              />
              <canvas ref={canvasRef} style={{ position: "absolute" }} />
            </div>
            {interviewStarted &&
              (isAnswering ? (
                <button
                  className="text-center px-4 py-3 bg-red-600 text-white rounded-md cursor-pointer border-2 mt-5"
                  onClick={stopRecording}
                >
                  Stop Answering to the question
                </button>
              ) : (
                <button
                  className="text-center px-4 py-3 bg-[#7b79ff] text-white rounded-md cursor-pointer border-2 mt-5"
                  onClick={startRecording}
                >
                  Start Answering to the question
                </button>
              ))}
          </div>
        ) : (
          <div>loading...</div>
        )
      ) : (
        <></>
      )}
    </div>
  );
}

export default App;
