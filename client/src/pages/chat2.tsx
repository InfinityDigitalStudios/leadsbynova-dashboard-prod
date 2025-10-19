import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfiguration } from "@/hooks/useConfiguration";

// =============================================================================
// CONFIGURATION - Easy to change for app forks
// =============================================================================
// Note: REDIRECT_URL now uses configuration instead of hardcoded value

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
  type?: 'text' | 'choice';
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
  const [, setLocation] = useLocation();
  const { getConfigValue } = useConfiguration();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<AnswerOption[]>([
    { id: "yes", text: "Yes" },
    { id: "no", text: "No" }
  ]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  useEffect(() => {
    document.title = "LeadsByNova™";
  }, []);
  
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
      content: `Hi ${firstName}! The delivery of your link is currently being prepared and should arrive in your email within the next few minutes.\n\nWhile you wait would you be willing to answer a few quick questions to help me better understand your current stage in the home selling process?`,
      isBot: true,
      timestamp: new Date()
    };
    setMessages([firstQuestion]);
  }, []);

  // Save chat progress in real-time as answers are given
  const saveChatProgress = async (updatedChatData: Partial<SellerChatData>) => {
    try {
      const email = sessionStorage.getItem('userEmail');
      if (!email) {
        console.warn('No email found for saving chat progress');
        return;
      }

      const response = await fetch('/api/chat-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          chatData: {
            ...updatedChatData,
            chatTimestamp: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        console.log('Chat progress saved successfully');
      } else {
        console.warn('Failed to save chat progress');
      }
    } catch (error) {
      console.error('Error saving chat progress:', error);
    }
  };

  const sendLeadNotification = async (isScheduled: boolean = false, appointmentDetails?: string) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail') || '';
      const formData = {
        timestamp: new Date().toISOString(),
        name: chatData.name || '',
        email: userEmail,
        phone: sessionStorage.getItem('userPhone') || '',
        guide_type: sessionStorage.getItem('userGuideType') || ''
      };

      const chatDataForEmail = {
        ...chatData,
        timestamp: new Date().toISOString(),
        bookedCall: isScheduled ? 'Yes, scheduled call' : 'No, did not schedule call',
        daySelected: appointmentDetails || chatData.daySelected || ''
      };

      console.log('🔍 Sending lead notification with email:', userEmail);
      console.log('📋 Chat data:', chatDataForEmail);

      const response = await fetch('/api/lead-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,  // Send email directly as expected by server
          chatData: chatDataForEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send lead notification');
      }

      console.log('Lead notification sent successfully');
    } catch (error) {
      console.error('Error sending lead notification:', error);
    }
  };

  const handleAnswerClick = (answerId: string) => {
    const selectedAnswerOption = currentAnswers.find(a => a.id === answerId);
    if (selectedAnswerOption) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: selectedAnswerOption.text,
        isBot: false,
        timestamp: new Date(),
        type: 'choice'
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Clear answer options and show typing
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
            window.location.href = 'https://leadsbynova.com';
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
        } else if (answerId === "agent-yes") {
          // Q3a agent-yes response - show ethics compliance message
          const updatedData = { ...chatData, haveAgent: "Yes" };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "In accordance with the Code of Ethics and abiding by the laws of many U.S. states, we are unable to assist you if you have already signed an Exclusive Agreement with another real estate agent. If you have not entered into such an agreement, we are happy to proceed.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          setTimeout(() => {
            const followUpResponse: ChatMessage = {
              id: (Date.now() + 2).toString(),
              content: "Have you entered into such an agreement?",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, followUpResponse]);
            
            setTimeout(() => {
              setCurrentAnswers([
                { id: "exclusive-yes", text: "Yes" },
                { id: "exclusive-no", text: "No" },
                { id: "exclusive-dont-know", text: "I don't know" }
              ]);
            }, 1000);
          }, 2000);
        } else if (["agent-no", "agent-deciding"].includes(answerId)) {
          // Q3b agent-no/deciding responses - proceed directly to buying question
          const agentMap: { [key: string]: string } = {
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
        } else if (["exclusive-yes", "exclusive-no", "exclusive-dont-know"].includes(answerId)) {
          // Q4 exclusive agreement responses
          if (answerId === "exclusive-yes") {
            // They have exclusive agreement - show message and redirect
            const botResponse: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: "We are sorry we cannot help you at this time but if anything changes please keep us in mind!",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setCurrentAnswers([]);
            
            // Add countdown message and start countdown
            setTimeout(() => {
              const countdownMessage: ChatMessage = {
                id: "countdown-message",
                content: "This chat page will redirect in 5 seconds.",
                isBot: true,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, countdownMessage]);
              setCountdownSeconds(5);
              
              // Redirect after countdown completes
              setTimeout(() => {
                window.location.href = 'https://leadsbynova.com';
              }, 5000);
            }, 1000);
            
            // Send lead notification (chat ended due to exclusive agreement)
            sendLeadNotification(false);
          } else if (answerId === "exclusive-no") {
            // They don't have exclusive agreement - update status and proceed to buying question
            const updatedData = { ...chatData, haveAgent: "Yes - No Exclusive Agreement" };
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
          } else if (answerId === "exclusive-dont-know") {
            // They don't know - ask them to double-check and redirect
            const botResponse: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: "No worries! To make sure we're following the rules and abiding by the laws of many U.S. states, could you double-check whether you've signed an Exclusive Agreement with another agent? Once you know for sure, we'll be ready to move forward.",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setCurrentAnswers([]);
            
            // Add countdown message and start countdown
            setTimeout(() => {
              const countdownMessage: ChatMessage = {
                id: "countdown-message-unknown",
                content: "This chat page will redirect in 5 seconds.",
                isBot: true,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, countdownMessage]);
              setCountdownSeconds(5);
              
              // Redirect after countdown completes
              setTimeout(() => {
                window.location.href = 'https://leadsbynova.com';
              }, 5000);
            }, 1000);
            
            // Send lead notification (chat ended - unknown exclusive agreement status)
            sendLeadNotification(false);
          }
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
            content: `Thank you for all that information! Would you like to schedule a brief call with ${getConfigValue('company_name', '[Your Business/Agency Name]')} to discuss your selling goals?`,
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
            window.location.href = 'https://leadsbynova.com';
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
          const dayIndex = parseInt(answerId.replace('day-', ''));
          const businessDays = getNextBusinessDays();
          const selectedDayData = businessDays[dayIndex];
          setSelectedDay(selectedDayData?.label || '');
          setSelectedDate(selectedDayData?.date || null);
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
            content: `Perfect! I've scheduled your call for ${selectedDay} at ${selectedTime}. ${getConfigValue('company_name', '[Your Business/Agency Name]')} will reach out to you at that time!`,
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Map time slots to actual times (24-hour minimum advance booking)
          const timeMap: { [key: string]: { start: string; end: string } } = {
            "time-morning": { start: "09:00", end: "11:00" },
            "time-midday": { start: "12:00", end: "14:00" },
            "time-afternoon": { start: "15:00", end: "17:00" }
          };
          
          const timeSlot = timeMap[answerId];
          
          // Create booking if we have all required data
          if (selectedDate && timeSlot) {
            const year = selectedDate.getFullYear();
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            const userEmail = sessionStorage.getItem('userEmail') || '';
            const userName = chatData.name || '';
            const userPhone = sessionStorage.getItem('userPhone') || '';
            
            // Create demo booking
            fetch('/api/booking/demo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: formattedDate,
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                title: `Demo Call - ${userName}`,
                description: `Demo call with ${userName}`,
                contactName: userName,
                contactEmail: userEmail,
                contactPhone: userPhone,
                callType: 'phone' // Default to phone for chat bookings
              })
            }).then(response => {
              if (response.ok) {
                console.log('Demo booking created successfully');
              } else {
                console.warn('Failed to save demo booking');
              }
            }).catch(error => {
              console.error('Error sending lead notification:', error);
            });
          }
          
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
              window.location.href = 'https://leadsbynova.com';
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
    <div className="min-h-screen">
      <div className="w-full max-w-4xl mx-auto h-screen px-4 py-4 sm:px-6 lg:px-8">
        <Card className="shadow-2xl drop-shadow-2xl border border-border bg-card h-full flex flex-col" style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)" }} data-testid="card-chat">
          {/* Header */}
          <CardHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md ring-2 ring-white">
                <img 
                  src={getConfigValue('main_agent_headshot_url', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23e5e7eb"/><text x="24" y="28" font-family="Arial" font-size="10" text-anchor="middle" fill="%23374151">Agent</text></svg>')} 
                  alt={getConfigValue('company_name', 'Real Estate Agent')} 
                  className="w-full h-full object-cover"
                  data-testid="img-agent-avatar"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-chat-title">
                  Chat with [Your Business/Agency Name Here]
                </h1>
                <p className="text-[8.5px] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }} data-testid="text-chat-subtitle">
                  This is a simulated chat - no SMS charges apply
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
                    {message.type === 'choice' ? (
                      <div className="max-w-[85%] sm:max-w-[50%] w-full">
                        <div className="bg-white border border-border rounded-lg px-4 py-3">
                          <div className="w-full text-left rounded-lg px-3 py-2 font-medium bg-primary text-primary-foreground" 
                               style={{ 
                                 fontFamily: "var(--font-sans)",
                                 boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                 color: "white"
                               }}
                               data-testid={`choice-message-${message.id}`}>
                            {message.content}
                          </div>
                          <p className="text-xs mt-2 text-muted-foreground">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`${message.isBot ? "max-w-[70%]" : "max-w-[50%] w-full"} rounded-lg px-4 py-3 ${
                          message.isBot
                            ? "bg-white border border-border text-foreground"
                            : "bg-primary/10 text-foreground"
                        }`}
                        style={{
                          fontFamily: "var(--font-sans)"
                        }}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-line" data-testid={`text-message-content-${message.id}`}>
                          {message.content}
                        </p>
                        <p className={`text-xs mt-2 ${message.isBot ? "text-muted-foreground" : "text-white/70"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Answer Options */}
                {currentAnswers.length > 0 && (
                  <div className="flex justify-end pl-4 sm:pl-32" data-testid="answer-options-container">
                    <div className="bg-white border border-border rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[50%] w-full">
                      <p className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-sans)" }}>Choose an answer:</p>
                      <div className="space-y-2">
                        {currentAnswers.map((answer) => (
                          <button
                            key={answer.id}
                            onClick={() => handleAnswerClick(answer.id)}
                            className="w-full text-left rounded-lg px-3 py-2 font-medium transition-all hover:opacity-90 active:scale-95 bg-primary text-primary-foreground"
                            style={{ 
                              fontFamily: "var(--font-sans)",
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