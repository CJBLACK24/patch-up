// app/index.tsx
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/authContext";

export default function Index() {
  const { user } = useAuth();                 
  return <Redirect href={user ? "/(auth)/patching" : "/(auth)/login"} />;
}
