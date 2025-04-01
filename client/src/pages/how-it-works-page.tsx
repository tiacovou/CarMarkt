import { Button } from "@/components/ui/button";
import { 
  UserRound, 
  CameraIcon, 
  FileText, 
  EuroIcon, 
  CheckCircle 
} from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";

export default function HowItWorksPage() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    <>
      <Header />
      <main className="min-h-screen">
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">How to List & Sell Your Car</h1>
            <p className="text-xl max-w-2xl mx-auto text-center">Our streamlined process makes it easy to create a listing and sell your car quickly in Cyprus.</p>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-center mb-12">Creating Your Listing</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {listingSteps.map((step, index) => (
                  <div key={index} className="text-center bg-gray-50 rounded-xl p-6 shadow-sm">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      {step.icon}
                    </div>
                    <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto -mt-16 mb-2 font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-center">Ready to Sell Your Car?</h3>
              <p className="text-gray-600 mb-6 text-center">
                Start creating your car listing today and reach thousands of potential buyers in Cyprus.
              </p>
              <div className="text-center">
                <Link href="/sell">
                  <Button size="lg" className="px-8">Start Selling Now</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}