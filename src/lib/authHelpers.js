import { supabase, logAppError } from "./supabase";

export const redirectAfterAuth = async (navigate, destination = "/dashboard") => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      navigate("/complete-profile");
      return;
    }

    if (profile.profile_completed !== true) {
      navigate("/complete-profile");
      return;
    }

    navigate(destination);
  } catch (error) {
    logAppError("Auth redirect", error);
    navigate("/complete-profile");
  }
};