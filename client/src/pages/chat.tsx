import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfiguration } from "@/hooks/useConfiguration";

// Chat data collection interface
interface ChatData {
  name: string;
  userType: string;
  mainGoal: string;
  leadManagement: string;
  timeline: string;
  communicationPreference: string;
  bookedCall: string;
  daySelected?: string;
  timeSelected?: string;
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
  booked?: boolean;
  unavailable?: boolean;
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
  
  while (businessDaysFound < 4) {
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

// Helper function to generate 2-hour time slots from 10 AM to 4 PM
const generateTimeSlots = () => {
  const slots = [];
  const hours = [10, 12, 14, 16]; // 10AM, 12PM, 2PM, 4PM
  
  for (const hour of hours) {
    const time24 = `${hour.toString().padStart(2, '0')}:00`;
    const hour12 = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const endHour = hour + 2;
    const endHour12 = endHour > 12 ? endHour - 12 : endHour;
    const endAmpm = endHour >= 12 ? 'PM' : 'AM';
    const label = `${hour12}:00 ${ampm} - ${endHour12}:00 ${endAmpm} ET`;
    slots.push({ time24, label });
  }
  return slots;
};

// Helper function to format date as YYYY-MM-DD
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to check if a time slot is at least 24 hours from now
const isAtLeast24HoursAway = (date: Date, time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return slotDateTime >= twentyFourHoursFromNow;
};

// Helper function to fetch available time slots for a date
const fetchAvailableTimeSlots = async (date: Date): Promise<AnswerOption[]> => {
  const dateStr = formatDateForAPI(date);
  try {
    const response = await fetch(`/api/booking/availability?date=${date.toISOString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }
    const availabilityData = await response.json();
    const bookedTimes = new Set(availabilityData.bookedSlots || []);
    
    const allSlots = generateTimeSlots();
    
    // Return all slots, marking which are booked or unavailable
    return allSlots.map((slot, index) => {
      const isBooked = bookedTimes.has(slot.time24);
      const isAtLeast24Hours = isAtLeast24HoursAway(date, slot.time24);
      
      return {
        id: `time-${slot.time24}`,
        text: slot.label,
        time24: slot.time24,
        booked: isBooked,
        unavailable: !isAtLeast24Hours
      };
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return generateTimeSlots().map((slot, index) => ({
      id: `time-${slot.time24}`,
      text: slot.label,
      time24: slot.time24
    }));
  }
};

export default function Chat() {
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
  const [leadId, setLeadId] = useState<string>('');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [chatCompleted, setChatCompleted] = useState(false);
  const [abandonmentNotificationSent, setAbandonmentNotificationSent] = useState(false);

  useEffect(() => {
    document.title = "LeadsByNova™";
  }, []);
  
  // Chat data collection
  const [chatData, setChatData] = useState<Partial<ChatData>>({
    name: '',
    userType: '',
    mainGoal: '',
    leadManagement: '',
    timeline: '',
    communicationPreference: '',
    bookedCall: '',
    daySelected: '',
    timeSelected: '',
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

  // Chat abandonment detection
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      // Only send abandonment notification if:
      // 1. Chat is not completed
      // 2. User has started the chat (has messages)
      // 3. Abandonment notification hasn't been sent yet
      if (!chatCompleted && !abandonmentNotificationSent && messages.length > 1) {
        // Send abandonment notification synchronously
        const email = sessionStorage.getItem('userEmail');
        if (email) {
          const abandonmentData = {
            ...chatData,
            bookedCall: "No - Abandoned chat",
            timestamp: new Date().toISOString()
          };
          
          // Use sendBeacon for reliable delivery on page unload
          const data = JSON.stringify({
            email,
            chatData: abandonmentData
          });
          
          // Try to send with sendBeacon (more reliable on page unload)
          if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon('/api/lead-complete', blob);
          } else {
            // Fallback to fetch with keepalive
            fetch('/api/lead-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: data,
              keepalive: true
            }).catch(console.error);
          }
          
          setAbandonmentNotificationSent(true);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatCompleted, abandonmentNotificationSent, chatData, messages.length]);

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
      content: `Hi there, ${firstName}! Your detailed overview link is on its way to your email.\nWhile you wait, this quick chat will give you a preview of how LeadsByNova™ engages your future leads — and helps us learn a bit about your business.\n\nWould you like to get started?`,
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

      const response = await fetch('/api/lead-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,  // Send email directly as expected by server
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
          // Q1 Yes response - Ask Q2
          const updatedData = { ...chatData, getStarted: "Yes" };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "What best describes you?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([
            { id: "small-business-owner", text: "Small Business Owner" },
            { id: "real-estate-agent", text: "Real Estate Agent" },
            { id: "marketing-professional", text: "Marketing Professional" },
            { id: "entrepreneur", text: "Entrepreneur / Startup Founder" },
            { id: "just-exploring", text: "Just Exploring" }
          ]);
        } else if (answerId === "no") {
          // Q1 No response - Save lead, send notifications, thank and redirect
          const updatedData = { ...chatData, bookedCall: "No - Declined chat on first question" };
          setChatData(updatedData);
          setChatCompleted(true); // Mark chat as completed to prevent abandonment notification
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "No problem! Feel free to come back anytime. Have a great day!",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]); // Clear answers for redirect
          
          // Send lead notification (declined chat but still capture lead)
          sendLeadNotification(false);
          
          // Redirect after 5 seconds
          setTimeout(() => {
            window.location.href = 'https://leadsbynova.com';
          }, 5000);
        } else if (["real-estate-agent", "small-business-owner", "marketing-professional", "entrepreneur", "just-exploring"].includes(answerId)) {
          // Q2 user type responses - proceed to Q3
          const userTypeMap: { [key: string]: string } = {
            "real-estate-agent": "Real Estate Agent",
            "small-business-owner": "Small Business Owner",
            "marketing-professional": "Marketing Professional",
            "entrepreneur": "Entrepreneur / Startup Founder",
            "just-exploring": "Just Exploring"
          };
          const updatedData = { 
            ...chatData, 
            userType: userTypeMap[answerId] 
          };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "What's your main goal with LeadsByNova™?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q3 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "generate-leads", text: "Generate more qualified leads" },
              { id: "automate-followups", text: "Automate follow-ups" },
              { id: "build-awareness", text: "Build brand awareness" },
              { id: "save-time", text: "Save time with AI tools" },
              { id: "learn-platform", text: "Learn about the platform" }
            ]);
          }, 1000);
        } else if (["generate-leads", "automate-followups", "build-awareness", "save-time", "learn-platform"].includes(answerId)) {
          // Q3 main goal responses - proceed to Q4
          const goalMap: { [key: string]: string } = {
            "generate-leads": "Generate more qualified leads",
            "automate-followups": "Automate follow-ups",
            "build-awareness": "Build brand awareness",
            "save-time": "Save time with AI tools",
            "learn-platform": "Learn about the platform"
          };
          const updatedData = { ...chatData, mainGoal: goalMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "How do you currently manage your leads?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q4 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "google-sheets", text: "Google Sheets or Excel" },
              { id: "crm", text: "CRM" },
              { id: "no-system", text: "I don't have a system yet" },
              { id: "assistant-handles", text: "My assistant/team handles it" }
            ]);
          }, 1000);
        } else if (["google-sheets", "crm", "no-system", "assistant-handles"].includes(answerId)) {
          // Q4 lead management responses - proceed to Q5
          const leadManagementMap: { [key: string]: string } = {
            "google-sheets": "Google Sheets or Excel",
            "crm": "CRM",
            "no-system": "I don't have a system yet",
            "assistant-handles": "My assistant/team handles it"
          };
          const updatedData = { ...chatData, leadManagement: leadManagementMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "How soon are you looking to improve your lead generation?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q5 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "immediately", text: "Immediately (this week)" },
              { id: "within-month", text: "Within the next month" },
              { id: "within-3months", text: "Within 3 months" },
              { id: "just-info", text: "Just gathering information for now" }
            ]);
          }, 1000);
        } else if (["immediately", "within-month", "within-3months", "just-info"].includes(answerId)) {
          // Q5 timeline responses - proceed to Q6
          const timelineMap: { [key: string]: string } = {
            "immediately": "Immediately (this week)",
            "within-month": "Within the next month",
            "within-3months": "Within 3 months",
            "just-info": "Just gathering information for now"
          };
          const updatedData = { ...chatData, timeline: timelineMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Which communication method do you prefer?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q6 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "email", text: "Email" },
              { id: "text-message", text: "Text Message" },
              { id: "phone-call", text: "Phone Call" },
              { id: "any-fine", text: "Any is fine with me" }
            ]);
          }, 1000);
        } else if (["email", "text-message", "phone-call", "any-fine"].includes(answerId)) {
          // Q6 communication preference responses - proceed to Q7
          const commPrefMap: { [key: string]: string } = {
            "email": "Email",
            "text-message": "Text Message",
            "phone-call": "Phone Call",
            "any-fine": "Any is fine with me"
          };
          const updatedData = { ...chatData, communicationPreference: commPrefMap[answerId] };
          setChatData(updatedData);
          saveChatProgress(updatedData);
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Would you like to book a live demo with LeadsByNova™ via Zoom?",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          
          // Show Q7 answer options after a delay
          setTimeout(() => {
            setCurrentAnswers([
              { id: "q7-yes", text: "Yes, let's do it!" },
              { id: "q7-no", text: "No, not at the moment" }
            ]);
          }, 1000);
        } else if (answerId === "q7-no") {
          // Q7 No response - polite goodbye and redirect
          setChatData(prev => ({ ...prev, bookedCall: "No, not at the moment" }));
          setChatCompleted(true); // Mark chat as completed to prevent abandonment notification
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "No problem at all! Thanks for your time today. We'll be in touch soon with more information about how LeadsByNova™ can help your business grow!",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Send lead notification (chat completed but no call scheduled)
          sendLeadNotification(false);
          
          // Redirect after 5 seconds
          setTimeout(() => {
            window.location.href = 'https://leadsbynova.com';
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
          const dayIndex = parseInt(answerId.split('-')[1]);
          const businessDays = getNextBusinessDays();
          const selectedDayData = businessDays[dayIndex];
          
          setSelectedDay(selectedDayData.label);
          setSelectedDate(selectedDayData.date);
          setCurrentAnswers([]);
          setIsTyping(true);
          
          setTimeout(async () => {
            const timeResponse: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: "What time works best for you?",
              isBot: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, timeResponse]);
            setIsTyping(false);
            
            // Fetch available time slots
            setTimeout(async () => {
              const availableSlots = await fetchAvailableTimeSlots(selectedDayData.date);
              const hasAvailableSlots = availableSlots.some(slot => !slot.booked && !slot.unavailable);
              
              if (!hasAvailableSlots) {
                const noSlotsMessage: ChatMessage = {
                  id: (Date.now() + 2).toString(),
                  content: "I'm sorry, all time slots are booked for that day. Please select another day.",
                  isBot: true,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, noSlotsMessage]);
                
                // Show day options again
                setTimeout(() => {
                  const dayOptions = businessDays.map((day, index) => ({
                    id: `day-${index}`,
                    text: day.label
                  }));
                  setCurrentAnswers(dayOptions);
                }, 1000);
              } else {
                setCurrentAnswers(availableSlots);
              }
            }, 1000);
          }, 1000);
          return; // Skip the normal flow since we handle it manually
        } else if (answerId.startsWith("time-")) {
          // Time slot selected - end of conversation
          const selectedTimeAnswer = currentAnswers.find(a => a.id === answerId);
          const selectedTime = selectedTimeAnswer?.text || '';
          const time24 = answerId.replace('time-', ''); // Extract time in 24-hour format
          const fullSchedule = `${selectedDay} at ${selectedTime}`;
          
          setChatData(prev => ({ 
            ...prev, 
            bookedCall: "Yes, scheduled call",
            daySelected: fullSchedule
          }));
          
          // Save appointment to database using the same booking API as /guide page
          if (selectedDate) {
            const [hours] = time24.split(':');
            const endHours = (parseInt(hours) + 2).toString().padStart(2, '0');
            const endTime = `${endHours}:00`;
            
            const bookingData = {
              date: formatDateForAPI(selectedDate),
              startTime: time24,
              endTime: endTime,
              title: "Demo Call - LeadsByNova™ (from chat)",
              description: "Demo call scheduled from chat flow",
              contactName: chatData.name,
              contactEmail: sessionStorage.getItem('userEmail') || '',
              contactPhone: sessionStorage.getItem('userPhone') || ''
            };
            
            fetch('/api/booking/demo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bookingData),
              credentials: 'include',
            }).then(response => {
              if (response.ok) {
                console.log('Demo booking saved successfully to calendar');
              } else {
                console.warn('Failed to save demo booking');
              }
            }).catch(error => {
              console.error('Error saving demo booking:', error);
            });
          }
          
          const botResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: `Perfect! Your Zoom demo with LeadsByNova™ is scheduled for ${selectedDay} at ${selectedTime}. We'll send you a calendar invite and Zoom link shortly. Looking forward to showing you how our platform can help grow your business!`,
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setCurrentAnswers([]);
          
          // Send lead notification (chat completed with call scheduled)
          sendLeadNotification(true, fullSchedule);
          setChatCompleted(true); // Mark chat as completed to prevent abandonment notification
          
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
                  src={new URL('@assets/Favicon - Blue Background_1759775925656.png', import.meta.url).href}
                  alt="LeadsByNova™ Logo" 
                  className="w-full h-full object-cover"
                  data-testid="img-agent-avatar"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#1e40af" }} data-testid="text-chat-title">
                  Chat With LeadsByNova™
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
                        <div className="rounded-lg px-4 py-3" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 30%, #bfdbfe 50%, #dbeafe 70%, #eff6ff 100%)" }}>
                          <div className="w-full text-left rounded-lg px-3 py-2 font-medium text-foreground" 
                               style={{ 
                                 fontFamily: "var(--font-sans)",
                                 boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                 background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
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
                        className={`${message.isBot ? "max-w-[70%]" : "max-w-[50%] w-full"} rounded-lg px-4 py-3 text-foreground`}
                        style={{
                          fontFamily: "var(--font-sans)",
                          background: message.isBot 
                            ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 30%, #bfdbfe 50%, #dbeafe 70%, #eff6ff 100%)"
                            : "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
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
                    <div className="rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[50%] w-full" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 30%, #bfdbfe 50%, #dbeafe 70%, #eff6ff 100%)" }}>
                      <p className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-sans)" }}>Choose an answer:</p>
                      <div className="space-y-2">
                        {currentAnswers.map((answer) => {
                          const isDisabled = answer.booked || answer.unavailable;
                          return (
                            <div key={answer.id} className="relative">
                              <button
                                onClick={() => !isDisabled && handleAnswerClick(answer.id)}
                                disabled={isDisabled}
                                className={`w-full text-left rounded-lg px-3 py-2 font-medium transition-all text-foreground ${
                                  isDisabled 
                                    ? 'opacity-40 cursor-not-allowed' 
                                    : 'hover:opacity-90 active:scale-95'
                                }`}
                                style={{ 
                                  fontFamily: "var(--font-sans)",
                                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                                  background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                                  color: "white"
                                }}
                                data-testid={`button-answer-${answer.id}`}
                              >
                                {answer.text}
                              </button>
                              {answer.booked && (
                                <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center rounded-lg pointer-events-none">
                                  <span className="text-white font-semibold text-sm">Booked</span>
                                </div>
                              )}
                              {answer.unavailable && !answer.booked && (
                                <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center rounded-lg pointer-events-none">
                                  <span className="text-white font-semibold text-sm">Unavailable</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start" data-testid="typing-indicator">
                    <div className="rounded-lg px-4 py-3 max-w-[70%]" style={{ background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" }}>
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
