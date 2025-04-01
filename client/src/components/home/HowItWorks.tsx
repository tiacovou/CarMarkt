import { Button } from "@/components/ui/button";
import { 
  UserRound, 
  CameraIcon, 
  FileText, 
  EuroIcon, 
  CheckCircle 
} from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  const listingSteps = [
    {
      icon: <UserRound className="h-8 w-8 text-primary" />,
      title: "Create Account",
      description: "Register and verify your phone number for a secure selling experience."
    },
    {
      icon: <CameraIcon className="h-8 w-8 text-primary" />,
      title: "Take Photos",
      description: "Capture clear photos of your car from multiple angles to showcase its features and condition."
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Enter Details",
      description: "Provide comprehensive information including make, model, year, mileage, and condition."
    },
    {
      icon: <EuroIcon className="h-8 w-8 text-primary" />,
      title: "Set Your Price",
      description: "Set a competitive price based on market value and vehicle condition in Euros."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "Publish Listing",
      description: "Review your listing and publish it to reach thousands of potential buyers across Cyprus."
    },
  ];
  

  
  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How to List & Sell Your Car</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our streamlined process makes it easy to create a listing and sell your car quickly in Cyprus.</p>
        </div>
        
        <div className="mb-16">
          <h3 className="text-xl font-bold text-center mb-8">Creating Your Listing</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {listingSteps.map((step, index) => (
              <div key={index} className="text-center bg-gray-50 rounded-xl p-6 shadow-sm">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto -mt-16 mb-2 font-bold">
                  {index + 1}
                </div>
                <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Link href="/sell">
            <Button size="lg" className="px-8">Start Selling Now</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
