import ChatPage from "./chat-page";

export function generateStaticParams() {
  return [{ projectId: "placeholder" }];
}

export default function Page() {
  return <ChatPage />;
}
