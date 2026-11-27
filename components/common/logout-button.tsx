"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setErrorMessage("");

    try {
      // 只登出目前這台裝置，不影響使用者在其他裝置的登入狀態。
      const { error } = await createClient().auth.signOut({ scope: "local" });
      if (error) {
        setErrorMessage("登出失敗，請稍後再試。");
        setIsSigningOut(false);
        return;
      }

      // 整頁重新載入，讓 proxy.ts 以已清除的 cookie 重新判斷登入狀態。
      window.location.assign("/login");
    } catch {
      setErrorMessage("登出失敗，請稍後再試。");
      setIsSigningOut(false);
    }
  }

  return (
    <>
      {errorMessage && (
        <span className="logout-error" role="alert">
          {errorMessage}
        </span>
      )}
      <button
        className="logout-button"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? "登出中..." : "登出"}
      </button>
    </>
  );
}