import { Link } from "wouter";
import { Car, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const { toast } = useToast();
  
  const showComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon",
      description: `${feature} feature will be available soon. Stay tuned!`,
      duration: 3000,
    });
  };
  return (
    <footer className="bg-white text-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-10 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold">CarMarkt</span>
              <Car className="h-5 w-5" />
            </div>
            <p className="text-gray-600 mb-6">
              The trusted marketplace for buying and selling cars. Connect with buyers and sellers in your area.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Menu */}
          <div className="md:col-span-1">
            <div>
              <h3 className="font-bold text-lg mb-5">Menu</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/browse">
                    <span className="text-gray-600 hover:text-primary transition cursor-pointer">Browse Cars</span>
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works">
                    <span className="text-gray-600 hover:text-primary transition cursor-pointer">How It Works</span>
                  </Link>
                </li>
                <li>
                  <Link href="/sell">
                    <span className="text-gray-600 hover:text-primary transition cursor-pointer">Sell Your Car</span>
                  </Link>
                </li>
                <li>
                  <span 
                    onClick={() => showComingSoon('Pricing')}
                    className="text-gray-600 hover:text-primary transition cursor-pointer"
                  >
                    Pricing
                  </span>
                </li>
                <li>
                  <span 
                    onClick={() => showComingSoon('Dealers')}
                    className="text-gray-600 hover:text-primary transition cursor-pointer"
                  >
                    Dealers
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Useful Links */}
          <div className="md:col-span-1">
            <div>
              <h3 className="font-bold text-lg mb-5">Useful Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy">
                    <span className="text-gray-600 hover:text-primary transition cursor-pointer">Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service">
                    <span className="text-gray-600 hover:text-primary transition cursor-pointer">Terms of Service</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} CarMarkt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
