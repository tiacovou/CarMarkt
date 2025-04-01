import { useState } from "react";
import { useStripe, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OneTimePaymentFormProps {
  amount: number;
  description: string;
  type: "listing" | "premium";
  carId?: string;
  onSuccess: () => void;
}

export default function OneTimePaymentForm({ 
  amount, 
  description,
  type,
  carId,
  onSuccess 
}: OneTimePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        // If no redirect happened, the payment succeeded
        // Make API call to update our database
        await apiRequest("POST", "/api/payments", { 
          amount, 
          description, 
          type,
          carId
        });
        
        toast({
          title: "Payment Successful",
          description: type === "listing" 
            ? "Your listing has been renewed for another month" 
            : "Your payment has been processed successfully",
        });
        
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay €${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}