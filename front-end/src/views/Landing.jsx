import React, { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const Landing = () => {
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showVideo, setShowVideo] = useState(false);


  const handleSendMessage = async () => {
    if (!userName.trim() || !userEmail.trim() || !message.trim()) {
      toast.error("Please fill all fields before sending.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }


    try {
      const res = await axios.post("http://localhost:3000/feedback", {
        name: userName,
        email: userEmail,
        message: message,
      });


      if (res.data.success) {
        console.log("Toast should show now!");
        toast.success("Message sent!");
        setUserName("");
        setUserEmail("");
        setMessage("");
      } else {
        toast.error(res.data.message || "Failed to send message.");
      }
    } catch (err) {
      toast.error("Error sending message.");
      console.error("Feedback error:", err);
    }
  };


  const { redirectToSignIn } = useClerk();
  const login = () => redirectToSignIn();
  const handleWatchDemo = () => setShowVideo((prev) => !prev);
  const handleVideoEnd = () => setShowVideo(false);


  // Reusable Avatar Component
  const Avatar = ({ initials, size = "60" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#16A34A" />
      <text
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="40"
        fontFamily="Arial, sans-serif"
        fill="white"
      >
        {initials}
      </text>
    </svg>
  );


  // Reusable Star Rating Component
  const StarRating = () => (
    <svg width="200" height="40" viewBox="0 0 250 50" xmlns="http://www.w3.org/2000/svg">
      <g fill="#FFC107">
        {[10, 60, 110, 160, 210].map((x, i) => (
          <polygon
            key={i}
            points="10,0 13,8 22,8 15,13 18,21 10,16 2,21 5,13 -2,8 7,8"
            transform={`translate(${x},15) scale(1.5)`}
          />
        ))}
      </g>
    </svg>
  );


  // Feature cards data
  const features = [
    {
      icon: (
        <svg width="80" height="80" viewBox="0 0 82 87" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="41" cy="43.5" r="41" fill="#DFFCEF" />
          <path
            d="M41 22L55 29V42C55 52.4934 48.2275 60.3279 41 63.5C33.7725 60.3279 27 52.4934 27 42V29L41 22Z"
            stroke="black"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Military-Grade Security",
      description: "Your passwords are protected with AES-256 encryption and zero-knowledge architecture."
    },
    {
      icon: (
        <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="60" fill="#DFFCEF" />
          <g stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="72" y="40" width="12" height="60" transform="rotate(45 72 40)" fill="none" />
            <line x1="38" y1="45" x2="38" y2="55" />
            <line x1="33" y1="50" x2="43" y2="50" />
            <line x1="82" y1="73" x2="82" y2="83" />
            <line x1="77" y1="78" x2="87" y2="78" />
            <line x1="55" y1="28" x2="55" y2="36" />
            <line x1="51" y1="32" x2="59" y2="32" />
          </g>
        </svg>
      ),
      title: "Password Generator",
      description: "Generate strong, unique passwords with customizable length and character sets."
    },
    {
      icon: (
        <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="60" fill="#DFFCEF" />
          <g stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M40 45 H60 L65 50 H80 C82.7614 50 85 52.2386 85 55 V80 C85 82.7614 82.7614 85 80 85 H40 C37.2386 85 35 82.7614 35 80 V50 C35 47.2386 37.2386 45 40 45 Z" fill="none" />
            <path d="M65 65c-2.5-4-10-4-12 0" />
            <path d="M53 66l-2-4 4-2" />
            <path d="M63 66c2.5 4 10 4 12 0" />
            <path d="M75 65l2 4-4 2" />
          </g>
        </svg>
      ),
      title: "Cross-Platform Sync",
      description: "Access your passwords anywhere with automatic synchronization across all devices."
    }
  ];


  const additionalFeatures = [
    {
      title: "Auto-Fill",
      description: "Automatically fill login forms with one click for seamless browsing experience."
    },
    {
      title: "Dark Web Monitoring",
      description: "Get alerts if your credentials are found in data breaches or on the dark web."
    },
    {
      title: "Secure Sharing",
      description: "Share passwords securely with team members or family without exposing them."
    }
  ];


  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "Software Engineer",
      initials: "SJ",
      review: "PassOP has completely transformed how I manage my passwords. The interface is intuitive and the security features give me peace of mind."
    },
    {
      name: "Michael Chen",
      title: "Marketing Director",
      initials: "MC",
      review: "The password generator is fantastic, and the auto-fill feature saves me so much time. I can't imagine going back to managing passwords manually."
    },
    {
      name: "Emily Parker",
      title: "Cybersecurity Analyst",
      initials: "EP",
      review: "As a security professional, I'm impressed with PassOP's architecture. The zero-knowledge design and encryption standards are top-notch."
    }
  ];


  const trustBadges = [
    { title: "AES-256 Encryption", description: "Military-grade encryption protects your data" },
    { title: "Zero-Knowledge", description: "We can't see your passwords, ever" },
    { title: "SOC 2 Type II", description: "Independently audited security" },
    { title: "24/7 Monitoring", description: "Continuous security monitoring" }
  ];


  return (
    <>
      <ToastContainer position="top-center" />
      
      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 lg:px-20 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Side Content */}
        <div className="w-full lg:w-1/2 mb-8 lg:mb-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black mb-4 sm:mb-6 leading-tight">
            Your secure <br /> Password Manager
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
            Store, generate, and manage all your passwords in one secure place.
            Never forget another password again with PassOP.
          </p>


          {/* Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
            <button
              className="bg-green-600 text-white flex justify-center items-center gap-2 sm:gap-3 font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-green-700 transition cursor-pointer text-sm sm:text-base"
              onClick={login}
            >
              <lord-icon
                src="https://cdn.lordicon.com/aupkjxuw.json"
                trigger="hover"
                style={{ width: "30px", height: "30px" }}
              ></lord-icon>
              Get Started Free
            </button>
            <button
              className="flex items-center justify-center gap-2 border border-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-100 transition cursor-pointer text-sm sm:text-base"
              onClick={handleWatchDemo}
            >
              <lord-icon
                src="https://cdn.lordicon.com/rfoqztsr.json"
                trigger="hover"
                style={{ width: "30px", height: "30px" }}
              ></lord-icon>
              Watch Demo
            </button>
          </div>


          {showVideo && (
            <div className="mt-4 sm:mt-6">
              <video
                src="/icons/video.mp4"
                controls
                autoPlay
                onEnded={handleVideoEnd}
                className="w-full max-w-3xl rounded-xl shadow-lg"
              />
            </div>
          )}


          {/* Stats */}
          <div className="flex flex-wrap gap-6 sm:gap-10 text-center text-black font-semibold">
            <div>
              <div className="text-lg sm:text-xl">10K+</div>
              <div className="text-xs sm:text-sm text-gray-500">Users</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl">256-bit</div>
              <div className="text-xs sm:text-sm text-gray-500">Encryption</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl">99.9%</div>
              <div className="text-xs sm:text-sm text-gray-500">Uptime</div>
            </div>
          </div>
        </div>


        {/* Right Side Image + Features */}
        <div className="relative bg-white shadow-xl rounded-xl p-4 sm:p-6 w-full lg:w-1/2">
          <img
            src="/icons/img0.png"
            alt="Secure Access"
            className="rounded-lg w-full h-60 sm:h-80 object-cover"
          />


          <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-green-600 text-white px-2 sm:px-3 py-1 rounded-full rotate-12 text-xs sm:text-sm shadow-md">
            🔒 Secure
          </div>


          <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-black text-white px-2 sm:px-3 py-1 rounded-full -rotate-12 text-xs sm:text-sm shadow-md">
            🔐 Encrypted
          </div>


          <ul className="mt-4 sm:mt-6 space-y-2">
            <li className="text-green-600 font-medium text-sm sm:text-base">● Bank-grade security</li>
            <li className="text-green-600 font-medium text-sm sm:text-base">● Auto-sync across devices</li>
            <li className="text-green-600 font-medium text-sm sm:text-base">● Password generation</li>
          </ul>
        </div>
      </section>


      {/* Why Choose Section */}
      <div className="py-8 sm:py-12 flex flex-col justify-center items-center text-center px-4">
        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Why Choose PassOP?</span>
        <span className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl">
          Advanced security features combined with intuitive design to keep your digital life protected.
        </span>
      </div>


      {/* Feature Cards */}
      <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 sm:gap-6 px-4 sm:px-6 lg:px-20 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="shadow-xl bg-white flex flex-col p-4 sm:p-5 rounded-lg w-full md:w-1/3">
            <div className="mb-3">{feature.icon}</div>
            <span className="text-lg sm:text-xl md:text-2xl font-medium mb-2 sm:mb-3">{feature.title}</span>
            <span className="text-sm sm:text-base text-gray-600">{feature.description}</span>
          </div>
        ))}
      </div>


      {/* Additional Features */}
      <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 sm:gap-6 px-4 sm:px-6 lg:px-20 mb-12">
        {additionalFeatures.map((feature, index) => (
          <div key={index} className="shadow-xl bg-white flex flex-col p-4 sm:p-5 rounded-lg w-full md:w-1/3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mb-3 text-xl sm:text-2xl">
              {index === 0 ? "⚡" : index === 1 ? "👁️" : "🔗"}
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-medium mb-2 sm:mb-3">{feature.title}</span>
            <span className="text-sm sm:text-base text-gray-600">{feature.description}</span>
          </div>
        ))}
      </div>


      {/* Demo Section */}
      <div className="py-8 sm:py-12 flex flex-col justify-center items-center text-center px-4">
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">See PassOP in Action</span>
        <span className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl">
          Experience the intuitive interface that makes password management effortless
        </span>
      </div>


      <div className="px-4 sm:px-6 md:px-10 lg:px-20 mb-12">
        <img className="rounded-xl sm:rounded-2xl w-full shadow-lg" src="/icons/front.png" alt="PassOP Dashboard" />
      </div>


      {/* Trust Section */}
      <div className="py-8 sm:py-12 flex flex-col justify-center items-center text-center px-4">
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Trusted by Security Experts</span>
        <span className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl">
          PassOP meets the highest security standards and is trusted by professionals worldwide.
        </span>
      </div>


      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-6 px-4 sm:px-6 lg:px-20 mb-12">
        {trustBadges.map((badge, index) => (
          <div key={index} className="flex flex-col items-center justify-center text-center w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
            <img
              className="rounded-xl hover:brightness-75 transition-all w-full h-40 sm:h-48 object-cover mb-3"
              src={`/icons/img${index + 1}.png`}
              alt={badge.title}
            />
            <span className="text-base sm:text-lg font-bold">{badge.title}</span>
            <span className="text-sm sm:text-base text-gray-600 mt-2">{badge.description}</span>
          </div>
        ))}
      </div>


      {/* Testimonials */}
      <div className="py-8 sm:py-12 flex flex-col justify-center items-center text-center px-4">
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">What Our Users Say</span>
        <span className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl">
          Join thousands of satisfied users who trust PassOP with their digital security.
        </span>
      </div>


      <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 sm:gap-6 px-4 sm:px-6 lg:px-20 mb-12">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="shadow-xl bg-white flex flex-col p-4 sm:p-5 rounded-lg w-full md:w-1/3">
            <StarRating />
            <span className="text-gray-700 mt-3 text-sm leading-relaxed">{testimonial.review}</span>
            <div className="mt-4 flex items-center gap-3">
              <Avatar initials={testimonial.initials} size="50" />
              <div className="flex flex-col">
                <span className="text-blue-800 font-semibold text-sm sm:text-base">{testimonial.name}</span>
                <span className="text-gray-600 text-xs sm:text-sm">{testimonial.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* CTA Section */}
      <div className="bg-slate-800 w-full py-12 sm:py-16 md:py-20 flex flex-col justify-center items-center text-center px-4">
        <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
          Ready to Secure Your Digital Life?
        </span>
        <span className="text-white text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mb-6 sm:mb-10">
          Join thousands of users who trust PassOP to keep their passwords safe and secure.
        </span>


        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <button
            className="bg-green-600 text-white flex justify-center items-center gap-2 sm:gap-3 font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-green-700 transition cursor-pointer text-sm sm:text-base"
            onClick={login}
          >
            <lord-icon
              src="https://cdn.lordicon.com/aupkjxuw.json"
              trigger="hover"
              style={{ width: "30px", height: "30px" }}
            ></lord-icon>
            Get Started Free
          </button>
          <button
            className="flex items-center justify-center text-white gap-2 border border-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-700 transition cursor-pointer text-sm sm:text-base"
            onClick={handleWatchDemo}
          >
            <lord-icon
              src="https://cdn.lordicon.com/rfoqztsr.json"
              trigger="hover"
              style={{ width: "30px", height: "30px" }}
            ></lord-icon>
            Watch Demo
          </button>
        </div>
      </div>


      {/* Contact Section */}
      <div className="py-8 sm:py-12 flex flex-col justify-center items-center text-center px-4">
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Get in Touch</span>
        <span className="text-sm sm:text-base md:text-lg text-gray-600">
          Have questions about PassOP? We'd love to hear from you.
        </span>
      </div>


      <section className="bg-white py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 lg:px-20 flex flex-col lg:flex-row items-start justify-between gap-8">
        <div className="flex flex-col gap-4 w-full lg:w-1/3">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Avatar initials="EP" size="50" />
              <div className="flex flex-col">
                <span className="text-blue-800 font-semibold text-sm sm:text-base">Emily Parker</span>
                <span className="text-gray-600 text-xs sm:text-sm">Cybersecurity Analyst</span>
              </div>
            </div>
          ))}
        </div>


        <div className="bg-blue-50 w-full lg:w-2/3 p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name</label>
              <input
                className="bg-white rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email</label>
              <input
                className="bg-white rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                placeholder="your@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="bg-white rounded-md px-3 py-2 border border-gray-300 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>
            <button
              className="bg-green-600 hover:bg-green-700 text-white rounded-md py-2.5 sm:py-3 font-semibold transition"
              onClick={handleSendMessage}
            >
              Send Message
            </button>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 pt-8 sm:pt-10 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-white mb-2">&lt;PassOP/&gt;</div>
              <div className="text-sm mb-4">Your own Password Manager</div>
              <div className="flex space-x-3 sm:space-x-4 mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="w-3 h-3 sm:w-4 sm:h-4 bg-white block rounded"></span>
                  </span>
                ))}
              </div>
            </div>


            {[
              { title: "Product", links: ["Features", "Security", "Pricing", "Enterprise"] },
              { title: "Support", links: ["Help Center", "Contact Us", "Documentation", "API"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] }
            ].map((section, index) => (
              <div key={index}>
                <div className="font-semibold text-white mb-2 text-sm sm:text-base">{section.title}</div>
                <ul className="space-y-2">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className="hover:underline text-xs sm:text-sm">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>


          <div className="border-t border-gray-700 my-6 sm:my-8"></div>
          <div className="text-center text-gray-400 text-xs sm:text-sm">
            © 2024 PassOP. All rights reserved. | Created with <span className="text-pink-500">❤️</span> by Ashu
          </div>
        </div>
      </footer>
    </>
  );
};


export default Landing;
