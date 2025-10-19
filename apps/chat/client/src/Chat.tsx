import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

// Chat data collection interface
interface ChatData {
  name: string;
  prequalified: string;
  preQualificationRange: string;
  moveTimeline: string;
  haveAgent: string;
  budgetRange: string;
  propertyType: string;
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

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<AnswerOption[]>([
    { id: "yes", text: "Yes" },
    { id: "no", text: "No" }
  ]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  
  // Chat data collection
  const [chatData, setChatData] = useState<Partial<ChatData>>({
    name: '',
    prequalified: '',
    preQualificationRange: '',
    moveTimeline: '',
    haveAgent: '',
    budgetRange: '',
    propertyType: '',
    bookedCall: '',
    daySelected: '',
    timestamp: ''
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Initialize with first question
  useEffect(() => {
    // Get user's first name from session storage
    const fullName = sessionStorage.getItem('userFullName') || '';
    const firstName = fullName.split(' ')[0] || 'there';
    
    // Initialize chat data with user's name
    setChatData(prev => ({
      ...prev,
      name: fullName,
      timestamp: new Date().toISOString()
    }));
    
    const firstQuestion: ChatMessage = {
      id: "q1",
      content: `Hi ${firstName}! The delivery of your link is currently being prepared and should arrive in your email within the next few minutes.\n\nWhile you wait would you be willing to answer a few quick questions to help me better understand your current stage in the homebuying process?`,
      isBot: true,
      timestamp: new Date()
    };
    setMessages([firstQuestion]);
  }, []);

  // Function to send consolidated lead notification
  // Save chat progress in real-time as answers are given
  const saveChatProgress = async (updatedChatData: Partial<ChatData>) => {
    try {
      const email = sessionStorage.getItem('userEmail');
      if (!email) {
        console.warn('No email found for saving chat progress');
        return;
      }

      const response = await apiRequest('POST', '/api/chat/update-lead', {
        email,
        name: updatedChatData.name || '',
        ...updatedChatData,
        chatTimestamp: new Date().toISOString()
      });

      console.log('Chat progress saved successfully');
    } catch (error) {
      console.error('Error saving chat progress:', error);
    }
  };

  const sendLeadNotification = async (isScheduled: boolean = false, appointmentDetails?: string) => {
    try {
      const formData = {
        timestamp: new Date().toISOString(),
        name: chatData.name || '',
        email: sessionStorage.getItem('userEmail') || '',
        phone: sessionStorage.getItem('userPhone') || '',
        guide_type: sessionStorage.getItem('userGuideType') || ''
      };

      const chatDataForEmail = {
        ...chatData,
        timestamp: new Date().toISOString(),
        bookedCall: isScheduled ? 'Yes, scheduled call' : 'No, did not schedule call',
        daySelected: appointmentDetails || chatData.daySelected || ''
      };

      const response = await apiRequest('POST', '/api/chat/update-lead', {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        ...chatDataForEmail
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
          // Q1 Yes response - Ask about mortgage pre-qualification
          const updatedData = { ...chatData, prequalified: "Yes" };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Great! Are you pre-qualified for a mortgage?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([
            { id: "under250k", text: "Under $250,000" },
            { id: "250k-350k", text: "$250,000 - $350,000" },
            { id: "350k-500k", text: "$350,000 - $500,000" },
            { id: "500k-plus", text: "$500,000+" },
            { id: "no-prequalified", text: "No" }
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
        } else if (["under250k", "250k-350k", "350k-500k", "500k-plus"].includes(answerId)) {
          // Q2 mortgage amount responses - proceed to Q3
          const rangeMap: { [key: string]: string } = {
            "under250k": "Under $250,000",
            "250k-350k": "$250,000 - $350,000", 
            "350k-500k": "$350,000 - $500,000",
            "500k-plus": "$500,000+"
          };
          const updatedData = { 
            ...chatData, 
            prequalified: "Yes",
            preQualificationRange: rangeMap[answerId] 
          };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "When are you hoping to move?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q3 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "within30days", text: "Within 30 days" },
              { id: "1-3months", text: "1-3 months" },
              { id: "3-6months", text: "3-6 months" },
              { id: "6plus-months", text: "6+ months" }
            ]);
          }, 1000);
        } else if (answerId === "no-prequalified") {
          // Q2 No response - encourage and proceed to Q3
          setChatData(prev => ({ 
            ...prev, 
            prequalified: "No",
            preQualificationRange: "Not prequalified"
          }));
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "No problem, we can help you with that as we move through the process.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // After a brief pause, ask Q3
          setTimeout(() => {
            const q3Message: ChatMessage = {
              id: (Date.now() + 2).toString(),
              content: "When are you hoping to move?",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, q3Message]);
            
            // Show Q3 answer options after Q3 question appears
            setTimeout(() => {
              setCurrentAnswers([
                { id: "within30days", text: "Within 30 days" },
                { id: "1-3months", text: "1-3 months" },
                { id: "3-6months", text: "3-6 months" },
                { id: "6plus-months", text: "6+ months" }
              ]);
            }, 1000);
          }, 1500);
        } else if (["within30days", "1-3months", "3-6months", "6plus-months"].includes(answerId)) {
          // Q3 timing responses - proceed to Q4
          const timeMap: { [key: string]: string } = {
            "within30days": "Within 30 days",
            "1-3months": "1-3 months",
            "3-6months": "3-6 months",
            "6plus-months": "6+ months"
          };
          const updatedData = { ...chatData, moveTimeline: timeMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Are you currently working with a real estate agent?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q4 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "q4-yes", text: "Yes" },
              { id: "q4-no", text: "No" }
            ]);
          }, 1000);
        } else if (answerId === "q4-yes") {
          // Q4 Yes response - Ask about exclusive agreement
          const updatedData = { ...chatData, haveAgent: "Yes" };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "In accordance with the Code of Ethics and the laws of Tennessee and Georgia, we are unable to assist you if you have already signed an Exclusive Agreement with another real estate agent. If you have not entered into such an agreement, we are happy to proceed.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // After a brief pause, ask about exclusive agreement
          setTimeout(() => {
            const exclusiveQuestion: ChatMessage = {
              id: (Date.now() + 2).toString(),
              content: "Have you entered into such an agreement?",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, exclusiveQuestion]);
            
            // Show exclusive agreement answer options
            setTimeout(() => {
              setCurrentAnswers([
                { id: "exclusive-yes", text: "Yes" },
                { id: "exclusive-no", text: "No" },
                { id: "exclusive-unknown", text: "I don't know" }
              ]);
            }, 1000);
          }, 1500);
        } else if (answerId === "exclusive-yes") {
          // Exclusive agreement signed - polite rejection and redirect
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "We are sorry we cannot help you at this time but if anything changes please keep us in mind!",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Redirect after 5 seconds
          setTimeout(() => {
            window.location.href = "https://infinitydigitalstudios.com";
          }, 5000);
        } else if (answerId === "exclusive-unknown") {
          // "I don't know" response - ask them to check
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "No worries! To make sure we're following the rules in Tennessee and Georgia, could you double-check whether you've signed an Exclusive Agreement with another agent? Once you know for sure, we'll be ready to move forward.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Add redirect message after a brief pause
          setTimeout(() => {
            const redirectMessage: ChatMessage = {
              id: "countdown-message-unknown",
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
        } else if (answerId === "exclusive-no" || answerId === "q4-no") {
          // No exclusive agreement or not working with agent - proceed to Q5
          setChatData(prev => ({ 
            ...prev, 
            haveAgent: answerId === "q4-no" ? "No" : "Yes - No Exclusive Agreement" 
          }));
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Perfect, we'd love to guide you through the process.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // After a brief pause, ask Q5
          setTimeout(() => {
            const q5Message: ChatMessage = {
              id: (Date.now() + 2).toString(),
              content: "What price range are you comfortable with for your next home?",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, q5Message]);
            
            // Show Q5 answer options after Q5 question appears
            setTimeout(() => {
              setCurrentAnswers([
                { id: "q5-under250k", text: "Under $250,000" },
                { id: "q5-250k-350k", text: "$250,000 - $350,000" },
                { id: "q5-350k-500k", text: "$350,000 - $500,000" },
                { id: "q5-500k-plus", text: "$500,000+" }
              ]);
            }, 1000);
          }, 1500);
        } else if (["q5-under250k", "q5-250k-350k", "q5-350k-500k", "q5-500k-plus"].includes(answerId)) {
          // Q5 price range responses - proceed to Q6
          const budgetMap: { [key: string]: string } = {
            "q5-under250k": "Under $250,000",
            "q5-250k-350k": "$250,000 - $350,000",
            "q5-350k-500k": "$350,000 - $500,000",
            "q5-500k-plus": "$500,000+"
          };
          setChatData(prev => ({ ...prev, budgetRange: budgetMap[answerId] }));
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "What type of property are you most interested in?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q6 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "q6-single-family", text: "Single Family Home" },
              { id: "q6-townhouse", text: "Townhouse" },
              { id: "q6-condo", text: "Condo" },
              { id: "q6-other", text: "Other" }
            ]);
          }, 1000);
        } else if (["q6-single-family", "q6-townhouse", "q6-condo", "q6-other"].includes(answerId)) {
          // Q6 property type responses - proceed to Q7
          const propertyMap: { [key: string]: string } = {
            "q6-single-family": "Single Family Home",
            "q6-townhouse": "Townhouse",
            "q6-condo": "Condo",
            "q6-other": "Other"
          };
          setChatData(prev => ({ ...prev, propertyType: propertyMap[answerId] }));
          
          // Get user's first name for personalization
          const fullName = sessionStorage.getItem('userFullName') || '';
          const firstName = fullName.split(' ')[0] || '';
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: `Perfect! Thanks for those answers, ${firstName}. Would you like to schedule a quick call with Sarah to discuss your homebuying goals in more detail?`,
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q7 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "q7-yes", text: "Yes, I'd like to schedule a call" },
              { id: "q7-no", text: "No, not right now" }
            ]);
          }, 1000);
        } else if (answerId === "q7-no") {
          // Q7 No response - polite goodbye and redirect
          setChatData(prev => ({ ...prev, bookedCall: "No, not right now" }));
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "No problem! We really appreciate you taking the time to chat! Have a wonderful day!",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Send lead notification (chat completed but no call scheduled)
          sendLeadNotification(false);
          
          // Redirect after 5 seconds
          setTimeout(() => {
            window.location.href = "https://infinitydigitalstudios.com";
          }, 5000);
        } else if (answerId === "q7-yes") {
          // Q7 Yes response - proceed to Q8 (scheduling)
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
          // Day selected - show time slots (user message already added above)
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
