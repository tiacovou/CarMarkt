import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Loader2, SmartphoneIcon, CheckCircle2 } from "lucide-react";
import { phoneVerificationRequestSchema, phoneVerificationConfirmSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Create the form schemas using zod
type PhoneRequestValues = z.infer<typeof phoneVerificationRequestSchema>;
type PhoneVerifyValues = z.infer<typeof phoneVerificationConfirmSchema>;

export default function PhoneVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  // Get the current verification status
  const { data: verificationStatus, isLoading } = useQuery<{
    phone: string | null;
    verified: boolean;
    hasPhone: boolean;
  }>({
    queryKey: ["/api/user/verify-phone/status"],
    refetchOnWindowFocus: false,
  });

  // Setup the phone request form
  const phoneRequestForm = useForm<PhoneRequestValues>({
    resolver: zodResolver(phoneVerificationRequestSchema),
    defaultValues: {
      phone: verificationStatus?.phone || "",
    }
  });

  // Update form when phone is loaded from API
  useEffect(() => {
    if (verificationStatus?.phone) {
      phoneRequestForm.setValue("phone", verificationStatus.phone);
    }
  }, [verificationStatus, phoneRequestForm]);

  // Setup the verification code form
  const verifyCodeForm = useForm<PhoneVerifyValues>({
    resolver: zodResolver(phoneVerificationConfirmSchema),
    defaultValues: {
      phone: "",
      code: "",
    }
  });

  // Request verification code mutation
  const requestMutation = useMutation({
    mutationFn: async (data: PhoneRequestValues) => {
      const res = await apiRequest("POST", "/api/user/verify-phone/request", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code",
        variant: "default",
      });
      
      setIsVerifying(true);
      verifyCodeForm.setValue("phone", phoneRequestForm.getValues().phone);
      
      // For demo purposes, we're getting the code directly
      // In a real app, this would be sent via SMS only
      if (data.code) {
        // This is just for demo, in a real app it would be sent via SMS
        toast({
          title: "Demo Only",
          description: `Your verification code is: ${data.code}`,
          variant: "default",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification code",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Verify code mutation
  const verifyMutation = useMutation({
    mutationFn: async (data: PhoneVerifyValues) => {
      const res = await apiRequest("POST", "/api/user/verify-phone/confirm", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Phone verified!",
        description: "Your phone number has been successfully verified",
        variant: "default",
      });
      
      setIsVerifying(false);
      verifyCodeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/user/verify-phone/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePhoneSubmit = (data: PhoneRequestValues) => {
    requestMutation.mutate(data);
  };

  const handleCodeSubmit = (data: PhoneVerifyValues) => {
    verifyMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsVerifying(false);
    verifyCodeForm.reset();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (verificationStatus?.verified) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center mb-2 gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h3 className="font-medium">Phone Verified</h3>
          <Badge className="ml-auto bg-green-500 hover:bg-green-600">Verified</Badge>
        </div>
        <p className="text-sm text-gray-500 mb-2">Your phone number has been verified.</p>
        <div className="flex items-center">
          <SmartphoneIcon className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-gray-700">{verificationStatus.phone}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-medium mb-3 flex items-center">
        <SmartphoneIcon className="h-5 w-5 mr-2" />
        Phone Verification
        {!verificationStatus?.verified && (
          <Badge variant="outline" className="ml-auto">Not Verified</Badge>
        )}
      </h3>
      
      {!isVerifying ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Verify your phone number to increase trust with potential buyers/sellers.
          </p>
          
          <Form {...phoneRequestForm}>
            <form onSubmit={phoneRequestForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
              <FormField
                control={phoneRequestForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+357 99 123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit"
                className="w-full"
                disabled={requestMutation.isPending}
              >
                {requestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Enter the 6-digit verification code sent to your phone.
          </p>
          
          <Form {...verifyCodeForm}>
            <form onSubmit={verifyCodeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
              <FormField
                control={verifyCodeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  className="flex-1"
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={verifyMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Didn't receive a code? Check the phone number or try again in a few minutes.
              </p>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}