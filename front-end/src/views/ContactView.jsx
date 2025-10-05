import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";

const ContactView = () => {
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    subject: "",
    category: "general",
    message: "",
    priority: "normal"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Support",
      description: "Get a response within 24 hours",
      value: "support@securevault.com",
      action: "mailto:support@securevault.com",
      color: "blue"
    },
    {
      icon: "💬",
      title: "Live Chat",
      description: "Chat with our support team",
      value: "Available 9 AM - 5 PM",
      action: "#",
      color: "green"
    },
    {
      icon: "🐦",
      title: "Twitter",
      description: "Follow us for updates",
      value: "@SecureVault",
      action: "https://twitter.com/securevault",
      color: "sky"
    },
    {
      icon: "🐙",
      title: "GitHub",
      description: "Report issues and contribute",
      value: "github.com/securevault",
      action: "https://github.com/toashu123/PassOP---Password-manager",
      color: "gray"
    }
  ];

  const faqs = [
    {
      question: "How secure is my data?",
      answer: "Your data is protected with AES-256-GCM encryption, the same standard used by banks and governments. All encryption happens on your device, meaning we never have access to your unencrypted passwords.",
      category: "security"
    },
    {
      question: "What happens if I forget my master password?",
      answer: "Due to our zero-knowledge architecture, we cannot recover your master password. However, you can set up recovery options during account creation, including backup codes and trusted devices.",
      category: "security"
    },
    {
      question: "Can I use SecureVault on multiple devices?",
      answer: "Yes! Your encrypted vault syncs across all your devices. Install the browser extension on any browser and access your passwords securely.",
      category: "features"
    },
    {
      question: "Is there a mobile app?",
      answer: "Mobile apps for iOS and Android are currently in development and will be available soon. In the meantime, you can access SecureVault through your mobile browser.",
      category: "features"
    },
    {
      question: "How do I import passwords from another password manager?",
      answer: "Go to Settings > Backup & Sync > Import Data. We support importing from CSV files exported from most major password managers including LastPass, 1Password, and Dashlane.",
      category: "help"
    },
    {
      question: "Is SecureVault free?",
      answer: "Yes! SecureVault is completely free and open-source. We believe everyone deserves secure password management without paywalls.",
      category: "general"
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Contact form submitted:", formData);
      
      toast.success("Message sent successfully! We'll get back to you within 24 hours.", {
        position: "top-center",
        autoClose: 5000
      });
      
      // Reset form
      setFormData({
        name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
        subject: "",
        category: "general",
        message: "",
        priority: "normal"
      });
      
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-100 via-green-50 to-emerald-50 rounded-2xl p-8 md:p-12 border-2 border-green-200 shadow-lg text-center">
        <div className="text-6xl mb-4">📞</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Get in Touch
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Have a question, suggestion, or need help? We're here to assist you!
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {contactMethods.map((method, index) => (
          <a
            key={index}
            href={method.action}
            target={method.action.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className={`bg-white rounded-2xl p-6 border-2 border-${method.color}-100 hover:border-${method.color}-300 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
          >
            <div className="text-4xl mb-3">{method.icon}</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{method.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{method.description}</p>
            <p className={`text-sm font-medium text-${method.color}-600`}>{method.value}</p>
          </a>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">✉️</span>
            Send Us a Message
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                placeholder="john@example.com"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="security">Security Concern</option>
                  <option value="billing">Billing Question</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors"
                placeholder="How can we help you?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows="6"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors resize-none"
                placeholder="Tell us more about your question or concern..."
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Sending...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">❓</span>
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {faqs.slice(0, showFAQ ? faqs.length : 4).map((faq, index) => (
                <details
                  key={index}
                  className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden"
                >
                  <summary className="px-4 py-3 font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 transition-colors">
                    {faq.question}
                  </summary>
                  <div className="px-4 py-3 text-sm text-gray-600 border-t border-gray-200">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
            
            <button
              onClick={() => setShowFAQ(!showFAQ)}
              className="mt-4 text-green-600 hover:text-green-700 font-medium text-sm"
            >
              {showFAQ ? '▲ Show Less' : '▼ Show More FAQs'}
            </button>
          </div>

          {/* Response Time Info */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              Response Times
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Email Support</span>
                <span className="text-sm font-bold text-blue-900">Within 24 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Bug Reports</span>
                <span className="text-sm font-bold text-blue-900">Within 48 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Security Issues</span>
                <span className="text-sm font-bold text-blue-900">Immediate</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              Connect With Us
            </h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="flex-1 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors text-center"
              >
                🐦 Twitter
              </a>
              <a
                href="#"
                className="flex-1 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors text-center"
              >
                💼 LinkedIn
              </a>
              <a
                href="#"
                className="flex-1 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors text-center"
              >
                🐙 GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔐</div>
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Security Notice</h3>
            <p className="text-sm text-red-800">
              <strong>Important:</strong> We will never ask for your master password via email, chat, or any other channel. 
              If you encounter a security issue, please report it immediately to <strong>security@securevault.com</strong> 
              or use the "Security Concern" category in the contact form above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactView;
