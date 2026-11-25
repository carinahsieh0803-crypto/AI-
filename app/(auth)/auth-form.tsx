"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type AuthMode = "login" | "register";
type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: FieldErrors = {};

    if (!email) {
      nextErrors.email = "請輸入電子郵件。";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "請輸入有效的電子郵件格式。";
    }

    if (!password) {
      nextErrors.password = "請輸入密碼。";
    } else if (isRegister && password.length < 8) {
      nextErrors.password = "密碼至少需要 8 個字元。";
    }

    if (isRegister && !confirmPassword) {
      nextErrors.confirmPassword = "請再次輸入密碼。";
    } else if (isRegister && password !== confirmPassword) {
      nextErrors.confirmPassword = "兩次輸入的密碼不一致。";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setNotice(
      isRegister
        ? "目前尚未連接驗證服務，帳號尚未建立。"
        : "目前尚未連接驗證服務，尚未登入。",
    );
  }

  function handleGoogleSignIn() {
    setNotice("Google 登入尚未連接驗證服務，目前無法登入。");
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/" aria-label="日日示範行事曆">
          <span className="auth-brand-mark" aria-hidden="true">日</span>
          <span>日日<span className="heading-period">.</span></span>
        </Link>

        <p className="auth-eyebrow">把時間留給重要的事</p>
        <h1 id="auth-title">{isRegister ? "建立你的帳號" : "歡迎回來"}</h1>
        <p className="auth-description">
          {isRegister ? "建立帳號後，開始安排你的每一天。" : "登入以繼續規劃你的每一天。"}
        </p>

        <form className="auth-form" noValidate onSubmit={submitForm}>
          <label className="auth-field" htmlFor="email">
            電子郵件
            <input
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
            />
            {errors.email && <span className="auth-error" id="email-error">{errors.email}</span>}
          </label>

          <label className="auth-field" htmlFor="password">
            密碼
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              id="password"
              name="password"
              placeholder={isRegister ? "至少 8 個字元" : "輸入密碼"}
              type="password"
            />
            {errors.password && <span className="auth-error" id="password-error">{errors.password}</span>}
          </label>

          {isRegister && (
            <label className="auth-field" htmlFor="confirmPassword">
              確認密碼
              <input
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="再次輸入密碼"
                type="password"
              />
              {errors.confirmPassword && (
                <span className="auth-error" id="confirm-password-error">
                  {errors.confirmPassword}
                </span>
              )}
            </label>
          )}

          <button className="auth-submit" type="submit">
            {isRegister ? "建立帳號" : "登入"}
          </button>
        </form>

        <div className="auth-separator"><span>或</span></div>
        <button className="auth-google" onClick={handleGoogleSignIn} type="button">
          <span className="google-mark" aria-hidden="true">G</span>
          使用 Google {isRegister ? "註冊" : "登入"}
        </button>

        <p className="auth-notice" role="status" aria-live="polite">
          {notice || "目前為介面預覽，尚未連接驗證服務。"}
        </p>

        <p className="auth-switch">
          {isRegister ? "已經有帳號了？" : "還沒有帳號？"}{" "}
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "前往登入" : "建立帳號"}
          </Link>
        </p>

        <Link className="auth-calendar-link" href="/">
          返回示範行事曆
        </Link>
      </section>
    </main>
  );
}
