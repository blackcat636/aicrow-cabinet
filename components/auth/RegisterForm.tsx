"use client";

import React, { useState, useEffect, useRef } from "react";

import { VerifyEmailForm } from "./VerifyEmailForm";

import { useAuth } from "@/contexts/AuthContext";
import { RegisterRequest } from "@/types/auth";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { useTranslations } from 'next-intl';
import { FacebookLoginButton } from "./FacebookLoginButton";

interface RegisterFormProps {
  variant?: "modal" | "embedded";
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: (email: string) => void;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  variant = "modal",
  isOpen = false,
  onClose,
  onSwitchToLogin,
  onRegistrationSuccess,
  className,
}) => {
  const t = useTranslations('auth');
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const registrationEmailRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("registrationEmail");
    if (saved) {
      if (!registrationEmailRef.current) registrationEmailRef.current = saved;
      if (!registrationEmail) setRegistrationEmail(saved);
    }
  }, []);

  // Clear error when form data changes (user is typing)
  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalidEmailFormat');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Don't clear error here - let it persist if registration fails
      const result = await register(formData);

      // Registration successful - clear any previous errors
      clearError();

      // Check if email verification is required
      if (result?.requiresVerification) {
        const emailToUse = result.email || formData.email;

        setRegistrationEmail(emailToUse);
        registrationEmailRef.current = emailToUse;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("registrationEmail", emailToUse);
        }

        // Call parent callback if provided, otherwise show form directly
        if (onRegistrationSuccess) {
          onRegistrationSuccess(emailToUse);
        } else {
          setShowVerifyEmail(true);
        }
      } else {
        if (isModal && onClose) {
          onClose();
        }
      }
    } catch (err: any) {
      // Error is already set in AuthContext, just log it
      console.error('Registration failed:', err.message);
    }
  };

  const handleEmailVerified = () => {
    window.location.reload();
  };

  const isModal = variant === "modal";

  if (isModal && !isOpen) return null;

  const emailToUse =
    registrationEmail ||
    registrationEmailRef.current ||
    "";

  return (
    <>
      <VerifyEmailForm
        email={emailToUse}
        isOpen={showVerifyEmail && !!emailToUse}
        onClose={() => {
          setShowVerifyEmail(false);
          setRegistrationEmail("");
          registrationEmailRef.current = "";
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem("registrationEmail");
          }
          if (isModal && onClose) {
            onClose();
          }
        }}
        onVerified={handleEmailVerified}
      />

      {!showVerifyEmail && (
        isModal ? (
          /* Figma 1-3568: registration modal – same layout as login (mobile full-screen, desktop card) */
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-0 md:p-4">
            <div className="relative flex h-full w-full max-h-[100dvh] flex-col md:h-auto md:max-h-[none] md:w-full md:max-w-[540px] md:rounded-[20px] md:rounded-b-none md:border md:border-[var(--color-secondary-4)] md:bg-[var(--color-secondary-2)] md:pt-12 md:pb-6 md:px-[72px]">
              <div className="flex flex-1 flex-col overflow-y-auto md:flex-initial md:overflow-visible">
                <div className="flex flex-shrink-0 items-center justify-center px-6 pt-[64px] pb-4 md:pt-0 md:contents">
                  <h2 className="text-[26px] leading-[1.3] font-bold text-white md:text-center md:text-[32px] md:leading-[1.4] md:tracking-[0.64px] md:font-semibold">
                    {t('signUp')}
                  </h2>
                </div>

                <div className="mx-auto w-full max-w-[400px] px-6 pb-6 md:px-0 md:pb-0">
                  <form onSubmit={handleSubmit} className="mt-2 space-y-5 md:mt-8 md:space-y-6">
                    {error && (
                      <div className="rounded-[8px] border border-[#C42B2B] bg-[#C42B2B]/10 px-4 py-3 text-[14px] text-[#ff8d8d]">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[15px] leading-[1.4] font-normal text-white md:font-medium md:text-[16px] md:tracking-[0.32px] md:text-[var(--color-secondary-8)]">
                        {t('emailAddress')}
                      </label>
                      <input
                        id="register-email"
                        type="email"
                        placeholder={t('enterYourEmail')}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`h-12 w-full rounded-[10px] border px-4 text-[16px] leading-[1.4] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#888888] md:rounded-[8px] md:bg-transparent md:placeholder:text-[var(--color-secondary-6)] md:text-[var(--color-secondary-10)] ${
                          errors.email ? "border-[#C42B2B] bg-[#2C2C2C]" : "border-[#666666] bg-[#2C2C2C] md:border-[var(--color-secondary-4)] md:bg-transparent"
                        }`}
                      />
                      {errors.email && <p className="text-[12px] text-[#ff8d8d]">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[15px] leading-[1.4] font-normal text-white md:font-medium md:text-[16px] md:tracking-[0.32px] md:text-[var(--color-secondary-8)]">
                        {t('password')}
                      </label>
                      <div className="relative">
                        <input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t('createAPassword')}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={`h-12 w-full rounded-[10px] border px-4 pr-11 text-[16px] leading-[1.4] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#888888] md:rounded-[8px] md:bg-transparent md:placeholder:text-[var(--color-secondary-6)] md:text-[var(--color-secondary-10)] ${
                            errors.password ? "border-[#C42B2B] bg-[#2C2C2C]" : "border-[#666666] bg-[#2C2C2C] md:border-[var(--color-secondary-4)] md:bg-transparent"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white md:text-[var(--color-secondary-6)] md:hover:text-[var(--color-secondary-10)]"
                          aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                        >
                          {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-[12px] text-[#ff8d8d]">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t('confirmYourPassword')}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className={`h-12 w-full rounded-[10px] border px-4 pr-11 text-[16px] leading-[1.4] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#888888] md:rounded-[8px] md:bg-transparent md:placeholder:text-[var(--color-secondary-6)] md:text-[var(--color-secondary-10)] ${
                            errors.confirmPassword ? "border-[#C42B2B] bg-[#2C2C2C]" : "border-[#666666] bg-[#2C2C2C] md:border-[var(--color-secondary-4)] md:bg-transparent"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white md:text-[var(--color-secondary-6)] md:hover:text-[var(--color-secondary-10)]"
                          aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                        >
                          {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-[12px] text-[#ff8d8d]">{errors.confirmPassword}</p>}
                      <p className="text-[14px] leading-[1.5] text-[#424242]">
                        {t('passwordLength')}
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-[10px] bg-[var(--color-main)] text-[16px] leading-[1.4] font-semibold text-white hover:opacity-95 disabled:opacity-60 md:rounded-[8px]"
                      >
                        {isLoading ? t('signingUp') : t('next')}
                      </button>
                      <FacebookLoginButton className="h-12 w-full rounded-[10px] text-[16px] font-semibold justify-center bg-[#3B5998] hover:bg-[#334d82] md:rounded-[8px]" />
                    </div>
                  </form>
                </div>

                <div className="mt-2 h-px w-full flex-shrink-0 bg-[var(--color-secondary-4)] md:hidden" style={{ background: 'var(--color-secondary-4, #363639)' }} aria-hidden />
              </div>
            </div>

            {/* Sign-in block: outside form card, in main block — same as login (line full width, text centered) */}
            <div className="w-full flex-shrink-0 pt-5 px-6 pb-6 md:pt-5 md:pb-6 md:px-[72px] md:max-w-[540px] md:border md:border-[var(--color-secondary-4)] md:rounded-b-[20px] md:bg-[var(--color-secondary-2)]">
              <p className="text-center text-[16px] leading-[1.4] text-[#424242] md:text-[var(--color-secondary-8)] md:tracking-[0.32px]">
                {t('alreadyHaveAccount')}{" "}
                <button
                  type="button"
                  onClick={() => { clearError(); onSwitchToLogin(); }}
                  className="font-semibold text-[var(--color-main)] underline decoration-[var(--color-main)] underline-offset-2 hover:opacity-90 md:no-underline"
                >
                  {t('signIn')}
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* Embedded variant: full form with all fields */
          <div className={className ?? ""}>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-email">{t('emailAddress')} *</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder={t('enterYourEmail')}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full p-3 bg-white/10 text-white placeholder-gray-300 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.email ? "border-red-500" : "border-white/30"}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-password">{t('password')} *</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('createAPassword')}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`w-full p-3 pr-10 bg-white/10 text-white placeholder-gray-300 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.password ? "border-red-500" : "border-white/30"}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                <p className="mt-1 text-xs text-gray-400">{t('passwordLength')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-confirm-password">{t('confirmPassword')} *</label>
                <div className="relative">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('confirmYourPassword')}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`w-full p-3 pr-10 bg-white/10 text-white placeholder-gray-300 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.confirmPassword ? "border-red-500" : "border-white/30"}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-first-name">{t('firstName')}</label>
                <input
                  id="register-first-name"
                  type="text"
                  placeholder={t('enterFirstName')}
                  value={formData.firstName || ""}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full p-3 bg-white/10 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-last-name">{t('lastName')}</label>
                <input
                  id="register-last-name"
                  type="text"
                  placeholder={t('enterLastName')}
                  value={formData.lastName || ""}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full p-3 bg-white/10 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-phone">{t('phone')}</label>
                <input
                  id="register-phone"
                  type="tel"
                  placeholder={t('enterPhone')}
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full p-3 bg-white/10 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {isLoading ? t('signingUp') : t('createAccount')}
                </button>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-gray-400 uppercase">{t('or')}</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
              <FacebookLoginButton />
              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-300">
                  {t('alreadyHaveAccount')}{" "}
                  <button type="button" onClick={() => { clearError(); onSwitchToLogin(); }} className="text-purple-400 hover:text-purple-300 font-medium">
                    {t('signIn')}
                  </button>
                </p>
              </div>
            </form>
          </div>
        )
      )}
    </>
  );
};