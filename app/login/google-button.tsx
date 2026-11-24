"use client";
import { useFormStatus } from "react-dom";
import { Button, GoogleIcon } from "@/components/ui";
import { signInWithGoogle } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} className="font-medium">
      <GoogleIcon />
      {pending ? "מעבירה ל-Google..." : "המשך עם Google"}
    </Button>
  );
}

export function GoogleButton({ next = "/" }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <Submit />
    </form>
  );
}
