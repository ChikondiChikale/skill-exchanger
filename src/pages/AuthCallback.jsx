import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { redirectAfterAuth } from "../lib/authHelpers";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      await redirectAfterAuth(navigate);
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#fffdf2] flex items-center justify-center">

      <div className="text-center">

        <div className="w-12 h-12 mx-auto rounded-xl bg-[#062f2f] text-[#fbbf24] flex items-center justify-center font-extrabold text-xl mb-5">
          S
        </div>

        <h1 className="text-xl font-bold text-[#062f2f]">
          Setting up your account...
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Please wait while we prepare your Skill Exchanger profile.
        </p>

      </div>

    </div>
  );
}

export default AuthCallback;