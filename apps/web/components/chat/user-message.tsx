"use client";

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end px-4 py-1.5">
      <div className="max-w-[80%] bg-accent text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
