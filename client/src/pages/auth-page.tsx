import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Car, Mail, User, Lock, UserPlus, LogIn, Loader2, ArrowRight, Phone } from "lucide-react";
import { z } from "zod";
import PreRegisterVerification from "@/components/auth/PreRegisterVerification";
import { useToast } from "@/hooks/use-toast";

type RegisterStep = "form" | "verification" | "complete";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [registerData, setRegisterData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Login form setup
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  // Register form setup
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      name: "",
      phone: ""
    }
  });
  
  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };
  
  // Handle register first step submission - collect data and proceed to verification
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Save the form data for later
    setRegisterData(values);
    
    // Request verification code
    fetch("/api/verify-phone/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone: values.phone })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.message || "Failed to send verification code");
        });
      }
      return res.json();
    })
    .then(data => {
      if (data.code) {
        setVerificationCode(data.code);
        
        // For demo purposes only
        toast({
          title: "Demo: Verification Code",
          description: `Your verification code is: ${data.code}`,
          variant: "default",
        });
      }
      
      // Move to verification step
      setRegisterStep("verification");
    })
    .catch(err => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    });
  };
  
  // Handle going back to the form from verification
  const handleBackToForm = () => {
    setRegisterStep("form");
  };
  
  // Handle verification completion and final registration
  const handleVerificationComplete = (phone: string, code: string) => {
    // Create the complete user data with verification info
    const completeUserData = {
      ...registerData,
      phone,
      verificationCode: code
    };
    
    // Register the user with the verified phone
    registerMutation.mutate(completeUserData, {
      onSuccess: () => {
        toast({
          title: "Registration successful!",
          description: "Your account has been created with a verified phone number.",
          variant: "default",
        });
        
        // Navigate to profile page after successful registration
        navigate("/profile");
      },
      onError: (error) => {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show phone verification if we're in the verification step
  if (registerStep === "verification" && registerData) {
    return (
      <>
        <Header />
        <main className="py-10 bg-gray-50 min-h-[calc(100vh-64px)]">
          <div className="container mx-auto px-4">
            <PreRegisterVerification 
              phone={registerData.phone}
              verificationCode={verificationCode}
              registerData={registerData}
              onBack={handleBackToForm}
              onVerificationComplete={handleVerificationComplete}
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <main className="py-10 bg-gray-50 min-h-[calc(100vh-64px)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - Auth forms */}
            <div>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Welcome Back</CardTitle>
                      <CardDescription>Login to access your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input placeholder="Enter your username" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input type="password" placeholder="Enter your password" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                              </>
                            ) : (
                              <>
                                <LogIn className="mr-2 h-4 w-4" /> Sign In
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Create Account</CardTitle>
                      <CardDescription>Sign up to start buying and selling cars</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input placeholder="Enter your full name" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input placeholder="Enter your email" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Choose a username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+357 99 123456" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-xs text-muted-foreground">
                                    Cyprus format: +357 followed by your mobile number
                                  </p>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <Input type="password" placeholder="Choose a password" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                              </>
                            ) : (
                              <>
                                <UserPlus className="mr-2 h-4 w-4" /> Create Account
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right column - Hero content */}
            <div className="bg-[#121c2c] rounded-xl p-8 text-white hidden lg:flex flex-col justify-center items-center">
              <div className="text-center">
                <h1 className="text-5xl font-bold leading-tight mb-6">Find Your Perfect Car in Cyprus</h1>
                <p className="text-xl mb-4">Buy and sell vehicles with confidence on Cyprus' most trusted car marketplace</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
