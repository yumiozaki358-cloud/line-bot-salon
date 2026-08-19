import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const isValid = await verifyToken(token, process.env.ADMIN_PASSWORD);

  if (isValid) redirect("/admin/faq");

  return <LoginForm />;
}
