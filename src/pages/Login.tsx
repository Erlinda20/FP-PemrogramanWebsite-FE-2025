import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";

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

export default function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const token = response.data.data?.access_token;

      if (!token) {
        throw new Error("Token tidak ditemukan dalam respon server.");
      }

      setToken(token);

      const me = await api.get("/api/auth/me");
      setUser(me.data.data);

      navigate("/profile");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage =
        error.response?.data?.message || "Email atau password salah.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#B8D4FF] to-[#FFEEB2] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center pt-8">
          <Typography variant="h4" className="text-center !font-bold mt-2">
            Welcome Back!
          </Typography>

          <Typography variant="p" className="text-center text-[#64748B] mt-1">
            Sign in to continue creating amazing
            <br />
            educational games
          </Typography>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {isLoading ? "Loading..." : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col justify-center pb-8">
          <Typography variant="p" className="text-center">
            <span className={footerTextStyles}>Don't have an account? </span>
            <Button variant="link" className={footerLinkStyles} asChild>
              <a href="/register">Sign Up</a>
            </Button>
          </Typography>
        </CardFooter>
      </Card>
    </div>
  );
}
