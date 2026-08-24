import type { Session, User } from "@supabase/supabase-js";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { useRuntime } from "./runtime";

type AuthState = { session: Session | null; user: User | null; loading: boolean };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { supabase } = useRuntime();
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active)
        setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);
  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth() {
  const auth = use(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}
