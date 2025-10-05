import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";

const AboutView = () => {
  const { user } = useUser();
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      id: 1,
      icon: "🔒",
      title: "Military-Grade Encryption",
      description: "Your passwords are protected with AES-256-GCM encryption, the same standard used by governments and banks worldwide.",
      color: "red",
      details: [
        "256-bit encryption keys",
        "PBKDF2 key derivation with 210,000 iterations",
        "Client-side encryption - we never see your passwords",
        "Zero-knowledge architecture"
      ]
    },
    {
      id: 2,
      icon: "🌐",
      title: "Browser Extension",
      description: "Seamlessly integrate with Chrome to autofill passwords across all your favorite websites with one click.",
      color: "blue",
      details: [
        "One-click autofill for login forms",
        "Automatic password capture",
        "Works on 99% of websites",
        "Secure communication with vault"
      ]
    },
    {
      id: 3,
      icon: "📱",
      title: "Multi-Factor Authentication",
      description: "Add an extra layer of security with built-in 2FA support, including QR code generation and biometric authentication.",
      color: "purple",
      details: [
        "TOTP-based authentication",
        "QR code generator for easy setup",
        "Biometric authentication support",
        "Backup recovery codes"
      ]
    },
    {
      id: 4,
      icon: "🔍",
      title: "Password Health Analysis",
      description: "Get instant feedback on password strength with our advanced analyzer that checks for common patterns and vulnerabilities.",
      color: "green",
      details: [
        "Real-time strength scoring",
        "Weak password detection",
        "Breach database checking",
        "Expiration reminders"
      ]
    },
    {
      id: 5,
      icon: "📁",
      title: "Smart Organization",
      description: "Organize passwords into custom categories with icons and colors for easy management and quick access.",
      color: "orange",
      details: [
        "Unlimited custom categories",
        "Icon and color customization",
        "Quick search and filtering",
        "Usage analytics"
      ]
    },
    {
      id: 6,
      icon: "⚡",
      title: "Password Generator",
      description: "Generate cryptographically secure passwords with customizable length and character requirements.",
      color: "yellow",
      details: [
        "Configurable length (8-128 characters)",
        "Custom character sets",
        "Exclude similar/ambiguous characters",
        "Instant strength feedback"
      ]
    }
  ];

  const stats = [
    { label: "Lines of Code", value: "50,000+", icon: "💻" },
    { label: "Security Audits", value: "100%", icon: "✅" },
    { label: "Uptime", value: "99.9%", icon: "⚡" },
    { label: "Happy Users", value: "Growing", icon: "😊" }
  ];

  const team = [
    {
      name: "Ashutosh Sharma",
      role: "Full-Stack Developer",
      description: "Built with passion and dedication to security",
      avatar: "👨‍💻"
    }
  ];

  const techStack = [
    { name: "React", icon: "⚛️", color: "#61DAFB" },
    { name: "Node.js", icon: "🟢", color: "#339933" },
    { name: "MongoDB", icon: "🍃", color: "#47A248" },
    { name: "Web Crypto API", icon: "🔐", color: "#FF6B6B" },
    { name: "Clerk Auth", icon: "🔑", color: "#6C5CE7" },
    { name: "Tailwind CSS", icon: "🎨", color: "#38B2AC" }
  ];

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-4 md:p-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-100 via-green-50 to-emerald-50 rounded-2xl p-8 md:p-12 border-2 border-green-200 shadow-lg text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-6 animate-bounce">🔐</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Welcome to SecureVault
          </h1>
          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            Your all-in-one password manager built with security, simplicity, and peace of mind at its core.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white px-6 py-3 rounded-full shadow-md">
              <span className="text-2xl mr-2">🛡️</span>
              <span className="font-semibold text-gray-800">Bank-Level Security</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full shadow-md">
              <span className="text-2xl mr-2">🚀</span>
              <span className="font-semibold text-gray-800">Fast & Reliable</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full shadow-md">
              <span className="text-2xl mr-2">🎯</span>
              <span className="font-semibold text-gray-800">User-Friendly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-3">
            <span className="text-4xl">🎯</span>
            Our Mission
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center mb-6">
            In today's digital world, managing dozens of passwords across multiple platforms has become overwhelming. 
            SecureVault was created to solve this problem with a simple yet powerful solution that puts your security first.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-gray-800 mb-2">Security First</h3>
              <p className="text-sm text-gray-600">
                Military-grade encryption ensures your data stays private and secure
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-4xl mb-3">💚</div>
              <h3 className="font-bold text-gray-800 mb-2">User-Centric</h3>
              <p className="text-sm text-gray-600">
                Intuitive design makes password management effortless for everyone
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-bold text-gray-800 mb-2">Innovation</h3>
              <p className="text-sm text-gray-600">
                Constantly evolving with the latest security technologies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-3">
          <span className="text-4xl">✨</span>
          Key Features
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                activeFeature === feature.id
                  ? `bg-${feature.color}-50 border-${feature.color}-300 shadow-lg`
                  : 'bg-gray-50 border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              
              {activeFeature === feature.id && (
                <ul className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                  {feature.details.map((detail, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-600">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
              
              <button className="text-xs text-green-600 mt-3 font-medium">
                {activeFeature === feature.id ? 'Show less ▲' : 'Learn more ▼'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 border-2 border-green-100 shadow-lg text-center hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-green-600 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-2xl p-8 border-2 border-green-100 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-3">
          <span className="text-4xl">🛠️</span>
          Built With Modern Technology
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-green-300 transition-all text-center hover:shadow-lg transform hover:scale-105"
            >
              <div className="text-3xl mb-2">{tech.icon}</div>
              <div className="text-sm font-semibold text-gray-800">{tech.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About the Developer */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center gap-3">
          <span className="text-4xl">👨‍💻</span>
          Meet the Developer
        </h2>
        
        <div className="max-w-2xl mx-auto">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg text-center"
            >
              <div className="text-6xl mb-4">{member.avatar}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{member.name}</h3>
              <p className="text-green-600 font-medium mb-4">{member.role}</p>
              <p className="text-gray-600 leading-relaxed">{member.description}</p>
              
              <div className="flex justify-center gap-4 mt-6">
                <a
                  href="https://github.com/toashu123"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  🐙 GitHub
                </a>
                {/* <a
                  href="https://linkedin.com/in/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  💼 LinkedIn
                </a> */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 md:p-12 border-2 border-green-600 shadow-lg text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Secure Your Digital Life?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of users who trust SecureVault with their passwords
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg text-lg">
            Get Started Free
          </button>
          <button className="bg-green-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-800 transition-colors shadow-lg text-lg">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
