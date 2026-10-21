import { SubmitButton } from "@/shared/ui";
import { signOutAction } from "../api/signOutAction";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton className="text-sm text-text-secondary underline underline-offset-4">
        로그아웃
      </SubmitButton>
    </form>
  );
}
