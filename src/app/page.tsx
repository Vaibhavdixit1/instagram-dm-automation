import { redirect } from "next/navigation";

export default function Home() {
  // TEMP: bypassing login to preview the app — restore redirect("/login") before shipping
  redirect("/dashboard");
}
