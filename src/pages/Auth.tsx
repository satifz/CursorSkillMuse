import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72, { message: "Password must be less than 72 characters" })
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setEmailError("");
    setPasswordError("");

    const validation = authSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      if (errors.email) setEmailError(errors.email[0]);
      if (errors.password) setPasswordError(errors.password[0]);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      // Display generic message for password-related errors
      const errorMessage = error.message || "An error occurred during sign up";
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Account created successfully. You can now sign in."
      });
      setEmail("");
      setPassword("");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setEmailError("");
    setPasswordError("");

    const validation = authSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      if (errors.email) setEmailError(errors.email[0]);
      if (errors.password) setPasswordError(errors.password[0]);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">SkillMuse</CardTitle>
          <CardDescription className="text-center">
            Transform any article into an interactive visual lesson
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    disabled={isLoading}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    disabled={isLoading}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password (min. 8 characters)"
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
