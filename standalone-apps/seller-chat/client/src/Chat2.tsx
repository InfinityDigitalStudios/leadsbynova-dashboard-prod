import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, User, Mail, Phone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

// User information interface for data capture
interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
}

// Chat data collection interface for sellers
interface SellerChatData {
  name: string;
  timeline: string;
  haveAgent: string;
  needToBuy: string;
  propertyType: string;
  occupancyStatus: string;
  priceRange: string;
  recentUpgrades: string;
  bookedCall: string;
  daySelected?: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface AnswerOption {
  id: string;
  text: string;
}

// Helper function to get next business days
const getNextBusinessDays = () => {
  const days = [];
  const now = new Date();
  
  // Convert to Eastern Time
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const isAfterNoon = easternTime.getHours() >= 12;
  
  let startDate = new Date(easternTime);
  if (isAfterNoon) {
    // If after noon, start from tomorrow
    startDate.setDate(startDate.getDate() + 1);
  }
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  let currentDate = new Date(startDate);
  let businessDaysFound = 0;
  
  while (businessDaysFound < 3) {
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dayName = dayNames[dayOfWeek];
      const monthName = monthNames[currentDate.getMonth()];
      const dayNum = currentDate.getDate();
      const suffix = getDaySuffix(dayNum);
      
      days.push({
        label: `${dayName}, ${monthName} ${dayNum}${suffix}`,
        date: new Date(currentDate)
      });
      businessDaysFound++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

// Helper function to get day suffix (st, nd, rd, th)
const getDaySuffix = (day: number) => {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

export default function Chat2() {
  // Data capture state
  const [showDataCapture, setShowDataCapture] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    email: '',
    phone: ''
  });
  const [dataErrors, setDataErrors] = useState<{[key: string]: string}>({});
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<AnswerOption[]>([
    { id: "yes", text: "Yes" },
    { id: "no", text: "No" }
  ]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  
  // Chat data collection
  const [chatData, setChatData] = useState<Partial<SellerChatData>>({
    name: '',
    timeline: '',
    haveAgent: '',
    needToBuy: '',
    propertyType: '',
    occupancyStatus: '',
    priceRange: '',
    recentUpgrades: '',
    bookedCall: '',
    daySelected: '',
    timestamp: ''
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Data capture form validation and submission
  const validateUserInfo = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!userInfo.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!userInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!userInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+\.]{10,}$/.test(userInfo.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setDataErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleStartChat = () => {
    if (validateUserInfo()) {
      setShowDataCapture(false);
      initializeChat();
    }
  };
  
  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (dataErrors[field]) {
      setDataErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAnswers]);

  // Handle countdown timer
  useEffect(() => {
    if (countdownSeconds !== null && countdownSeconds > 0) {
      const timer = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdownSeconds]);

  // Update countdown message content
  useEffect(() => {
    if (countdownSeconds !== null) {
      setMessages(prev => prev.map(msg => 
        (msg.id === "countdown-message" || msg.id === "countdown-message-unknown")
          ? { ...msg, content: `This chat page will redirect in ${countdownSeconds} seconds.` }
          : msg
      ));
    }
  }, [countdownSeconds]);

  // Initialize chat when user data is captured
  const initializeChat = () => {
    const firstName = userInfo.fullName.split(' ')[0] || 'there';
    
    // Initialize chat data with user's name
    setChatData(prev => ({
      ...prev,
      name: userInfo.fullName,
      timestamp: new Date().toISOString()
    }));
    
    const firstQuestion: ChatMessage = {
      id: "q1",
      content: `Hi ${firstName}! The delivery of your link is currently being prepared and should arrive in your email within the next few minutes.\n\nWhile you wait would you be willing to answer a few quick questions to help me better understand your current stage in the home selling process?`,
      isBot: true,
      timestamp: new Date()
    };
    setMessages([firstQuestion]);
  };

  // Save chat progress in real-time as answers are given
  const saveChatProgress = async (updatedChatData: Partial<SellerChatData>) => {
    try {
      if (!userInfo.email) {
        console.warn('No email found for saving chat progress');
        return;
      }

      await apiRequest('/api/chat/update-lead', {
        method: 'POST',
        body: {
          email: userInfo.email,
          name: chatData.name || '',
          phone: userInfo.phone || '',
          ...updatedChatData
        }
      });

      console.log('Chat progress saved successfully');
    } catch (error) {
      console.error('Error saving chat progress:', error);
    }
  };

  const sendLeadNotification = async (isScheduled: boolean = false, appointmentDetails?: string) => {
    try {
      const finalChatData = {
        ...chatData,
        bookedCall: isScheduled ? 'Yes, scheduled call' : 'No, did not schedule call',
        daySelected: appointmentDetails || chatData.daySelected || ''
      };

      await apiRequest('/api/chat/update-lead', {
        method: 'POST',
        body: {
          email: userInfo.email,
          name: finalChatData.name || '',
          phone: userInfo.phone,
          timeline: finalChatData.timeline,
          haveAgent: finalChatData.haveAgent,
          needToBuy: finalChatData.needToBuy,
          propertyType: finalChatData.propertyType,
          occupancyStatus: finalChatData.occupancyStatus,
          priceRange: finalChatData.priceRange,
          recentUpgrades: finalChatData.recentUpgrades,
          bookedCall: finalChatData.bookedCall,
          daySelected: finalChatData.daySelected
        }
      });

      console.log('Lead notification sent successfully');
    } catch (error) {
      console.error('Error sending lead notification:', error);
    }
  };

  const handleAnswerClick = (answerId: string) => {
    const selectedAnswer = currentAnswers.find(a => a.id === answerId);
    if (selectedAnswer) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: selectedAnswer.text,
        isBot: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Clear answer options immediately and show typing
      setCurrentAnswers([]);
      setIsTyping(true);
      
      setTimeout(() => {
        if (answerId === "yes") {
          // Q1 Yes response - Ask about timeline for selling (first seller question)
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "What is your timeline for selling your home?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([
            { id: "asap", text: "As soon as possible" },
            { id: "within3months", text: "Within 3 months" },
            { id: "3-6months", text: "3–6 months" },
            { id: "6plus-exploring", text: "6+ months / just exploring" }
          ]);
        } else if (answerId === "no") {
          // Q1 No response - Thank and redirect
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Thank you for your time. Your free guide will be delivered to your email shortly. We hope you have a wonderful day.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]); // Clear answers for redirect
          
          // Redirect after 5 seconds
          setTimeout(() => {
            window.location.href = "https://infinitydigitalstudios.com";
          }, 5000);
        } else if (["asap", "within3months", "3-6months", "6plus-exploring"].includes(answerId)) {
          // Q2 timeline responses - proceed to agent question
          const timelineMap: { [key: string]: string } = {
            "asap": "As soon as possible",
            "within3months": "Within 3 months",
            "3-6months": "3–6 months",
            "6plus-exploring": "6+ months / just exploring"
          };
          const updatedData = { 
            ...chatData, 
            timeline: timelineMap[answerId] 
          };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Have you already chosen a real estate agent to work with?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "agent-yes", text: "Yes" },
              { id: "agent-no", text: "No" },
              { id: "agent-deciding", text: "Still deciding" }
            ]);
          }, 1000);
        } else if (["agent-yes", "agent-no", "agent-deciding"].includes(answerId)) {
          // Q3 agent responses - proceed to buying question
          const agentMap: { [key: string]: string } = {
            "agent-yes": "Yes",
            "agent-no": "No", 
            "agent-deciding": "Still deciding"
          };
          const updatedData = { ...chatData, haveAgent: agentMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Do you also need to buy a new home?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "buy-locally", text: "Yes, locally" },
              { id: "buy-relocating", text: "Yes, relocating out of town" },
              { id: "just-selling", text: "No, just selling" }
            ]);
          }, 1000);
        } else if (["buy-locally", "buy-relocating", "just-selling"].includes(answerId)) {
          // Q4 buying responses - proceed to property type question
          const buyingMap: { [key: string]: string } = {
            "buy-locally": "Yes, locally",
            "buy-relocating": "Yes, relocating out of town",
            "just-selling": "No, just selling"
          };
          const updatedData = { ...chatData, needToBuy: buyingMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "What type of property are you selling?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "single-family", text: "Single-family home" },
              { id: "condo-townhome", text: "Condo/townhome" },
              { id: "multi-family", text: "Multi-family property" },
              { id: "land", text: "Land" }
            ]);
          }, 1000);
        } else if (["single-family", "condo-townhome", "multi-family", "land"].includes(answerId)) {
          // Q5 property type responses - proceed to occupancy question
          const propertyMap: { [key: string]: string } = {
            "single-family": "Single-family home",
            "condo-townhome": "Condo/townhome",
            "multi-family": "Multi-family property",
            "land": "Land"
          };
          const updatedData = { ...chatData, propertyType: propertyMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Is your home currently occupied?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "owner-occupied", text: "Owner-occupied" },
              { id: "tenant-occupied", text: "Tenant-occupied" },
              { id: "vacant", text: "Vacant" }
            ]);
          }, 1000);
        } else if (["owner-occupied", "tenant-occupied", "vacant"].includes(answerId)) {
          // Q6 occupancy responses - proceed to price range question
          const occupancyMap: { [key: string]: string } = {
            "owner-occupied": "Owner-occupied",
            "tenant-occupied": "Tenant-occupied",
            "vacant": "Vacant"
          };
          const updatedData = { ...chatData, occupancyStatus: occupancyMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Do you have a price range in mind for your home?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "know-target", text: "Yes, I already know my target price" },
              { id: "rough-idea", text: "I have a rough idea" },
              { id: "need-guidance", text: "I'm not sure — need guidance" }
            ]);
          }, 1000);
        } else if (["know-target", "rough-idea", "need-guidance"].includes(answerId)) {
          // Q7 price range responses - proceed to upgrades question
          const priceMap: { [key: string]: string } = {
            "know-target": "Yes, I already know my target price",
            "rough-idea": "I have a rough idea",
            "need-guidance": "I'm not sure — need guidance"
          };
          const updatedData = { ...chatData, priceRange: priceMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Have you made any major upgrades or renovations recently?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "recent-upgrades", text: "Yes, within the last 2 years" },
              { id: "older-upgrades", text: "Yes, but longer than 2 years ago" },
              { id: "no-upgrades", text: "No major upgrades" }
            ]);
          }, 1000);
        } else if (["recent-upgrades", "older-upgrades", "no-upgrades"].includes(answerId)) {
          // Q8 upgrades responses - proceed to call scheduling
          const upgradesMap: { [key: string]: string } = {
            "recent-upgrades": "Yes, within the last 2 years",
            "older-upgrades": "Yes, but longer than 2 years ago",
            "no-upgrades": "No major upgrades"
          };
          const updatedData = { ...chatData, recentUpgrades: upgradesMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Thank you for all that information! Would you like to schedule a brief call with Sarah to discuss your selling goals?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            setCurrentAnswers([
              { id: "schedule-yes", text: "Yes" },
              { id: "schedule-no", text: "No" }
            ]);
          }, 1000);
        } else if (answerId === "schedule-no") {
          // No to scheduling - thank and redirect
          setChatData(prev => ({ 
            ...prev, 
            bookedCall: "No, did not schedule call"
          }));
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "No problem at all! Your seller's guide will be delivered to your email shortly. If you change your mind and would like to chat, feel free to reach out to us anytime.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Send lead notification (chat completed without scheduling)
          sendLeadNotification(false);
          
          // Redirect after 5 seconds
          setTimeout(() => {
            window.location.href = "https://infinitydigitalstudios.com";
          }, 5000);
        } else if (answerId === "schedule-yes") {
          // Yes to scheduling - proceed to day selection
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Great! When would be a good time for you?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Generate business day options
          setTimeout(() => {
            const businessDays = getNextBusinessDays();
            setCurrentAnswers(businessDays.map((day, index) => ({
              id: `day-${index}`,
              text: day.label
            })));
          }, 1000);
        } else if (answerId.startsWith("day-")) {
          // Day selected - show time slots
          const selectedAnswer = currentAnswers.find(a => a.id === answerId);
          setSelectedDay(selectedAnswer?.text || '');
          setCurrentAnswers([]);
          setIsTyping(true);
          
          setTimeout(() => {
            const timeResponse: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: "What time works best for you?",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, timeResponse]);
            setIsTyping(false);
            
            // Show time slot options
            setTimeout(() => {
              setCurrentAnswers([
                { id: "time-morning", text: "Morning (9AM - 12PM Eastern Time)" },
                { id: "time-midday", text: "Mid-Day (12PM - 3PM Eastern Time)" },
                { id: "time-afternoon", text: "Afternoon (3PM - 6PM Eastern Time)" }
              ]);
            }, 1000);
          }, 1000);
          return; // Skip the normal flow since we handle it manually
        } else if (answerId.startsWith("time-")) {
          // Time slot selected - end of conversation
          const selectedTimeAnswer = currentAnswers.find(a => a.id === answerId);
          const selectedTime = selectedTimeAnswer?.text || '';
          const fullSchedule = `${selectedDay} at ${selectedTime}`;
          
          setChatData(prev => ({ 
            ...prev, 
            bookedCall: "Yes, scheduled call",
            daySelected: fullSchedule
          }));
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: `Perfect! I've scheduled your call for ${selectedDay} at ${selectedTime}. Sarah will reach out to you at that time!`,
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Send lead notification (chat completed with call scheduled)
          sendLeadNotification(true, fullSchedule);
          
          // Add redirect message after a brief pause
          setTimeout(() => {
            const redirectMessage: ChatMessage = {
              id: "countdown-message",
              content: "This chat page will redirect in 10 seconds.",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, redirectMessage]);
            
            // Start countdown
            setCountdownSeconds(10);
            
            // Redirect after 10 seconds
            setTimeout(() => {
              window.location.href = "https://infinitydigitalstudios.com";
            }, 10000);
          }, 1500);
        } else {
          // Fallback for any other responses
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Thank you for that information. We'll be in touch soon!",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
        }
        setIsTyping(false);
      }, 1000);
    }
  };

  // Render data capture form
  if (showDataCapture) {
    return (
      <div className="min-h-screen animated-gradient-bg py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl drop-shadow-2xl border border-border soft-blue-bg" style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)" }} data-testid="card-data-capture">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-md ring-2 ring-white">
                  <img 
                    src="/placeholder-headshot.png" 
                    alt="Sarah Johnson" 
                    className="w-full h-full object-cover"
                    data-testid="img-sarah-avatar-form"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "#0D1A3A", fontFamily: "'Playfair Display', serif" }} data-testid="text-form-title">
                Chat with Sarah Johnson Realty
              </h1>
              <p className="text-sm form-luxury-text mt-2" data-testid="text-form-subtitle">
                Please provide your information to start our conversation
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium" style={{ color: "#0D1A3A" }}>
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={userInfo.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`mt-1 ${dataErrors.fullName ? 'border-red-500' : ''}`}
                    data-testid="input-fullname"
                  />
                  {dataErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1" data-testid="error-fullname">{dataErrors.fullName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium" style={{ color: "#0D1A3A" }}>
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 ${dataErrors.email ? 'border-red-500' : ''}`}
                    data-testid="input-email"
                  />
                  {dataErrors.email && (
                    <p className="text-red-500 text-xs mt-1" data-testid="error-email">{dataErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium" style={{ color: "#0D1A3A" }}>
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={userInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`mt-1 ${dataErrors.phone ? 'border-red-500' : ''}`}
                    data-testid="input-phone"
                  />
                  {dataErrors.phone && (
                    <p className="text-red-500 text-xs mt-1" data-testid="error-phone">{dataErrors.phone}</p>
                  )}
                </div>
              </div>
              
              <Button
                onClick={handleStartChat}
                className="w-full py-3 text-white font-semibold"
                style={{ 
                  backgroundColor: "#1E3A8A", 
                  fontFamily: "'Playfair Display', serif"
                }}
                data-testid="button-start-chat"
              >
                Start Chat with Sarah
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
        <Card className="shadow-2xl drop-shadow-2xl border border-border soft-blue-bg h-full flex flex-col" style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)" }} data-testid="card-chat">
          {/* Header */}
          <CardHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md ring-2 ring-white">
                <img 
                  src="/placeholder-headshot.png" 
                  alt="Sarah Johnson" 
                  className="w-full h-full object-cover"
                  data-testid="img-sarah-avatar"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#0D1A3A", fontFamily: "'Playfair Display', serif" }} data-testid="text-chat-title">
                  Chat with Sarah Johnson Realty
                </h1>
                <p className="text-sm form-luxury-text" data-testid="text-chat-subtitle">
                  Real Estate Questions & Guidance
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-6" ref={scrollAreaRef}>
              <div className="space-y-4 py-4" data-testid="messages-container">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                    data-testid={`message-${message.isBot ? "bot" : "user"}-${message.id}`}
                  >
                    <div
                      className={`${message.isBot ? "max-w-[70%]" : "max-w-[50%] w-full"} rounded-lg px-4 py-3 ${
                        message.isBot
                          ? "bg-white border border-border form-luxury-text"
                          : "text-white"
                      }`}
                      style={
                        !message.isBot
                          ? { backgroundColor: "#3B82F6", fontFamily: "'Playfair Display', serif" }
                          : {}
                      }
                    >
                      <p className="text-base leading-relaxed whitespace-pre-line" data-testid={`text-message-content-${message.id}`}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${message.isBot ? "text-muted-foreground" : "text-white/70"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Answer Options */}
                {currentAnswers.length > 0 && (
                  <div className="flex justify-end pl-4 sm:pl-32" data-testid="answer-options-container">
                    <div className="bg-white border border-border rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[50%] w-full">
                      <p className="text-sm font-semibold form-luxury-text mb-3">Choose an answer:</p>
                      <div className="space-y-2">
                        {currentAnswers.map((answer) => (
                          <button
                            key={answer.id}
                            onClick={() => handleAnswerClick(answer.id)}
                            className="w-full text-left rounded-lg px-3 py-2 font-medium transition-all hover:opacity-90 active:scale-95"
                            style={{ 
                              backgroundColor: "#1E3A8A", 
                              fontFamily: "'Playfair Display', serif",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                              color: "white"
                            }}
                            data-testid={`button-answer-${answer.id}`}
                          >
                            {answer.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start" data-testid="typing-indicator">
                    <div className="bg-white border border-border rounded-lg px-4 py-3 max-w-[70%]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}