import { SubmitButton } from "@/shared/ui";
import { signOutAction } from "../api/signOutAction";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton className="inline-flex h-11 items-center text-sm text-text-secondary underline underline-offset-4">
        로그아웃
      </SubmitButton>
    </form>
  );
}
