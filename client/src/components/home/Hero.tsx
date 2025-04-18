import CarSearch from "@/components/car/CarSearch";
import { TypeAnimation } from 'react-type-animation';

export default function Hero() {
  return (
    <section className="relative bg-[#121c2c] text-white">
      <div className="absolute inset-0 bg-[#121c2c] z-10"></div>
      
      <div className="container mx-auto px-4 lg:px-6 py-28 md:py-36 lg:py-40 relative z-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight h-[4.5rem] md:h-[5.5rem] lg:h-[6.5rem]">
            <TypeAnimation
              sequence={[
                'Find Your Perfect Car in Cyprus',
                1000,
                'Find Your Dream Vehicle in Cyprus',
                1000,
                'Find Your Ideal Auto in Cyprus',
                1000,
              ]}
              wrapper="span"
              speed={50}
              style={{ display: 'inline-block' }}
              repeat={Infinity}
            />
          </h1>
          <p className="text-xl md:text-2xl mb-16 opacity-90 max-w-2xl mx-auto mt-12">Buy and sell vehicles with confidence on Cyprus' most trusted car marketplace</p>
        </div>
        
        {/* Search Filter Card */}
        <div className="max-w-6xl mx-auto">
          <CarSearch compact={true} />
        </div>
      </div>
    </section>
  );
}
