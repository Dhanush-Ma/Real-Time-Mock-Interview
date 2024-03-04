import os
from pathlib import Path
from typing import Optional

import numpy as np
import whisper
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from numpy.linalg import norm
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

model = whisper.load_model("base")
questions = [
    {
        "id": 1,
        "question": "What is the difference between list and tuple in Python?",
        "answer": "The main difference between lists and tuples is that lists are mutable (can be changed), whereas tuples are immutable (cannot be changed). This means that once a tuple is created, you cannot modify its elements.",
    },
    {
        "id": 2,
        "question": "Explain the concept of list comprehension in Python.",
        "answer": "List comprehension is a concise way of creating lists in Python. It allows you to generate a new list by applying an expression to each item in an existing iterable (e.g., list, tuple, or string) and filtering the items based on a condition.",
    },
    {
        "id": 3,
        "question": "What are the benefits of using Python?",
        "answer": "Python offers numerous benefits, including simplicity, readability, versatility, extensive libraries and frameworks, cross-platform compatibility, and a large and active community. It is widely used in various fields such as web development, data science, machine learning, artificial intelligence, and automation.",
    },
    {
        "id": 4,
        "question": "What is the purpose of using `if __name__ == '__main__'` in Python?",
        "answer": "`if __name__ == '__main__'` is used to check whether the current script is being run as the main program or being imported as a module into another script. It allows you to execute specific code only when the script is run directly, not when it is imported.",
    },
    {
        "id": 5,
        "question": "How does Python handle memory management?",
        "answer": "Python uses automatic memory management, also known as garbage collection, to manage memory allocation and deallocation. It automatically allocates memory for new objects when needed and deallocates memory for objects that are no longer in use. Python's garbage collector periodically reclaims memory occupied by unreachable objects to free up resources.",
    },
]


app = FastAPI(debug=True)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root(type: Optional[str] = None):
    print(type)
    print(type == "audio")
    return {"Mock Interview Api"}


@app.post("/audio")
async def get_audio(audio_file: UploadFile):
    data = await audio_file.read()
    print(audio_file.filename)

    print(audio_file)
    save_to = Path(__file__).parent.joinpath(f"{audio_file.filename}")

    with open(save_to, "wb") as f:
        f.write(data)

    return {"text": audio_file.filename}


@app.get("/results")
def get_results():
    results = []
    for i in range(len(questions)):
        qIndex = i + 1
        audio_file = os.path.join(os.getcwd(), f"{qIndex}.mp3")
        print(audio_file)
        speech_to_text = model.transcribe(audio_file, fp16=False, language="en")
        candidate_response = speech_to_text["text"]

        print(qIndex)
        print(candidate_response)
        sentences = [questions[i]["answer"], candidate_response]

        sentence_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        embeddings = sentence_model.encode(sentences)
        embedding1 = np.squeeze(np.array([embeddings[0]]))
        embedding2 = np.squeeze(np.array([embeddings[1]]))

        print(embedding1)
        print(embedding2)

        cos_sim = np.dot(embedding1, embedding2) / (norm(embedding1) * norm(embedding2))

        results.append(
            {
                "id": qIndex,
                "question": questions[i]["question"],
                "sample_answer": questions[i]["answer"],
                "candidate_response": candidate_response,
                "similarity": cos_sim.tolist(),
            }
        )
        print("******************")

    return {"results": results}
