import { supabase } from "./supabaseClient";

export async function ensureAutoUsername() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return;

    if (!profile.username) {
      // Generate a base username from full name
      let base = (profile.full_name || "user")
        .replace(/[^a-zA-Z\s]/g, "") // Remove special characters
        .replace(/\s+/g, "") // Remove spaces
        .toLowerCase();

      // Ensure base is not empty
      if (!base) base = "user";

      let username = base;
      let attempts = 0;
      const maxAttempts = 10;

      // Check for uniqueness with better suffix generation
      while (attempts < maxAttempts) {
        const { data: exists } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (!exists) {
          // Username is unique, save it
          const { error } = await supabase
            .from("profiles")
            .update({ username })
            .eq("id", user.id);

          if (error) {
            // Username update failed, but don't block the flow
          }
          return;
        }

        // Generate new username with better suffix
        const suffix = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        username = `${base}${suffix}`;
        attempts++;
      }

      // Fallback: use timestamp-based username
      const timestamp = Date.now().toString().slice(-4);
      username = `${base}${timestamp}`;

      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (error) {
        // Fallback username update failed, but don't block the flow
      }
    }
  } catch (error) {
    // Error in autoUsername generation, but don't block the flow
  }
}
