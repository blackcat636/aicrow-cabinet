"use client";

import React, { useState, useEffect, useRef } from "react";

import { VerifyEmailForm } from "./VerifyEmailForm";

import { useAuth } from "@/contexts/AuthContext";
import { RegisterRequest } from "@/types/auth";
import { XIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

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
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const registrationEmailRef = useRef("");

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
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

        // Save email in state, ref, and sessionStorage
        setRegistrationEmail(emailToUse);
        registrationEmailRef.current = emailToUse;
        sessionStorage.setItem("registrationEmail", emailToUse);

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
    sessionStorage.getItem("registrationEmail") ||
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
          sessionStorage.removeItem("registrationEmail");
          if (isModal && onClose) {
            onClose();
          }
        }}
        onVerified={handleEmailVerified}
      />

      {!showVerifyEmail && (
        <div
          className={
            isModal
              ? "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
              : ""
          }
        >
          <div
            className={
              (isModal
                ? "bg-gray-900 rounded-lg max-w-md w-full border border-gray-700"
                : "") + (className ? ` ${className}` : "")
            }
          >
            {/* Header */}
            {isModal && (
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  Create Account
                </h2>
                <button
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-red-900/20"
                  onClick={() => {
                    clearError();
                    onClose?.();
                  }}
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step Indicator */}
            {isModal && (
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded bg-purple-600" />
                  <div className="flex-1 h-1 rounded bg-gray-700" />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-purple-400">
                    Create Account
                  </span>
                  <span className="text-xs text-gray-500">Verify Email</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              className={isModal ? "p-6 space-y-4" : "space-y-4"}
              onSubmit={handleSubmit}
            >
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2"
                  htmlFor="register-email"
                >
                  Email Address *
                </label>
                <input
                  className={`w-full p-3 bg-white/10 text-white placeholder-gray-300 border ${isModal ? "rounded-lg" : "rounded-full"} border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.email ? "border-red-500" : "border-white/30"
                  }`}
                  id="register-email"
                  placeholder="Enter your email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2"
                  htmlFor="register-password"
                >
                  Password *
                </label>
                <div className="relative">
                  <input
                    className={`w-full p-3 pr-10 bg-white/10 text-white placeholder-gray-300 border ${isModal ? "rounded-lg" : "rounded-full"} border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.password ? "border-red-500" : "border-white/30"
                    }`}
                    id="register-password"
                    placeholder="Create a password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2"
                  htmlFor="register-confirm-password"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    className={`w-full p-3 pr-10 bg-white/10 text-white placeholder-gray-300 border ${isModal ? "rounded-lg" : "rounded-full"} border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-white/30"
                    }`}
                    id="register-confirm-password"
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                  />
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-center">
                <button
                  className={`${isModal ? "w-full" : "w-auto"} inline-flex items-center justify-center px-8 py-2.5 bg-purple-600 text-white ${isModal ? "rounded-lg" : "rounded-full"} hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-purple-500/25`}
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>

              {/* Switch to Login */}
              <div
                className={
                  isModal
                    ? "text-center pt-4 border-t border-gray-700"
                    : "text-center pt-2"
                }
              >
                <p className="text-sm text-gray-300">
                  Already have an account?{" "}
                  <button
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    type="button"
                    onClick={() => {
                      clearError();
                      onSwitchToLogin();
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};