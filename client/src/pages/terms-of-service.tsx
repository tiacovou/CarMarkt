import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { Link } from "wouter";

export default function TermsOfService() {
  // Set the document title
  document.title = "Terms of Service | CarMarkt";
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <p className="text-gray-500 mb-8">Last Updated: April 1, 2025</p>
        
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-gray-600">
                  Welcome to CarMarkt. By using our website, you agree to these Terms of Service. 
                  Please read them carefully. If you do not agree to these Terms, you may not use our services.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">2. Definitions</h2>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li><strong>Account:</strong> Your personal registration with CarMarkt.</li>
                  <li><strong>User:</strong> Any individual who accesses or uses the CarMarkt platform.</li>
                  <li><strong>Listing:</strong> A car advertisement posted by a Seller on the CarMarkt platform.</li>
                  <li><strong>Seller:</strong> A User who posts a Listing on the CarMarkt platform.</li>
                  <li><strong>Buyer:</strong> A User who views Listings and contacts Sellers on the CarMarkt platform.</li>
                  <li><strong>Content:</strong> Any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on the CarMarkt platform.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
                <p className="text-gray-600 mb-3">
                  To use certain features of the CarMarkt platform, you must register for an account. When you register, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate and complete information.</li>
                  <li>Maintain and promptly update your account information.</li>
                  <li>Keep your password secure and confidential.</li>
                  <li>Notify CarMarkt immediately of any unauthorized use of your account.</li>
                  <li>Be responsible for all activities that occur under your account.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">4. Car Listings</h2>
                <p className="text-gray-600 mb-3">
                  When posting a car listing on CarMarkt, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate information about the vehicle.</li>
                  <li>Post only vehicles that you own or have the right to sell.</li>
                  <li>Include only appropriate and relevant photos of the vehicle.</li>
                  <li>Set a reasonable asking price for the vehicle.</li>
                  <li>Respond promptly to inquiries from potential buyers.</li>
                  <li>Keep your listing up-to-date and remove it when the vehicle is sold.</li>
                </ul>
                <p className="text-gray-600 mt-3">
                  All listings expire and are automatically deleted after one month from their creation date.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">5. Free and Premium Services</h2>
                <p className="text-gray-600 mb-3">
                  CarMarkt offers both free and premium services:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Free users may post up to 2 active car listings per month.</li>
                  <li>Premium subscribers can post unlimited car listings.</li>
                  <li>CarMarkt reserves the right to change the terms of free and premium services at any time.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">6. Payments and Subscriptions</h2>
                <p className="text-gray-600 mb-3">
                  By subscribing to premium services or making payments on CarMarkt, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate and complete payment information.</li>
                  <li>Pay all fees and charges incurred through your account.</li>
                  <li>Authorize CarMarkt to charge your chosen payment method.</li>
                </ul>
                <p className="text-gray-600 mt-3">
                  Subscription plans automatically renew unless canceled before the renewal date. Refunds are provided in accordance with applicable laws.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">7. User Conduct</h2>
                <p className="text-gray-600 mb-3">
                  When using CarMarkt, you agree NOT to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Post false, misleading, or fraudulent content.</li>
                  <li>Harass, abuse, or harm another person.</li>
                  <li>Use the platform for any illegal purpose.</li>
                  <li>Infringe or violate the rights of others.</li>
                  <li>Post inappropriate or offensive content.</li>
                  <li>Interfere with or disrupt the platform or servers.</li>
                  <li>Attempt to gain unauthorized access to any part of the platform.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
                <p className="text-gray-600">
                  CarMarkt and its content, features, and functionality are protected by copyright, trademark, and other intellectual property laws.
                  You may not copy, modify, distribute, sell, or lease any part of our services without express permission.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
                <p className="text-gray-600">
                  CarMarkt is provided on an "as is" and "as available" basis. We make no warranties, 
                  express or implied, regarding the reliability, availability, or accuracy of our services.
                  In no event shall CarMarkt be liable for any indirect, consequential, or incidental damages.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
                <p className="text-gray-600">
                  You agree to indemnify and hold harmless CarMarkt and its affiliates, officers, directors, 
                  employees, and agents from any claims, damages, losses, liabilities, and expenses arising 
                  out of your use of the platform or violation of these Terms.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
                <p className="text-gray-600">
                  CarMarkt reserves the right to terminate or suspend your account and access to our services 
                  at any time for any reason without notice. Upon termination, your right to use CarMarkt will immediately cease.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
                <p className="text-gray-600">
                  We may modify these Terms of Service at any time. The updated terms will be posted on this page 
                  with a revised "Last Updated" date. Your continued use of CarMarkt after any changes constitutes 
                  acceptance of the modified terms.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
                <p className="text-gray-600">
                  These Terms shall be governed by and construed in accordance with the laws of Cyprus,
                  without regard to its conflict of law provisions.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">14. Contact Information</h2>
                <p className="text-gray-600">
                  If you have any questions about these Terms, please contact us through our website.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}