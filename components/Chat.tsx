"use client";

import { marked } from "marked";
import { FormEvent, useRef, useState } from "react";

export default function Chat() {
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const content = contentRef.current?.value;
    if (!content) {
      return;
    }
    const message = { role: "user", content };
    contentRef.current!.value = "";
    setMessages((pre) => [
      ...pre,
      message,
      { role: "assistant", content: "..." },
    ]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, message]),
    });
    if (!res.ok || !res.body) {
      setMessages((pre) => [
        ...pre.slice(0, -1),
        { role: "assistant", content: "Error" },
      ]);
      return;
    }
    const currentResponse: string[] = [];
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      currentResponse.push(value);
      const currentMessage = currentResponse.join("");
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: currentMessage },
      ]);
    }
    setIsLoading(false);
  }

  function resetMessages() {
    setMessages((pre) => []);
  }

  return (
    <div>
      <div className="h-screen overflow-auto pb-20">
        {messages.map((message, index) => (
          <div
            className={`${
              message.role === "user" ? `bg-gray-100` : "bg-gray-300"
            } p-7`}
            key={index}
          >
            <article
              className="prose mx-auto prose-pre:select-all"
              dangerouslySetInnerHTML={{ __html: marked(message.content) }}
            />
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-1/2">
            <div className="text-2xl text-gray-500">No messages</div>
          </div>
        )}
      </div>
      <form
        className="flex fixed bottom-0 p-3 gap-3 h-20 bg-gray-400 w-full"
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          onClick={resetMessages}
          className="bg-red-500 hover:bg-red-600 h-14 p-3 active:bg-red-700"
        >
          Clear
        </button>
        <textarea
          ref={contentRef}
          className="resize-none w-full h-14 pt-4 px-3"
          placeholder="Type something..."
          disabled={isLoading}
          name="content"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 h-14 p-3 active:bg-blue-700"
          disabled={isLoading}
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export interface Message {
  role: string;
  content: string;
}
