import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, SmartphoneIcon, Check, ArrowRight } from "lucide-react";
import { phoneVerificationConfirmSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";

type PhoneVerifyValues = z.infer<typeof phoneVerificationConfirmSchema>;

interface PreRegisterVerificationProps {
  phone: string;
  verificationCode?: string;
  registerData: any;
  onBack: () => void;
  onVerificationComplete: (phone: string, code: string) => void;
}

export default function PreRegisterVerification({ 
  phone, 
  verificationCode, 
  registerData,
  onBack,
  onVerificationComplete 
}: PreRegisterVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  // Setup the verification code form
  const verifyCodeForm = useForm<PhoneVerifyValues>({
    resolver: zodResolver(phoneVerificationConfirmSchema),
    defaultValues: {
      phone: phone,
      code: verificationCode || "",
    }
  });

  // Pre-fill code if provided (for demo purposes)
  if (verificationCode && !verifyCodeForm.getValues().code) {
    verifyCodeForm.setValue("code", verificationCode);
  }

  // Verify code
  const handleCodeSubmit = (data: PhoneVerifyValues) => {
    // Here we're not making an API call yet - we'll pass the code to the parent component
    // which will include it with the registration data
    onVerificationComplete(data.phone, data.code);
  };

  // Resend code
  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/verify-phone/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send verification code");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the new verification code",
        variant: "default",
      });
      
      setIsResending(false);
      
      // For demo purposes, we're getting the code directly
      if (data.code) {
        // This is just for demo, in a real app it would be sent via SMS
        toast({
          title: "Demo Only",
          description: `Your verification code is: ${data.code}`,
          variant: "default",
        });
        
        verifyCodeForm.setValue("code", data.code);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification code",
        description: error.message,
        variant: "destructive",
      });
      setIsResending(false);
    }
  });

  const handleResendCode = () => {
    setIsResending(true);
    resendMutation.mutate();
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
        <CardDescription>
          Enter the verification code sent to your phone to complete registration
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <SmartphoneIcon className="h-4 w-4" />
          <span>{phone}</span>
        </div>
        
        <Form {...verifyCodeForm}>
          <form onSubmit={verifyCodeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
            <FormField
              control={verifyCodeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit code" 
                      {...field} 
                      className="text-center text-lg tracking-widest"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2 flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back
              </Button>
              
              <Button 
                type="submit" 
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Verify & Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-4">
        <Button 
          variant="link" 
          onClick={handleResendCode}
          disabled={isResending || resendMutation.isPending}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending new code...
            </>
          ) : (
            "Didn't receive a code? Send again"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}