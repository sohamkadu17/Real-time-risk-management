import { Zap, TrendingUp, Radio, Shield, Gauge, Clock, Building2, Activity, Eye, BarChart3, Users, Award, Github, Linkedin, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { getMarketStatus, MarketStatus } from "../../services/market";

interface AboutScreenProps {
  isDarkMode: boolean;
}

export function AboutScreen({ isDarkMode }: AboutScreenProps) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateMarketStatus = async () => {
      try {
        const status = await getMarketStatus('NSE');
        setMarketStatus(status);
      } catch (error) {
        console.error('Failed to fetch market status:', error);
      }
    };

    const updateTime = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      setCurrentTime(istTime.toLocaleTimeString('en-IN', { 
        hour12: false, 
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateMarketStatus();
    updateTime();
    
    const marketInterval = setInterval(updateMarketStatus, 30000); // Update every 30 seconds
    const timeInterval = setInterval(updateTime, 1000); // Update every second

    return () => {
      clearInterval(marketInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const riskManagementConcepts = [
    {
      icon: Activity,
      title: "Live Market Monitoring",
      description: "Continuously watches your investments every second the market is open, identifying dangerous patterns before they cause losses"
    },
    {
      icon: Gauge,
      title: "Risk Threshold Alerts", 
      description: "Automatically warns you when your portfolio risk exceeds safe levels, helping you avoid catastrophic losses"
    },
    {
      icon: Eye,
      title: "Portfolio Protection",
      description: "Smart algorithms that detect when your investments are becoming too risky and suggest protective actions"
    },
    {
      icon: BarChart3,
      title: "Intelligent Decision Support",
      description: "Provides instant recommendations on whether to buy, sell, or hold based on current market conditions and your risk tolerance"
    },
  ];

  const riskManagementBenefits = [
    {
      title: "Real-Time Loss Prevention",
      description: "Instant alerts when your portfolio exceeds risk thresholds, preventing major losses before they happen with continuous market monitoring"
    },
    {
      title: "Automated Risk Monitoring", 
      description: "24/7 continuous monitoring of your investments with intelligent alerts based on market volatility, position sizes, and correlation risks"
    },
    {
      title: "Portfolio Optimization",
      description: "Dynamic rebalancing suggestions based on real-time market conditions and your risk tolerance, maximizing returns while controlling downside"
    },
    {
      title: "Instant Decision Support",
      description: "Live analytics showing exactly when to buy, sell, or hold based on current market conditions and your specific risk profile"
    }
  ];

  const technicalSpecs = [
    { name: "Performance", items: ["<100ms Latency", "1M+ Events/sec", "99.9% Uptime SLA"], color: "text-green-500" },
    { name: "Analytics Engine", items: ["Black-76 Pricing Model", "Greeks Computation", "Volatility Surface Modeling"], color: "text-blue-500" },
    { name: "Market Data Sources", items: ["NSE Live Feed", "BSE Market Data", "Multi-Asset Support"], color: "text-purple-500" },
  ];

  const teamMembers = [
    {
      name: "Risk Analytics Team",
      role: "Full-Stack Development", 
      description: "Passionate developers building the future of financial risk management",
      skills: ["React", "Python", "FastAPI", "Risk Management"]
    }
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className={`text-4xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Real-Time Risk Management System
            </h1>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Advanced financial risk monitoring and portfolio protection for Indian equity markets
            </p>
          </div>
          
          {/* Live Market Status */}
          {marketStatus && (
            <div className={`p-4 rounded-xl border min-w-[280px] ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={`size-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Live Market Status
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>NSE Status:</span>
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${
                      marketStatus.isOpen ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>IST Time:</span>
                  <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentTime}
                  </span>
                </div>
                {marketStatus.nextSessionStart && (
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Next Open:</span>
                    <span className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                      {marketStatus.nextSessionStart}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why Real-Time Risk Management? */}
      <div className={`rounded-xl p-6 mb-8 border ${
        isDarkMode ? 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-800/30' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Shield className="inline-block mr-2 size-6" />
          Why Real-Time Risk Management?
        </h2>
        <div className={`p-4 rounded-lg mb-4 ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'
        }`}>
          <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Regular stock checking shows you what happened.</strong> 
            <br />Real-time monitoring shows you <strong className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>what's happening now</strong> 
            and <strong className={isDarkMode ? 'text-red-400' : 'text-red-600'}>protects your money</strong> automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskManagementBenefits.map((benefit, index) => (
            <div key={index} className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                {benefit.title}
              </h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* What is Real-Time Risk Management? */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          What is Real-Time Risk Management?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskManagementConcepts.map((concept) => {
            const Icon = concept.icon;
            return (
              <div
                key={concept.title}
                className={`p-5 rounded-xl border transition-all hover:shadow-lg ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20' : 'bg-gradient-to-br from-green-50 to-blue-50'
                  }`}>
                    <Icon className={`size-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {concept.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {concept.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Real Problem */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          The Problem with Manual Stock Monitoring
        </h2>
        <div className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gradient-to-br from-red-900/20 to-gray-800/20 border-red-800/30' : 'bg-gradient-to-br from-red-50 to-gray-50 border-red-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                ❌ What Happens Without Real-Time Monitoring
              </h3>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• You check stocks manually 2-3 times a day</li>
                <li>• By the time you see a loss, it's already too late</li>
                <li>• You miss opportunities because you weren't watching</li>
                <li>• Emotional decisions based on fear or greed</li>
                <li>• No systematic way to manage risk</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                ✅ What This System Does for You
              </h3>
              <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• Watches your investments 24/7 automatically</li>
                <li>• Alerts you the moment risk increases</li>
                <li>• Never misses an opportunity or threat</li>
                <li>• Removes emotions from investment decisions</li>
                <li>• Scientific risk management with proven algorithms</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Project Mission */}
      <div className={`rounded-xl p-6 mb-8 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-800/30' 
          : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <Award className={`size-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            About RiskGuard
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              🏆 Our Mission
            </h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Democratizing institutional-grade risk management tools for retail investors in India. 
              Making advanced financial analytics accessible to everyone, not just large institutions.
            </p>
          </div>
          
          <div>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              🎯 Technology Focus
            </h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Real-time risk analytics with sub-second latency, AI-powered insights, 
              and seamless integration with Indian stock exchanges (NSE/BSE).
            </p>
          </div>
        </div>
      </div>


      {/* Team Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Development Team
          </h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {teamMembers.map((member, index) => (
            <div key={index} className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'
                }`}>
                  <Users className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {member.name}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {member.role}
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {member.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {member.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className={`px-2 py-1 text-xs rounded-full ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 border border-gray-600' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Support */}
      <div className={`rounded-xl p-6 mb-8 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-teal-900/20 to-blue-900/20 border-teal-800/30' 
          : 'bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          🤝 Connect & Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Github className={`size-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Open Source
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Contribute to the future of fintech
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Mail className={`size-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Feedback
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Help us improve the platform
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Linkedin className={`size-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Network
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Connect with the team
            </p>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <div className={`rounded-xl p-6 border ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700' 
          : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
      }`}>
        <div className="text-center">
          <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Your Personal Investment Protection System
          </h3>
          <p className={`text-sm mb-4 max-w-3xl mx-auto leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            This system acts like a smart guardian for your investments, continuously monitoring the Indian stock market 
            and protecting your money from unexpected losses. It's like having a professional risk manager working 
            for you 24/7, but at a fraction of the cost.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs">
            <span className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              🛡️ Automatic Risk Protection
            </span>
            <span className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              ⚡ Real-time Market Monitoring
            </span>
            <span className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              📊 Smart Investment Decisions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
