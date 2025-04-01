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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold">CarMarkt</span>
              <Car className="h-5 w-5" />
            </div>
            <p className="text-gray-600 mb-4">
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
          <div>
            <h3 className="font-bold text-lg mb-4">Menu</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse">
                  <a className="text-gray-600 hover:text-primary transition">Browse Cars</a>
                </Link>
              </li>
              <li>
                <Link href="/how-it-works">
                  <a className="text-gray-600 hover:text-primary transition">How It Works</a>
                </Link>
              </li>
              <li>
                <Link href="/sell">
                  <a className="text-gray-600 hover:text-primary transition">Sell Your Car</a>
                </Link>
              </li>
              <li>
                <a 
                  onClick={() => showComingSoon('Pricing')}
                  className="text-gray-600 hover:text-primary transition cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a 
                  onClick={() => showComingSoon('Dealers')}
                  className="text-gray-600 hover:text-primary transition cursor-pointer"
                >
                  Dealers
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Safety Tips</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} CarMarkt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
