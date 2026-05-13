import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const Navigation = () => {
  return (
    <nav className="border-b border-[(--foreground)]/10">
      <div className="flex container h-16 items-center justify-between px-4 mx-auto">
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
          </Show>
          <Show when="signed-in">
            <Link
              href="/upload"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Upload
            </Link>
          </Show>
        </div>

        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal" />
            <SignUpButton mode="modal">
              <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
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
