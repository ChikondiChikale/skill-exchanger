import { supabase } from "./supabase";

export const redirectAfterAuth = async (navigate, destination = "/dashboard") => {
  try {
    // Get authenticated user
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

    console.log("Authenticated user:", user.id);

    // Check profile in database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    console.log("Profile found:", profile);
    console.log("Profile error:", profileError);

    if (profileError) {
      throw profileError;
    }

    // No profile row exists
    if (!profile) {
      console.log("No profile found → Complete Profile");
      navigate("/complete-profile");
      return;
    }

    // Profile exists but is not completed
    if (profile.profile_completed !== true) {
      console.log("Profile incomplete → Complete Profile");
      navigate("/complete-profile");
      return;
    }

    // Profile fully completed
    console.log("Profile complete → destination");
    navigate(destination);

  } catch (error) {
    console.error("Profile check error:", error);

    // Important: send user to complete profile
    navigate("/complete-profile");
  }
};