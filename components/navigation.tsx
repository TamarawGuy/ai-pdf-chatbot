import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const Navigation = () => {
  return (
    <nav className="border-b border-[(--foreground)]/10">
      <div className="flex h-16 justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-semibold">
            Chatbot
          </Link>
          <Show when="signed-in">
            <Link
              href="/chat"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Chat
            </Link>
            <Link
              href="/youtube-bot"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Youtube Bot
            </Link>
          </Show>
        </div>

        <div className="flex gap-4 items-center">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-md font-medium cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-foreground text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
