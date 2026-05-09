import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const Navigation = () => {
  return (
    <nav className="border-b border-[(--foreground)]/10">
      <div className="flex container h-16 items-center justify-between px-4 mx-auto">
        <div className="text-xl font-semibold">Chatbot</div>

        <div className="flex gap-2">
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
