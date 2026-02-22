import { useState, useEffect } from "react";
import { TrendingUp, Shield, Activity, Zap, ArrowRight, Play, Menu, X } from "lucide-react";

interface LandingPageProps {
  isDarkMode: boolean;
  onGetStarted: () => void;
}

export function LandingPage({ isDarkMode, onGetStarted }: LandingPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Shield className="size-8" />,
      title: "Real-time Risk Assessment",
      description: "Advanced algorithms monitor market fluctuations and portfolio exposure in real-time",
      color: "text-teal-500"
    },
    {
      icon: <Activity className="size-8" />,
      title: "Live Market Analytics", 
      description: "Stream live data from NSE, BSE with sub-second latency and professional-grade insights",
      color: "text-blue-500"
    },
    {
      icon: <Zap className="size-8" />,
      title: "Intelligent Alerts",
      description: "Smart notification system with customizable thresholds and risk-based prioritization", 
      color: "text-green-500"
    },
    {
      icon: <TrendingUp className="size-8" />,
      title: "Predictive Insights",
      description: "AI-powered risk predictions with explainable machine learning models",
      color: "text-white-500"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className={`min-h-screen overflow-hidden relative ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900' 
        : 'bg-gradient-to-br from-teal-50 via-white to-blue-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-float ${
          isDarkMode ? 'bg-teal-500' : 'bg-teal-300'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 animate-float animation-delay-1000 ${
          isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-10 animate-rotate-slow ${
          isDarkMode ? 'bg-emerald-500' : 'bg-emerald-300'
        }`}></div>
      </div>

      {/* Navigation Bar */}
      <nav className={`relative z-20 w-full backdrop-blur-lg border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/80 border-white/10' 
          : 'bg-white/80 border-black/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-teal-500/20' 
                  : 'bg-teal-50'
              }`}>
                <Shield className={`size-6 ${
                  isDarkMode ? 'text-teal-400' : 'text-teal-600'
                }`} />
              </div>
              <span className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Risk<span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">Guard</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Features
              </a>
              <a href="#analytics" className={`text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Analytics
              </a>
              <a href="#contact" className={`text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Contact
              </a>
              
              <button
                onClick={onGetStarted}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-500 hover:to-blue-500'
                    : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600'
                } hover-lift`}
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className={`md:hidden py-4 border-t animate-slide-in-up ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <div className="flex flex-col space-y-3">
                <a href="#features" className={`py-2 text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}>
                  Features
                </a>
                <a href="#analytics" className={`py-2 text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}>
                  Analytics
                </a>
                <a href="#contact" className={`py-2 text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}>
                  Contact
                </a>
                <button
                  onClick={onGetStarted}
                  className={`mt-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-500 hover:to-blue-500'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600'
                  } hover-lift`}
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center pt-20 pb-16 min-h-screen px-4 text-center">
        {/* Hero Section */}
        <div className={`transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="mb-8 animate-scale-in">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 animate-pulse-glow ${
              isDarkMode 
                ? 'bg-gradient-to-r from-teal-600 to-blue-600' 
                : 'bg-gradient-to-r from-teal-500 to-blue-500'
            }`}>
              <Shield className="size-10 text-white" />
            </div>
          </div>
          
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 animate-slide-in-up ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Risk<span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">Guard</span>
          </h1>
          
          <p className={`text-xl md:text-2xl mb-8 max-w-3xl animate-slide-in-up animation-delay-200 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Real-time risk management platform powered by AI, delivering 
            <span className="font-semibold text-teal-600"> institutional-grade </span>
            market analytics and predictive insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-in-up animation-delay-400">
            <button
              onClick={onGetStarted}
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover-lift hover-glow ${
                isDarkMode
                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-500 hover:to-blue-500'
                  : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600'
              } group flex items-center gap-2`}>
              <Play className="size-5" />
              Get Started
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className={`px-8 py-4 rounded-full font-semibold text-lg border-2 transition-all duration-300 hover-lift ${
              isDarkMode
                ? 'border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-white'
                : 'border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white'
            }`}>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Features Carousel */}
        <div className={`max-w-4xl w-full transition-all duration-1000 animation-delay-600 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className={`rounded-3xl p-8 backdrop-blur-lg border transition-all duration-500 animate-fade-in-scale ${
            isDarkMode 
              ? 'bg-white/10 border-white/20' 
              : 'bg-white/70 border-white/40'
          }`}>
            <div className="flex items-center justify-center mb-6 animate-gentle-bounce">
              <div className={`p-4 rounded-full ${features[currentFeature].color} bg-opacity-20`}>
                {features[currentFeature].icon}
              </div>
            </div>
            
            <h3 className={`text-2xl font-bold mb-4 animate-fade-in ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {features[currentFeature].title}
            </h3>
            
            <p className={`text-lg animate-fade-in animation-delay-200 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {features[currentFeature].description}
            </p>
            
            {/* Feature Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature
                      ? 'bg-teal-500 scale-110'
                      : isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-500'
                        : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-3 gap-8 mt-16 animate-slide-in-up animation-delay-800 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <div className="text-center">
            <div className="text-3xl font-bold animate-gentle-bounce">99.9%</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold animate-gentle-bounce animation-delay-200">&lt; 50ms</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold animate-gentle-bounce animation-delay-400">24/7</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monitoring</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className={`py-20 px-4 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-gray-50 to-white'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Powerful Features
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Comprehensive risk management tools designed for modern financial institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`p-8 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 hover-lift ${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                  : 'bg-white/80 border-gray/20 hover:bg-white'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${feature.color} bg-opacity-20`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className={`py-20 px-4 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 to-teal-50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Advanced Analytics
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Real-time market data visualization and predictive analytics powered by AI
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className={`p-6 rounded-xl backdrop-blur-lg border ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/80 border-gray/20'
                }`}>
                  <h3 className={`text-2xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                     ⚪ Real-time Market Data
                  </h3>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Live streaming data from NSE, BSE with sub-second latency
                  </p>
                </div>

                <div className={`p-6 rounded-xl backdrop-blur-lg border ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/80 border-gray/20'
                }`}>
                  <h3 className={`text-2xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ⚪ AI-Powered Predictions
                  </h3>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Machine learning models for risk assessment and market forecasting
                  </p>
                </div>

                <div className={`p-6 rounded-xl backdrop-blur-lg border ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/80 border-gray/20'
                }`}>
                  <h3 className={`text-2xl font-bold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                     ⚪ Interactive Dashboards
                  </h3>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Customizable charts and real-time risk visualization
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-2xl backdrop-blur-lg border ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/80 border-gray/20'
            }`}>
              <div className="aspect-video bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                <div className="text-white text-center">
                  <Activity className="size-16 mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-semibold">Live Analytics Dashboard</p>
                  <p className="text-sm opacity-80">Click "Get Started" to explore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-20 px-4 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-slate-900' 
          : 'bg-gradient-to-br from-white to-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Get In Touch
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Ready to transform your risk management? Let's discuss your needs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className={`p-6 rounded-xl backdrop-blur-lg border ${
                isDarkMode 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/80 border-gray/20'
              }`}>
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-teal-500/20">
                      <Activity className="size-5 text-teal-500" />
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Email
                      </p>
                      <p className={`${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        hello@riskguard.ai
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Shield className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Support
                      </p>
                      <p className={`${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        24/7 Enterprise Support
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <TrendingUp className="size-5 text-green-500" />
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Demo
                      </p>
                      <p className={`${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Schedule a personalized demo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-xl backdrop-blur-lg border ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/80 border-gray/20'
            }`}>
              <form className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Name
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="your.email@company.com"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Tell us about your risk management needs..."
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover-lift ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-500 hover:to-blue-500'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600'
                  }`}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}