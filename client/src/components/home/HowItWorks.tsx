import { Button } from "@/components/ui/button";
import { Car, MessageSquare, Handshake } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Car className="h-8 w-8 text-primary" />,
      title: "Create a Listing",
      description: "Take photos of your car, add details, and set your price. Our system makes it easy to create an attractive listing."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Connect with Buyers",
      description: "Receive messages from interested buyers, answer questions, and arrange test drives safely through our platform."
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: "Complete the Sale",
      description: "Finalize details, complete paperwork, and make the exchange. We provide guidance throughout the entire process."
    }
  ];
  
  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How CarTrader Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our platform makes buying and selling cars simple, secure, and straightforward.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/sell">
            <Button size="lg">Get Started Today</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
