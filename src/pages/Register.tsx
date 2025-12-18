import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import api from "@/api/axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

const labelStyles = "body-medium text-[#075985]";
const inputStyles = "bg-[#F3F3F5] subtle";
const forgotLinkStyles =
  "h-auto p-0 text-[#F59E0B] hover:text-amber-600 detail";
const submitButtonStyles =
  "w-full bg-[#0284C7] text-white body-semibold hover:bg-sky-700";
const footerTextStyles = "text-[#4A5565] subtle";
const footerLinkStyles =
  "h-auto p-0 text-[#F59E0B] hover:text-amber-600 subtle-semibold";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok!");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/api/auth/register", {
        username,
        email,
        password,
        confirm_password: confirmPassword,
      });

      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.";
        setError(errorMessage);
      } else {
        setError("Registrasi gagal. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // bg-gradient-to-br is a valid Tailwind CSS class
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-[#B8D4FF] to-[#FFEEB2] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center pt-8">
          <Typography variant="h4" className="text-center font-bold mt-2">
            Welcome!
          </Typography>

          <Typography variant="p" className="text-center text-[#64748B] mt-1">
            Sign up to start creating amazing
            <br />
            educational games
          </Typography>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="username" className={labelStyles}>
                Username
              </Label>
              <Input
                type="text"
                id="username"
                placeholder="example"
                className={inputStyles}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email" className={labelStyles}>
                Email
              </Label>
              <Input
                type="email"
                id="email"
                placeholder="you@example.com"
                className={inputStyles}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password" className={labelStyles}>
                Password
              </Label>
              <Input
                type="password"
                id="password"
                placeholder="••••••••"
                className={inputStyles}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="confirm-password" className={labelStyles}>
                Confirm Password
              </Label>
              <Input
                type="password"
                id="confirm-password"
                placeholder="••••••••"
                className={inputStyles}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button variant="link" type="button" className={forgotLinkStyles}>
                Forgot password?
              </Button>
            </div>

            {error && (
              <Typography
                variant="small"
                className="text-red-600 text-center font-medium"
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              className={submitButtonStyles}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Register"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col justify-center pb-8">
          <Typography variant="p" className="text-center">
            <span className={footerTextStyles}>Already have an account? </span>
            <Button variant="link" className={footerLinkStyles} asChild>
              <a href="/login">Sign In</a>
            </Button>
          </Typography>
        </CardFooter>
      </Card>
    </div>
  );
}
