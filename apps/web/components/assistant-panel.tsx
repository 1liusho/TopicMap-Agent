"use client";

import { FormEvent, useState } from "react";

type AssistantPanelProps = {
  projectId: string;
  title?: string;
  suggestions?: string[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  mode?: string;
  citations?: string[];
};

export function AssistantPanel({
  projectId,
  title = "研究助手面板",
  suggestions = ["总结论文池重点", "解释图谱里最关键的路线", "给我 3 条下一步建议"]
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "我现在通过网站侧桥接接口工作。默认是 mock 模式，但接口已经预留了转发到 OpenClaw 的位置。"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          message: trimmed,
          history: nextMessages
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as {
        reply: string;
        mode: string;
        citations?: string[];
      };

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.reply,
          mode: payload.mode,
          citations: payload.citations
        }
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "助手回复失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-steel">
            当前通过网站服务端桥接。后续把环境变量切到 proxy 模式，就能接上真正的
            OpenClaw。
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          project {projectId}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void sendMessage(suggestion)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mt-5 grid max-h-[460px] gap-3 overflow-y-auto">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`rounded-md border px-4 py-4 text-sm leading-6 ${
              message.role === "assistant"
                ? "border-slate-200 bg-slate-50 text-slate-800"
                : "border-slate-900 bg-slate-950 text-white"
            }`}
          >
            <div className="font-medium">{message.role === "assistant" ? "助手" : "你"}</div>
            <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
            {message.citations && message.citations.length > 0 ? (
              <div className="mt-3 text-xs opacity-80">
                依据：{message.citations.join("；")}
              </div>
            ) : null}
            {message.mode ? (
              <div className="mt-3 text-xs opacity-70">mode: {message.mode}</div>
            ) : null}
          </article>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={4}
          placeholder="例如：结合当前论文池，帮我解释最值得保留的三篇论文。"
          className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "正在请求助手..." : "发送给助手"}
        </button>
      </form>
    </section>
  );
}
