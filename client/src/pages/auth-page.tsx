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
import { Car, Mail, User, Lock, UserPlus, LogIn, Loader2 } from "lucide-react";
import { z } from "zod";
import RegisterVerification from "@/components/auth/RegisterVerification";
import { User as UserType } from "@shared/schema";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [registerStep, setRegisterStep] = useState<"form" | "verification">("form");
  const [newUser, setNewUser] = useState<UserType | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | undefined>(undefined);
  
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
  
  // Handle register submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values, {
      onSuccess: (user, variables) => {
        // Start the verification process
        setNewUser(user);
        
        // Request verification code
        fetch("/api/user/verify-phone/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ phone: variables.phone })
        })
        .then(res => res.json())
        .then(data => {
          if (data.code) {
            setVerificationCode(data.code);
          }
          setRegisterStep("verification");
        })
        .catch(err => {
          console.error("Error sending verification code:", err);
          // Continue anyway as the user is already registered
          setRegisterStep("verification");
        });
      }
    });
  };
  
  const handleVerificationComplete = () => {
    navigate("/");
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show phone verification if we're in the verification step
  if (registerStep === "verification" && newUser) {
    return (
      <>
        <Header />
        <main className="py-10 bg-gray-50 min-h-[calc(100vh-64px)]">
          <div className="container mx-auto px-4">
            <RegisterVerification 
              user={newUser} 
              verificationCode={verificationCode}
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
            <div className="bg-primary rounded-xl p-8 text-white hidden lg:block">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center mb-6">
                    <Car className="h-8 w-8 mr-2" />
                    <h2 className="text-3xl font-bold">CarTrader</h2>
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-4">Your destination for buying and selling cars</h3>
                  <p className="mb-6">Join thousands of satisfied users who have found their perfect car or sold their vehicle quickly and easily.</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-full">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Easy Listings</h4>
                        <p className="text-sm text-white/80">Create detailed car listings with photos in minutes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-full">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Secure Messaging</h4>
                        <p className="text-sm text-white/80">Communicate safely with buyers and sellers</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-full">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">Advanced Search</h4>
                        <p className="text-sm text-white/80">Find exactly what you're looking for with powerful filters</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <p className="text-sm text-white/80 italic">
                    "I sold my car in just 3 days on CarTrader. The process was so easy and I got a great price!"
                    <br />— Michael S., CarTrader User
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
