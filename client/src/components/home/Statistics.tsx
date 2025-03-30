import { Users, Car, ThumbsUp, Award } from "lucide-react";

export default function Statistics() {
  const stats = [
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      value: "25,000+",
      label: "Happy Customers"
    },
    {
      icon: <Car className="h-6 w-6 text-primary" />,
      value: "10,000+",
      label: "Cars Sold"
    },
    {
      icon: <ThumbsUp className="h-6 w-6 text-primary" />,
      value: "99.8%",
      label: "Satisfaction Rate"
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      value: "15+",
      label: "Years of Experience"
    }
  ];

  return (
    <section className="py-14 bg-primary">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                {stat.icon}
              </div>
              <div className="text-white">
                <p className="text-3xl lg:text-4xl font-bold mb-1">{stat.value}</p>
                <p className="text-white/80">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}