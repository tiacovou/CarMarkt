

export default function PrivacyPolicy() {
  // Set the document title
  document.title = "Privacy Policy | CarMarkt";
  
  return (
    <div className="container mx-auto px-4 py-12">
      
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last Updated: April 1, 2025</p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-gray-600">
              Welcome to CarMarkt. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. The Data We Collect</h2>
            <p className="text-gray-600 mb-3">
              We may collect, use, store and transfer different kinds of personal data about you including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Identity Data: including username, name, and phone number.</li>
              <li>Contact Data: including email address and location.</li>
              <li>Technical Data: including IP address, browser type and version, location, operating system, and other technology identifiers.</li>
              <li>Usage Data: including information about how you use our website and services.</li>
              <li>Car Listing Data: including information about cars you list for sale.</li>
              <li>Message Data: including messages sent to other users through our platform.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
            <p className="text-gray-600 mb-3">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>To register you as a new customer.</li>
              <li>To process your car listings.</li>
              <li>To manage our relationship with you.</li>
              <li>To facilitate communication between buyers and sellers.</li>
              <li>To administer and protect our business and website.</li>
              <li>To deliver relevant website content and advertisements to you.</li>
              <li>To process payments and subscriptions.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
            <p className="text-gray-600">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used, or accessed in an unauthorized way. We limit access to your personal data to those employees, 
              agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <p className="text-gray-600">
              We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
              including for the purposes of satisfying any legal, accounting, or reporting requirements. Car listings will be 
              automatically deleted one month after their creation date.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Legal Rights</h2>
            <p className="text-gray-600 mb-3">
              Under data protection laws, you have rights in relation to your personal data that include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>The right to request access to your personal data.</li>
              <li>The right to request correction of your personal data.</li>
              <li>The right to request erasure of your personal data.</li>
              <li>The right to object to processing of your personal data.</li>
              <li>The right to request restriction of processing your personal data.</li>
              <li>The right to request transfer of your personal data.</li>
              <li>The right to withdraw consent.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
            <p className="text-gray-600">
              Our website may use third-party services such as payment processors (Stripe) and SMS verification services. 
              These services have their own privacy policies regarding the information we are required to provide to them.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
            <p className="text-gray-600">
              We use cookies to distinguish you from other users of our website, to provide you with a better experience when 
              you browse our website, and to improve our site. You can set your browser to refuse all or some browser cookies, 
              or to alert you when websites set or access cookies.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
            <p className="text-gray-600">
              We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy 
              policy on this page and updating the "Last Updated" date at the top of this policy.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this privacy policy or our privacy practices, please contact us through our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}