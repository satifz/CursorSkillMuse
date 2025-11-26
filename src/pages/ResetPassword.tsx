import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setPasswordError("");
    setConfirmPasswordError("");

    const validation = passwordSchema.safeParse({ password, confirmPassword });
    
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      if (errors.password) setPasswordError(errors.password[0]);
      if (errors.confirmPassword) setConfirmPasswordError(errors.confirmPassword[0]);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('password-reset-confirm', {
        body: { 
          token,
          newPassword: password
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your password has been reset. You can now sign in with your new password."
      });
      
      navigate('/auth');
    } catch (error: any) {
      // Sanitize password-related errors
      let errorMessage = error.message || "Unable to reset password. Please try again.";
      
      if (errorMessage.toLowerCase().includes('password') ||
          errorMessage.toLowerCase().includes('weak') ||
          errorMessage.toLowerCase().includes('leaked') ||
          errorMessage.toLowerCase().includes('compromised')) {
        errorMessage = "This password is not allowed. Please choose a stronger password.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New Password (min. 8 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                disabled={isLoading}
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError("");
                }}
                disabled={isLoading}
                className={confirmPasswordError ? "border-destructive" : ""}
              />
              {confirmPasswordError && <p className="text-sm text-destructive">{confirmPasswordError}</p>}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center">
              <Link 
                to="/auth" 
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;