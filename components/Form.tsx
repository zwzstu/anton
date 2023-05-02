"use client";
import { marked } from "marked";
import { useRef, useState } from "react";

interface ModelType {
  object: "engine";
  id: string;
  ready: boolean;
  owner: string;
  permissions: null;
  created: string;
}

const Form = () => {
  const messageInput = useRef<HTMLTextAreaElement | null>(null);
  const [response, setResponse] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEnter = (
    e: React.KeyboardEvent<HTMLTextAreaElement> &
      React.FormEvent<HTMLFormElement>
  ) => {
    if (e.key === "Enter" && isLoading === false) {
      e.preventDefault();
      setIsLoading(true);
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = messageInput.current?.value;
    if (message !== undefined) {
      setResponse((prev) => [...prev, message]);
      messageInput.current!.value = "";
    }

    if (!message) {
      return;
    }

    const response = await fetch("/api/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    setResponse((prev) => [...prev, message]);

    let currentResponse: string[] = [];
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      // currentResponse = [...currentResponse, message, chunkValue];
      currentResponse = [...currentResponse, chunkValue];
      setResponse((prev) => [...prev.slice(0, -1), currentResponse.join("")]);
    }
    // breaks text indent on refresh due to streaming
    // localStorage.setItem('response', JSON.stringify(currentResponse));
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {isLoading
          ? response.map((item: any, index: number) => {
              return (
                <div
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-blue-500" : "bg-gray-500"
                  } p-3 rounded-lg`}
                >
                  <article
                    className="prose mx-auto"
                    dangerouslySetInnerHTML={{ __html: marked(item) }}
                  />
                </div>
              );
            })
          : response
          ? response.map((item: string, index: number) => {
              return (
                <div
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-blue-500" : "bg-gray-500"
                  } p-3 rounded-lg`}
                >
                  <article
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: marked(item) }}
                  />
                </div>
              );
            })
          : null}
      </div>
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 w-full md:max-w-3xl mx-auto mb-3 bg-gray-500 flex"
      >
        <textarea
          name="Message"
          placeholder="Type your query"
          ref={messageInput}
          onKeyDown={handleEnter}
          className="w-full resize-none bg-transparent outline-none pt-4 pl-4 translate-y-1"
        />
        <button disabled={isLoading} type="submit" className="p-3">
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 20 20"
            className="h-6 w-6 rotate-90"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Form;
