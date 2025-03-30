import { Star, User } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      rating: 5,
      quote: "I sold my BMW in less than a week using CarTrader. The process was smooth, and I got exactly what I was asking for. Highly recommend!",
      name: "Michael S.",
      role: "BMW 3 Series Seller"
    },
    {
      rating: 4.5,
      quote: "As a first-time car buyer, I was nervous about the process. CarTrader made it simple and transparent. I found my perfect Honda and couldn't be happier!",
      name: "Sarah J.",
      role: "Honda Civic Buyer"
    },
    {
      rating: 5,
      quote: "I've bought and sold multiple vehicles on CarTrader. The platform is user-friendly, secure, and attracts serious buyers. It's now my go-to for anything automotive!",
      name: "David R.",
      role: "Multiple Transactions"
    }
  ];
  
  return (
    <section id="testimonials" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Don't take our word for it. Here's what people are saying about their CarTrader experience.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  {testimonial.rating % 1 !== 0 && (
                    <Star className="h-4 w-4 fill-current" />
                  )}
                </div>
                <span className="ml-2 text-gray-600">{testimonial.rating.toFixed(1)}</span>
              </div>
              
              <blockquote className="mb-4 text-gray-700">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="flex items-center">
                <div className="bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center text-gray-700 mr-3">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
