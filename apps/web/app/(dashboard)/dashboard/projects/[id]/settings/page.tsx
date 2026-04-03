import ProjectSettingsPage from "./settings-page";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <ProjectSettingsPage />;
}
