import { LoginView } from "@/views/login";

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <LoginView error={typeof error === "string" ? error : null} />;
}
