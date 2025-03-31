import { Shield, Users, Zap, Clock } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Secure Transactions",
      description: "Our platform provides a safe environment for buying and selling vehicles with fraud protection."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Phone-Verified Users",
      description: "All users are verified through secure phone verification, ensuring authenticity and building trust within our community."
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Fast Process",
      description: "Get your car listed in minutes and receive responses from potential buyers quickly."
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "24/7 Support",
      description: "Our customer service team is available around the clock to assist with any issues."
    }
  ];
  
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose CarTrader</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            We're dedicated to providing the best car buying and selling experience with these key benefits
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 p-6 lg:p-8 rounded-xl hover:shadow-lg transition-shadow duration-300"
            >
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}