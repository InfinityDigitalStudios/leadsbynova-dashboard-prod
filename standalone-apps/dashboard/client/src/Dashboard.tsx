import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLeadStream } from "@/hooks/useLeadStream";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  CheckCircle, 
  XCircle, 
  Timer, 
  ArrowLeft, 
  Archive, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  Users,
  CalendarDays,
  UserPlus,
  Eye,
  FolderOpen,
  Plus,
  ChevronDown,
  X
} from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import { type Lead, insertEventSchema, type Event } from "@shared/schema";
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import sarahHeadshot from '@assets/Sarah_1757312700854.png';
import mitchellHeadshot from '@assets/Mitchell_1757312703804.png';

export default function Dashboard() {
  // TEMPORARY: Debug test to verify routing
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);
  const [currentNote, setCurrentNote] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "archived" | "trash">("active");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [leadToArchive, setLeadToArchive] = useState<Lead | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [addLeadSection, setAddLeadSection] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Daily calendar popup state
  const [showDayPopup, setShowDayPopup] = useState(false);
  const [selectedDayPopup, setSelectedDayPopup] = useState<Date | null>(null);
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Day navigation handlers for infinite scrolling
  const goToPrevDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, -1));
  };

  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  
  // Mobile-specific state
  const [showMobileFolderDialog, setShowMobileFolderDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Connect to real-time lead updates
  const { isConnected } = useLeadStream();

  // Add Lead Form Schema
  const addLeadFormSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    guideType: z.enum(["Relocation Guide", "First Time Home Buyer Guide", "Sellers Guide"], {
      required_error: "Please select a guide type"
    }),
    prequalified: z.enum(["Yes", "No", "not_specified"]).optional(),
    preQualificationRange: z.string().optional(),
    moveTimeline: z.string().optional(),
    haveAgent: z.enum(["Yes", "No", "not_specified"]).optional(),
    budgetRange: z.string().optional(),
    propertyType: z.string().optional(),
  });

  type AddLeadFormData = z.infer<typeof addLeadFormSchema>;

  // Add Event Form Schema
  type AddEventFormData = z.infer<typeof insertEventSchema>;

  const addLeadForm = useForm<AddLeadFormData>({
    resolver: zodResolver(addLeadFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      guideType: undefined,
      prequalified: "not_specified",
      preQualificationRange: "",
      moveTimeline: "",
      haveAgent: "not_specified",
      budgetRange: "",
      propertyType: "",
    },
  });

  const addEventForm = useForm<AddEventFormData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  const editEventForm = useForm<AddEventFormData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  // Update form values when eventToEdit changes
  React.useEffect(() => {
    if (eventToEdit) {
      editEventForm.reset({
        title: eventToEdit.title,
        description: eventToEdit.description || "",
        date: eventToEdit.date,
        startTime: eventToEdit.startTime,
        endTime: eventToEdit.endTime,
      });
    }
  }, [eventToEdit, editEventForm]);

  // Sync Add Event form date with selected date when navigating days
  useEffect(() => {
    addEventForm.setValue('date', format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate, addEventForm]);

  const { data: allLeads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: allEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Filter leads based on view mode for the workspace
  const getLeadsForTab = (tab: string) => {
    if (!allLeads) return [];

    switch (tab) {
      case "active":
        return allLeads.filter(lead => lead.archived === "false" && lead.deletedAt === null);
      case "archived":
        return allLeads.filter(lead => lead.archived === "true" && lead.deletedAt === null);
      case "trash":
        return allLeads.filter(lead => lead.deletedAt !== null);
      case "prequalified":
        return allLeads.filter(lead => 
          lead.archived === "false" && 
          lead.deletedAt === null && 
          lead.prequalified === "Yes"
        );
      case "new":
        return allLeads.filter(lead => 
          lead.archived === "false" && 
          lead.deletedAt === null && 
          !lead.assignedTo
        );
      case "unassigned":
        return allLeads.filter(lead => 
          lead.archived === "false" && 
          lead.deletedAt === null && 
          !lead.assignedTo
        );
      case "sarah":
        return allLeads.filter(lead => 
          lead.archived === "false" && 
          lead.deletedAt === null && 
          lead.assignedTo === "Sarah Johnson"
        );
      case "mitchell":
        return allLeads.filter(lead => 
          lead.archived === "false" && 
          lead.deletedAt === null && 
          lead.assignedTo === "Mitchell Young"
        );
      default:
        return allLeads.filter(lead => lead.archived === "false" && lead.deletedAt === null);
    }
  };

  // Calculate stats
  const activeLeads = allLeads?.filter(lead => lead.archived === "false" && lead.deletedAt === null) || [];
  const unassignedLeads = activeLeads.filter(lead => !lead.assignedTo);
  const sarahLeads = activeLeads.filter(lead => lead.assignedTo === "Sarah Johnson");
  const mitchellLeads = activeLeads.filter(lead => lead.assignedTo === "Mitchell Young");
  const prequalifiedLeads = activeLeads.filter(lead => lead.prequalified === "Yes");
  const archivedLeads = allLeads?.filter(lead => lead.archived === "true" && lead.deletedAt === null) || [];
  const trashedLeads = allLeads?.filter(lead => lead.deletedAt !== null) || [];

  // Mutations
  const saveNotesMutation = useMutation({
    mutationFn: async ({ leadId, noteContent }: { leadId: string; noteContent: string }) => {
      return apiRequest('PUT', `/api/leads/${leadId}/notes`, { notes: noteContent });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Notes saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setCurrentNote("");
      setShowLeadModal(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    },
  });

  const assignLeadMutation = useMutation({
    mutationFn: async ({ leadId, assignedTo }: { leadId: string; assignedTo: string }) => {
      return apiRequest('PUT', `/api/leads/${leadId}/assign`, { assignedTo });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lead assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowAssignModal(false);
      setLeadToAssign(null);
      setSelectedAssignee("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign lead", variant: "destructive" });
    },
  });

  const archiveLeadMutation = useMutation({
    mutationFn: async ({ leadId, archived, clearAssignment }: { leadId: string; archived: string; clearAssignment?: boolean }) => {
      const updates: any = { archived };
      if (clearAssignment) {
        updates.assignedTo = null;
      }
      return apiRequest('PUT', `/api/leads/${leadId}/archive`, updates);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lead status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lead status", variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async ({ leadId }: { leadId: string }) => {
      return apiRequest('PUT', `/api/leads/${leadId}/delete`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lead moved to trash successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowDeleteModal(false);
      setLeadToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ leadId }: { leadId: string }) => {
      return apiRequest('DELETE', `/api/leads/${leadId}/permanent`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lead permanently deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowDeleteModal(false);
      setLeadToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to permanently delete lead", variant: "destructive" });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: AddLeadFormData & { section: string }) => {
      let assignedTo = null;
      if (leadData.section === "Sarah Johnson") {
        assignedTo = "Sarah Johnson";
      } else if (leadData.section === "Mitchell Young") {
        assignedTo = "Mitchell Young";
      }

      const cleanPrequalified = leadData.prequalified === "not_specified" ? null : leadData.prequalified;
      const cleanHaveAgent = leadData.haveAgent === "not_specified" ? null : leadData.haveAgent;
      const completedChat = cleanPrequalified || leadData.preQualificationRange || 
                          leadData.moveTimeline || cleanHaveAgent || 
                          leadData.budgetRange || leadData.propertyType ? "true" : "false";

      const payload = {
        fullName: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        guideType: leadData.guideType,
        formTimestamp: new Date().toISOString(),
        chatTimestamp: completedChat === "true" ? new Date().toISOString() : null,
        prequalified: cleanPrequalified,
        preQualificationRange: leadData.preQualificationRange || null,
        moveTimeline: leadData.moveTimeline || null,
        haveAgent: cleanHaveAgent,
        budgetRange: leadData.budgetRange || null,
        propertyType: leadData.propertyType || null,
        completedChat,
        assignedTo,
        archived: "false",
        notes: null,
        deletedAt: null,
      };

      return apiRequest('POST', '/api/leads', payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lead created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowAddLeadModal(false);
      setAddLeadSection("");
      addLeadForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create lead", variant: "destructive" });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: AddEventFormData) => {
      return apiRequest('POST', '/api/events', {
        title: eventData.title,
        description: eventData.description || undefined,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Event created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowAddEventModal(false);
      addEventForm.reset({
        title: "",
        description: "",
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: "09:00",
        endTime: "10:00",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: AddEventFormData) => {
      if (!eventToEdit) throw new Error('No event selected for editing');
      return apiRequest('PUT', `/api/events/${eventToEdit.id}`, {
        title: eventData.title,
        description: eventData.description || undefined,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Event updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowEditEventModal(false);
      setEventToEdit(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update event", variant: "destructive" });
    },
  });

  // Helper functions
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Convert military time (24-hour) to AM/PM format
  const formatTimeToAMPM = (time: string) => {
    if (!time) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Helper function to get leads for a specific time slot with smart positioning
  const getLeadsForTimeSlot = (selectedDate: Date, timeSlot: string, allDayLeads: Lead[]): Lead[] => {
    const hour = parseInt(timeSlot.split(':')[0]);
    const isPM = timeSlot.includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    
    // Determine current time slot type from hour
    let currentTimeSlotType = '';
    let timeSlotHours: number[] = [];
    
    if (hour24 >= 9 && hour24 < 12) {
      currentTimeSlotType = 'morning';
      timeSlotHours = [9, 10, 11];
    } else if (hour24 >= 12 && hour24 < 15) {
      currentTimeSlotType = 'mid-day';
      timeSlotHours = [12, 13, 14];
    } else if (hour24 >= 15 && hour24 < 18) {
      currentTimeSlotType = 'afternoon';
      timeSlotHours = [15, 16, 17];
    }
    
    // Get all leads for this time period
    const timeSlotLeads = allDayLeads.filter(lead => {
      const leadTime = lead.daySelected?.toLowerCase() || '';
      return leadTime.includes(currentTimeSlotType);
    });
    
    if (timeSlotLeads.length === 0) return [];
    
    // Now apply smart positioning logic
    const leadsToShow: Lead[] = [];
    
    timeSlotLeads.forEach((lead, index) => {
      const hourIndex = index % timeSlotHours.length; // Cycle through available hours
      const targetHour = timeSlotHours[hourIndex];
      
      // Show this lead if current timeSlot matches the target hour for this lead
      // OR if there are 4+ leads and this is a secondary placement
      if (hour24 === targetHour || (index >= timeSlotHours.length && hour24 === timeSlotHours[hourIndex % timeSlotHours.length])) {
        leadsToShow.push(lead);
      }
    });
    
    return leadsToShow;
  };

  // Get events that are active during a specific time slot (spanning events)
  const getEventsForTimeSlot = (selectedDate: Date, timeSlot: string, allDayEvents: Event[]): { event: Event, isStartSlot: boolean, isEndSlot: boolean }[] => {
    const hour = parseInt(timeSlot.split(':')[0]);
    const isPM = timeSlot.includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    
    // Filter events that are active during this time slot
    const eventsForSlot = allDayEvents.filter(event => {
      if (!event.startTime || !event.endTime) return false;
      
      // Parse event start and end times (format: "HH:MM")
      const [startHour] = event.startTime.split(':');
      const [endHour] = event.endTime.split(':');
      const startHour24 = parseInt(startHour);
      const endHour24 = parseInt(endHour);
      
      // Event is active if current hour is between start and end (exclusive of end)
      return hour24 >= startHour24 && hour24 < endHour24;
    }).map(event => {
      const [startHour] = event.startTime.split(':');
      const [endHour] = event.endTime.split(':');
      const startHour24 = parseInt(startHour);
      const endHour24 = parseInt(endHour);
      
      return {
        event,
        isStartSlot: hour24 === startHour24,
        isEndSlot: hour24 === endHour24 - 1 // Last hour the event is active
      };
    });
    
    return eventsForSlot;
  };
  
  // Helper function to get time slot hours
  const getTimeSlotHours = (leadTime: string): number[] => {
    if (leadTime.includes('morning')) {
      return [9, 10, 11]; // 9AM, 10AM, 11AM
    } else if (leadTime.includes('mid-day')) {
      return [12, 13, 14]; // 12PM, 1PM, 2PM
    } else if (leadTime.includes('afternoon')) {
      return [15, 16, 17]; // 3PM, 4PM, 5PM
    }
    return [];
  };

  // Helper function to extract readable time from daySelected
  const extractTimeFromDaySelected = (daySelected: string | null): string => {
    if (!daySelected) return '';
    
    if (daySelected.includes('Morning')) {
      return '9AM - 12PM';
    }
    if (daySelected.includes('Mid-Day')) {
      return '12PM - 3PM';
    }
    if (daySelected.includes('Afternoon')) {
      return '3PM - 6PM';
    }
    
    return daySelected.split(' at ')[1] || daySelected;
  };

  // Get scheduled calls from leads for a specific date
  const getScheduledCallsForDate = (date: Date): Lead[] => {
    if (!allLeads) return [];
    
    const scheduledCalls = allLeads.filter(lead => {
      if (!lead.daySelected || !lead.bookedCall) return false;
      
      // Parse natural language format like "Friday, Sep 12th at Mid-Day (12PM - 3PM Eastern Time)"
      const dayText = lead.daySelected.toLowerCase();
      
      // Extract day of week and date components
      const targetDay = format(date, 'EEEE').toLowerCase(); // Get day name like "friday"
      const targetDate = date.getDate(); // Get day number like 12
      const targetMonth = format(date, 'MMM').toLowerCase(); // Get month like "sep"
      
      // Check if the daySelected matches the target date
      const matchesDay = dayText.includes(targetDay);
      const matchesMonth = dayText.includes(targetMonth);
      
      // Extract the day number from the daySelected text (e.g., "12th" from "Sep 12th")
      const dayMatch = dayText.match(/(\d+)(st|nd|rd|th)/);
      const selectedDay = dayMatch ? parseInt(dayMatch[1]) : null;
      
      const matchesDate = selectedDay === targetDate;
      
      return matchesDay && matchesMonth && matchesDate;
    });
    
    return scheduledCalls;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    if (!allEvents) return [];
    
    const targetDateString = format(date, 'yyyy-MM-dd');
    
    const eventsForDate = allEvents.filter((event: Event) => {
      return event.date === targetDateString;
    });
    
    return eventsForDate;
  };

  const getStatusBadge = (lead: Lead) => {
    if (lead.completedChat === "true") {
      return <Badge className="!bg-green-500 !text-white">Completed</Badge>;
    }
    return <Badge className="!bg-blue-500 !text-white">Form Only</Badge>;
  };

  const getQualificationBadge = (prequalified: string | null) => {
    if (prequalified === "Yes") {
      return <Badge className="!bg-green-600 !text-white">Pre-qualified</Badge>;
    }
    return null;
  };

  const getAgentStatusBadge = (haveAgent: string | null | undefined) => {
    if (!haveAgent) return null;
    
    if (haveAgent === "No") {
      return null;
    } else if (haveAgent === "Yes - No Exclusive Agreement") {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-md">
          Has not signed an agreement
        </span>
      );
    } else if (haveAgent.includes("Exclusive") || haveAgent === "Yes") {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md">
          Currently has signed agreement! Do NOT contact!
        </span>
      );
    } else if (haveAgent.includes("don't know") || haveAgent.includes("unknown")) {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-yellow-500 rounded-md">
          Doesn't know if they have signed an agreement. Follow up.
        </span>
      );
    }
    
    return null;
  };

  // Lead Card Component
  // Detailed Lead Card Component for New Incoming Leads
  const DetailedLeadCard = ({ lead }: { lead: Lead }) => {
    const hasCompletedForm = !!lead.formTimestamp;
    const hasCompletedChat = lead.completedChat === "true";
    
    // Helper function to format budget range
    const formatBudgetRange = (range: string | null) => {
      if (!range || range === 'not_specified') return 'Not specified';
      return range;
    };

    // Helper function to get agent agreement status
    const getAgentAgreementStatus = (haveAgent: string | null) => {
      if (!haveAgent || haveAgent === 'No' || haveAgent === 'not_specified') return null;
      
      const agentResponse = haveAgent.toLowerCase();
      
      // Check for negations first (no exclusive, not exclusive, etc.)
      const hasNegation = agentResponse.includes('no exclusive') || 
                         agentResponse.includes('not exclusive') || 
                         agentResponse.includes('non-exclusive') || 
                         agentResponse.includes('no contract') || 
                         agentResponse.includes('no agreement') ||
                         agentResponse.includes('not signed');
      
      if (hasNegation) {
        return { text: "Has not signed an agreement", color: "bg-green-600" };
      }
      
      // Check for exclusive/signed agreements
      const hasExclusiveKeywords = agentResponse.includes('signed') || 
                                  agentResponse.includes('exclusive') || 
                                  agentResponse.includes('contract') || 
                                  agentResponse.includes('agreement');
      
      if (hasExclusiveKeywords) {
        return { text: "Has signed agreement - Do Not Contact", color: "bg-red-600" };
      }
      
      // Handle unclear responses
      if (agentResponse.includes("don't know") || agentResponse.includes('unknown') || agentResponse.includes('unsure')) {
        return { text: "Agent status unclear", color: "bg-yellow-600" };
      }
      
      // Default for "Yes" responses
      if (haveAgent === 'Yes') {
        return { text: "Has not signed an agreement", color: "bg-green-600" };
      }
      
      return { text: "Agent status unclear", color: "bg-yellow-600" };
    };

    const agentStatus = getAgentAgreementStatus(lead.haveAgent);

    return (
      <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 text-white h-full cursor-pointer hover:bg-gradient-to-br hover:from-slate-800 hover:via-blue-800 hover:to-slate-800 transition-colors" onClick={() => {
        setSelectedLead(lead);
        setShowLeadModal(true);
      }}>
        <CardContent className="p-6 h-full flex flex-col">
          {/* Top Status Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {lead.assignedTo && (
              <Badge className="!bg-blue-800 !text-white font-medium" data-testid={`badge-assigned-to-${lead.id}`}>
                {lead.assignedTo}
              </Badge>
            )}
            {hasCompletedForm && (
              <Badge className="!bg-green-600 !text-white font-medium" data-testid={`badge-form-completed-${lead.id}`}>
                Form Completed
              </Badge>
            )}
            {hasCompletedChat && (
              <Badge className="!bg-blue-700 !text-white font-medium" data-testid={`badge-chat-completed-${lead.id}`}>
                Chat Completed
              </Badge>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-3 mb-6">
            <div>
              <span className="font-semibold">Name: </span>
              <span data-testid={`text-lead-name-${lead.id}`}>{lead.fullName}</span>
            </div>
            <div>
              <span className="font-semibold">Email: </span>
              <span data-testid={`text-lead-email-${lead.id}`}>{lead.email}</span>
            </div>
            <div>
              <span className="font-semibold">Phone: </span>
              <span data-testid={`text-lead-phone-${lead.id}`}>{formatPhoneNumber(lead.phone)}</span>
            </div>
            <div>
              <span className="font-semibold">Guide Type: </span>
              <span data-testid={`text-lead-guide-${lead.id}`}>{lead.guideType}</span>
            </div>
          </div>

          {/* White Separator Line */}
          <div className="h-px bg-white/30 my-6"></div>

          {/* Chat Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Chat Information</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Pre-Qualified: </span>
                <span data-testid={`text-chat-prequalified-${lead.id}`}>{lead.prequalified || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Dollar Amount Approved For: </span>
                <span data-testid={`text-chat-approved-amount-${lead.id}`}>{lead.preQualificationRange || 'Not prequalified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Dollar Amount Comfortable With: </span>
                <span data-testid={`text-chat-budget-range-${lead.id}`}>{formatBudgetRange(lead.budgetRange)}</span>
              </div>
              
              <div>
                <span className="font-semibold">Move Timeline: </span>
                <span data-testid={`text-chat-timeline-${lead.id}`}>{lead.moveTimeline || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Property Type: </span>
                <span data-testid={`text-chat-property-type-${lead.id}`}>{lead.propertyType || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Have an Agent: </span>
                <span data-testid={`text-chat-have-agent-${lead.id}`}>{lead.haveAgent || 'Not specified'}</span>
              </div>

              {agentStatus && (
                <div className="mt-2">
                  <Badge className={`${agentStatus.color} text-white text-xs`} data-testid={`badge-agent-status-${lead.id}`}>
                    {agentStatus.text}
                  </Badge>
                </div>
              )}

              {lead.bookedCall && (
                <div className="mt-4">
                  <span className="font-semibold">Call Details: </span>
                  <div className="mt-1 text-sm text-white/90">
                    {lead.daySelected && <div>Day: {lead.daySelected}</div>}
                    <div>{lead.bookedCall}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto pt-4">
            <Button 
              size="sm" 
              className="flex-1 !bg-green-600 hover:!bg-green-700 !text-white font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setLeadToAssign(lead);
                setShowAssignModal(true);
              }}
              data-testid={`button-assign-${lead.id}`}
            >
              Assign
            </Button>
            
            <Button 
              size="sm" 
              className="flex-1 !bg-yellow-600 hover:!bg-yellow-700 !text-white font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setLeadToArchive(lead);
                setShowArchiveModal(true);
              }}
              data-testid={`button-archive-${lead.id}`}
            >
              {lead.archived === "true" ? "Unarchive" : "Archive"}
            </Button>
            
            <Button 
              size="sm" 
              className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                setLeadToDelete(lead);
                setShowDeleteModal(true);
              }}
              data-testid={`button-delete-${lead.id}`}
            >
              {lead.deletedAt !== null ? "Delete" : "Move to Trash"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LeadCard = ({ lead, showActions = true }: { lead: Lead; showActions?: boolean }) => (
    <Card className="bg-white/10 border-blue-400/30 hover:bg-white/15 transition-colors cursor-pointer"
          onClick={() => {
            setSelectedLead(lead);
            setShowLeadModal(true);
          }}
          data-testid={`card-lead-${lead.id}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-white text-lg" data-testid={`text-lead-name-${lead.id}`}>
              {lead.fullName}
            </h3>
            <p className="text-white/70 text-sm" data-testid={`text-lead-email-${lead.id}`}>
              {lead.email}
            </p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(lead)}
            {getQualificationBadge(lead.prequalified)}
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span data-testid={`text-lead-phone-${lead.id}`}>{formatPhoneNumber(lead.phone)}</span>
          </div>
          
          {lead.guideType && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span data-testid={`text-lead-guide-${lead.id}`}>{lead.guideType}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span data-testid={`text-lead-date-${lead.id}`}>{formatDate(lead.formTimestamp)}</span>
          </div>

          {lead.assignedTo && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-blue-300" data-testid={`text-lead-assignee-${lead.id}`}>
                Assigned to {lead.assignedTo}
              </span>
            </div>
          )}

          {lead.haveAgent && getAgentStatusBadge(lead.haveAgent)}
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            {!lead.assignedTo && (
              <Button 
                size="sm" 
                className="!bg-green-600 hover:!bg-green-700 !text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLeadToAssign(lead);
                  setShowAssignModal(true);
                }}
                data-testid={`button-assign-${lead.id}`}
              >
                Assign
              </Button>
            )}
            
            <Button 
              size="sm" 
              className="!bg-yellow-600 hover:!bg-yellow-700 !text-white"
              onClick={(e) => {
                e.stopPropagation();
                archiveLeadMutation.mutate({ 
                  leadId: lead.id!, 
                  archived: lead.archived === "true" ? "false" : "true" 
                });
              }}
              data-testid={`button-archive-${lead.id}`}
            >
              {lead.archived === "true" ? "Unarchive" : "Archive"}
            </Button>
            
            <Button 
              size="sm" 
              className="!bg-red-600 hover:!bg-red-700 !text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLeadToDelete(lead);
                setShowDeleteModal(true);
              }}
              data-testid={`button-delete-${lead.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Agent options for dropdown
  const agentOptions = [
    { id: "sarah", label: "Sarah Johnson", count: sarahLeads.length },
    { id: "mitchell", label: "Mitchell Young", count: mitchellLeads.length },
  ];

  // Sidebar Navigation Items
  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "agents", label: "Agents", icon: Users, isDropdown: true },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "new", label: "New Leads", icon: UserPlus, count: unassignedLeads.length },
    { id: "unassigned", label: "Unassigned Leads", icon: FolderOpen, count: unassignedLeads.length },
    { id: "prequalified", label: "Pre-qualified", icon: CheckCircle, count: prequalifiedLeads.length },
    { id: "active", label: "Active Leads", icon: Eye, count: activeLeads.length },
    { id: "archived", label: "Archived", icon: Archive, count: archivedLeads.length },
    { id: "trash", label: "Trash", icon: Trash2, count: trashedLeads.length },
  ];

  // Render workspace content based on active tab
  const renderWorkspaceContent = () => {
    const leads = getLeadsForTab(activeTab);

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Dashboard Overview
              </h2>
              <p className="text-white/70">Manage your leads and track performance</p>
            </div>

            {/* Today's Schedule */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 overflow-hidden w-full max-w-4xl shadow-lg">
              <div className="bg-gradient-to-r from-slate-800/80 via-blue-800/60 to-slate-800/80 p-4 border-b border-blue-400/30">
                <div className="space-y-3">
                  {/* Top row: Centered title */}
                  <div className="text-center">
                    <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Daily Schedule
                    </h3>
                  </div>
                  
                  {/* Bottom row: Date navigation (left) and Add Event button (right) */}
                  <div className="flex items-center justify-between">
                    {/* Left: Date Navigation */}
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={goToPrevDay}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-200 hover:bg-white/20 hover:text-white"
                        data-testid="button-prev-day"
                        aria-label="Previous day"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="text-center px-3">
                        {/* Short date on small screens */}
                        <div 
                          className="sm:hidden text-white font-medium text-sm whitespace-nowrap"
                          data-testid="text-selected-date-short"
                        >
                          {format(selectedDate, "MMM d, yyyy")}
                        </div>
                        
                        {/* Full date on larger screens */}
                        <div className="hidden sm:block">
                          <div 
                            className="text-white font-medium text-sm whitespace-nowrap"
                            data-testid="text-selected-date"
                          >
                            {format(selectedDate, "EEEE, MMM d")}
                          </div>
                          <div className="text-white/70 text-xs whitespace-nowrap">
                            {format(selectedDate, "yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={goToNextDay}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-200 hover:bg-white/20 hover:text-white"
                        data-testid="button-next-day"
                        aria-label="Next day"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Right: Add Event Button */}
                    <div className="flex-shrink-0">
                      {/* Icon-only button on small screens */}
                      <Button
                        onClick={() => {
                          // Update the form date to match the selected day in the schedule
                          addEventForm.setValue('date', format(selectedDate, 'yyyy-MM-dd'));
                          setShowAddEventModal(true);
                        }}
                        variant="outline"
                        size="icon"
                        className="sm:hidden border-blue-400/30 bg-gradient-to-r from-blue-700/60 to-blue-600/50 text-white hover:from-blue-700/80 hover:to-blue-600/70 h-8 w-8"
                        data-testid="button-add-event-schedule"
                        aria-label="Add Event"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      
                      {/* Full button on larger screens */}
                      <Button
                        onClick={() => {
                          // Update the form date to match the selected day in the schedule
                          addEventForm.setValue('date', format(selectedDate, 'yyyy-MM-dd'));
                          setShowAddEventModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex border-blue-400/30 bg-gradient-to-r from-blue-700/60 to-blue-600/50 text-white hover:from-blue-700/80 hover:to-blue-600/70 px-3"
                        data-testid="button-add-event-schedule-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Event
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-96 overflow-y-auto">
                <div className="space-y-0 relative">
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    
                    let timeSlots = [];
                    let currentTimeSlotIndex = -1;
                    
                    // Always show fixed business hours 8am - 6pm (10 hours)
                    const fixedHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 8am to 6pm in 24h format (18 = 6PM)
                    timeSlots = fixedHours.map(hour => {
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      return `${hour12}:00 ${ampm}`;
                    });
                    
                    // Find current hour in the fixed schedule for highlighting
                    currentTimeSlotIndex = fixedHours.indexOf(currentHour);
                    
                    // Get all events for this day to position them absolutely
                    const dayEvents = getEventsForDate(selectedDate);
                    
                    return (
                      <>
                        {/* Time slot rows */}
                        {timeSlots.map((timeSlot, index) => {
                          const dayLeads = getScheduledCallsForDate(selectedDate);
                          const timeSlotLeads = getLeadsForTimeSlot(selectedDate, timeSlot, dayLeads);
                          
                          // Highlight current hour only if selected date is today
                          const isToday = isSameDay(selectedDate, new Date());
                          const isCurrentHour = isToday && index === currentTimeSlotIndex;
                          
                          return (
                            <div key={timeSlot} className={`flex border-b border-blue-400/30 last:border-b-0 ${isCurrentHour ? 'bg-blue-600/30' : 'hover:bg-slate-800/40'} relative transition-colors`} style={{ height: '64px' }}>
                              {/* Time Column */}
                              <div className={`w-24 p-2 bg-slate-800/50 border-r border-blue-400/30 flex items-start pt-2 ${isCurrentHour ? 'bg-blue-600/40' : ''}`}>
                                <span className={`text-sm font-medium ${isCurrentHour ? 'text-blue-300 font-bold' : 'text-blue-200/90'}`}>
                                  {timeSlot}
                                </span>
                              </div>
                              
                              {/* Content Column */}
                              <div className="flex-1 p-2 relative overflow-hidden">
                                <div className="space-y-1 h-full overflow-hidden">
                                  {/* Scheduled Calls */}
                                  {timeSlotLeads.map((lead) => (
                                    <div 
                                      key={lead.id}
                                      className="bg-blue-600 text-white p-2 rounded text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                                      onClick={() => {
                                        setSelectedLead(lead);
                                        setShowLeadDetailModal(true);
                                      }}
                                      data-testid={`card-lead-${lead.id}`}
                                    >
                                      <div className="font-semibold truncate">{lead.fullName}</div>
                                      <div className="text-white/90 truncate">
                                        📞 {formatPhoneNumber(lead.phone)}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Single-hour events for this time slot */}
                                  {(() => {
                                    const currentHour = fixedHours[index];
                                    const singleHourEvents = dayEvents.filter(event => {
                                      if (!event.startTime || !event.endTime) return false;
                                      const [startHour] = event.startTime.split(':');
                                      const [endHour] = event.endTime.split(':');
                                      const startHour24 = parseInt(startHour);
                                      const endHour24 = parseInt(endHour);
                                      const duration = endHour24 - startHour24;
                                      return startHour24 === currentHour && duration === 1;
                                    });
                                    
                                    return singleHourEvents.map((event) => (
                                      <div
                                        key={`slot-event-${event.id}`}
                                        onClick={() => {
                                          setEventToEdit(event);
                                          setShowEditEventModal(true);
                                        }}
                                        className="bg-blue-500 text-white p-2 rounded-t rounded-b-lg hover:bg-blue-600 transition-colors cursor-pointer border-l-4 border-blue-300 overflow-hidden"
                                        data-testid={`card-event-${event.id}`}
                                      >
                                        <div className="font-semibold truncate text-sm" data-testid={`text-event-title-${event.id}`}>
                                          {event.title}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Absolutely positioned spanning events (multi-hour only) */}
                        {dayEvents.map((event, eventIndex) => {
                          if (!event.startTime || !event.endTime) return null;
                          
                          const [startHour] = event.startTime.split(':');
                          const [endHour] = event.endTime.split(':');
                          const startHour24 = parseInt(startHour);
                          const endHour24 = parseInt(endHour);
                          const duration = endHour24 - startHour24;
                          
                          // Skip single-hour events (they're rendered within time slots)
                          if (duration === 1) return null;
                          
                          // Find the starting row index
                          const startRowIndex = fixedHours.indexOf(startHour24);
                          if (startRowIndex === -1) return null;
                          
                          // Calculate position and height
                          const topPosition = startRowIndex * 64; // Each row is 64px
                          const eventHeight = duration * 64;
                          
                          return (
                            <div
                              key={`event-${event.id}-${eventIndex}`}
                              onClick={() => {
                                setEventToEdit(event);
                                setShowEditEventModal(true);
                              }}
                              className="absolute bg-blue-500 text-white p-2 rounded text-xs hover:bg-blue-600 transition-colors cursor-pointer border-l-4 border-blue-300 z-10"
                              style={{
                                top: `${topPosition + 4}px`, // 4px padding from row top
                                left: '104px', // 96px (time column) + 8px padding
                                right: '8px', // 8px padding from right edge
                                height: `${eventHeight - 8}px`, // Subtract small padding for multi-hour events
                                minHeight: '32px'
                              }}
                              data-testid={`card-event-${event.id}`}
                            >
                              <div className="font-semibold truncate" data-testid={`text-event-title-${event.id}`}>
                                {event.title}
                              </div>
                              <div className="text-white/90 truncate">
                                📅 {formatTimeToAMPM(event.startTime)} - {formatTimeToAMPM(event.endTime)}
                              </div>
                              {event.description && (
                                <div className="text-white/80 text-xs mt-1 truncate">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );

      case "agents":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Agent Management
              </h2>
              <p className="text-white/70">Manage lead assignments and agent performance</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sarah Johnson */}
              <Card className="bg-white/10 border-blue-400/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img 
                      src={sarahHeadshot} 
                      alt="Sarah Johnson" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <CardTitle className="text-white">Sarah Johnson</CardTitle>
                      <p className="text-white/70 text-sm">{sarahLeads.length} active leads</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sarahLeads.slice(0, 1).map(lead => (
                      <DetailedLeadCard key={lead.id} lead={lead} />
                    ))}
                    {sarahLeads.length === 0 && (
                      <p className="text-white/70 text-center py-4">No assigned leads</p>
                    )}
                    {sarahLeads.length > 1 && (
                      <Button 
                        className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white"
                        onClick={() => setActiveTab("sarah")}
                      >
                        View All {sarahLeads.length} Leads
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mitchell Young */}
              <Card className="bg-white/10 border-blue-400/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img 
                      src={mitchellHeadshot} 
                      alt="Mitchell Young" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <CardTitle className="text-white">Mitchell Young</CardTitle>
                      <p className="text-white/70 text-sm">{mitchellLeads.length} active leads</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mitchellLeads.slice(0, 1).map(lead => (
                      <DetailedLeadCard key={lead.id} lead={lead} />
                    ))}
                    {mitchellLeads.length === 0 && (
                      <p className="text-white/70 text-center py-4">No assigned leads</p>
                    )}
                    {mitchellLeads.length > 1 && (
                      <Button 
                        className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white"
                        onClick={() => setActiveTab("mitchell")}
                      >
                        View All {mitchellLeads.length} Leads
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "calendar":
        // Generate calendar grid
        const generateCalendarGrid = () => {
          const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
          const startDate = new Date(startOfMonth);
          startDate.setDate(startDate.getDate() - startOfMonth.getDay()); // Start from Sunday
          
          const weeks = [];
          let currentDate = new Date(startDate);
          
          // Generate 6 weeks to ensure full month coverage
          for (let week = 0; week < 6; week++) {
            const days = [];
            for (let day = 0; day < 7; day++) {
              days.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(days);
          }
          
          return weeks;
        };


        const weeks = generateCalendarGrid();
        const monthName = format(currentMonth, "MMMM yyyy");
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        return (
          <div className="h-full flex flex-col min-h-[100dvh] w-full">
            {/* Calendar Header */}
            <div className="space-y-4 mb-6 w-full px-4">
              {/* Mobile: Stack title and controls vertically */}
              <div className="md:hidden">
                <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {monthName}
                </h2>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      variant="outline"
                      size="sm"
                      className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setCurrentMonth(new Date())}
                      variant="outline"
                      size="sm"
                      className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20 px-3"
                    >
                      Today
                    </Button>
                    <Button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      variant="outline"
                      size="sm"
                      className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedDate(selectedDate || new Date());
                      setShowAddEventModal(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/30 bg-gradient-to-r from-blue-700/60 to-blue-600/50 text-white hover:from-blue-700/80 hover:to-blue-600/70 px-3"
                    data-testid="button-add-event"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
              
              {/* Desktop: Original horizontal layout */}
              <div className="hidden md:flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {monthName}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setCurrentMonth(new Date())}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20 px-4"
                  >
                    Today
                  </Button>
                  <Button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 bg-blue-400/30" />
                  <Button
                    onClick={() => {
                      setSelectedDate(selectedDate || new Date());
                      setShowAddEventModal(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-blue-400/30 bg-gradient-to-r from-blue-700/60 to-blue-600/50 text-white hover:from-blue-700/80 hover:to-blue-600/70 px-4"
                    data-testid="button-add-event"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 overflow-hidden shadow-lg mx-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gradient-to-r from-slate-800/80 via-blue-800/60 to-slate-800/80 border-b border-blue-400/30">
                {dayNames.map((day) => (
                  <div key={day} className="p-4 text-center text-blue-200/90 font-medium border-r border-blue-400/30 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Weeks */}
              <div className="grid grid-rows-6 flex-1" style={{ minHeight: 'calc(100vh - 280px)' }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 border-t border-blue-400/30 flex-1">
                    {week.map((date, dayIndex) => {
                      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`
                            relative p-3 border-r border-blue-400/30 last:border-r-0 cursor-pointer min-h-24
                            bg-slate-800/40 hover:bg-slate-700/60 transition-colors flex-1
                            ${isSelected ? 'bg-blue-600/40 hover:bg-blue-600/50' : ''}
                            ${isToday ? 'bg-blue-500/30 hover:bg-blue-500/40' : ''}
                          `}
                          onClick={() => {
                            setSelectedDayPopup(date);
                            setShowDayPopup(true);
                          }}
                          style={{ minHeight: '120px' }}
                        >
                          <div className={`
                            text-sm font-medium mb-2
                            ${isCurrentMonth ? 'text-white' : 'text-blue-200/40'}
                            ${isToday ? 'text-blue-300 font-bold' : ''}
                          `}>
                            {date.getDate()}
                          </div>
                          
                          {/* Scheduled Calls & Events */}
                          {isCurrentMonth && (() => {
                            const scheduledCalls = getScheduledCallsForDate(date);
                            const eventsForDate = getEventsForDate(date);
                            const totalItems = scheduledCalls.length + eventsForDate.length;
                            
                            if (totalItems === 0) return null;
                            
                            // Calculate how many items to show (up to 3 total)
                            const maxItems = 3;
                            const callsToShow = Math.min(maxItems, scheduledCalls.length);
                            const slotsRemaining = maxItems - callsToShow;
                            const eventsToShow = Math.min(slotsRemaining, eventsForDate.length);
                            const totalRendered = callsToShow + eventsToShow;
                            const moreCount = totalItems - totalRendered;
                            
                            return (
                              <div className="absolute top-8 left-2 right-2 space-y-1">
                                {/* Display scheduled calls */}
                                {scheduledCalls.slice(0, callsToShow).map((lead) => (
                                  <div key={lead.id} className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded truncate">
                                    Call: {lead.fullName}
                                  </div>
                                ))}
                                
                                {/* Display events */}
                                {eventsForDate.slice(0, eventsToShow).map((event) => (
                                  <div key={event.id} className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded truncate">
                                    {event.startTime}: {event.title}
                                  </div>
                                ))}
                                
                                {/* Show "more" indicator if needed */}
                                {moreCount > 0 && (
                                  <div className="text-white/70 text-xs px-1">
                                    +{moreCount} more
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "sarah":
      case "mitchell":
        const agentName = activeTab === "sarah" ? "Sarah Johnson" : "Mitchell Young";
        const agentLeads = activeTab === "sarah" ? sarahLeads : mitchellLeads;
        const agentImage = activeTab === "sarah" ? sarahHeadshot : mitchellHeadshot;
        
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img 
                src={agentImage} 
                alt={agentName} 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {agentName}
                </h2>
                <p className="text-white/70">{agentLeads.length} active leads</p>
              </div>
              <Button
                className="ml-auto !bg-blue-600 hover:!bg-blue-700 !text-white"
                onClick={() => {
                  setAddLeadSection(agentName);
                  setShowAddLeadModal(true);
                }}
                data-testid={`button-add-lead-${activeTab}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
              {agentLeads.map(lead => (
                <DetailedLeadCard key={lead.id} lead={lead} />
              ))}
              {agentLeads.length === 0 && (
                <div className="col-span-2">
                  <p className="text-white/70 text-center py-8">No leads assigned to {agentName}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {tabName} Leads
              </h2>
              <p className="text-white/70">{leads.length} leads in this category</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
              {leads.map(lead => (
                <DetailedLeadCard key={lead.id} lead={lead} />
              ))}
              {leads.length === 0 && (
                <div className="col-span-2">
                  <p className="text-white/70 text-center py-8">No {tabName.toLowerCase()} leads found</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex h-full min-h-0">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:flex w-64 bg-black/20 border-r border-blue-400/30 flex-col">
          <div className="p-6 border-b border-blue-400/30">
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Lead Dashboard
            </h1>
            <p className="text-white/70 text-sm mt-1">Manage your real estate leads</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.isDropdown && (activeTab === "sarah" || activeTab === "mitchell"));
                
                // Handle dropdown items differently
                if (item.isDropdown && item.id === "agents") {
                  return (
                    <DropdownMenu key={item.id}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                            ${isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }
                          `}
                          data-testid={`nav-${item.id}`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="flex-1">{item.label}</span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        side="right" 
                        className="w-56 bg-slate-800 border-blue-400/30"
                      >
                        {agentOptions.map((agent) => (
                          <DropdownMenuItem
                            key={agent.id}
                            onClick={() => setActiveTab(agent.id)}
                            className="text-white hover:bg-blue-600 cursor-pointer"
                            data-testid={`nav-agent-${agent.id}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{agent.label}</span>
                              {agent.count > 0 && (
                                <Badge className="!bg-blue-500 !text-white text-xs">
                                  {agent.count}
                                </Badge>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    data-testid={`nav-${item.id}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge className="!bg-blue-500 !text-white text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-blue-400/30">
            <div className="flex items-center justify-center gap-2">
              <img 
                src="/attached_assets/LeadsByNova Favicon_White Transparent (Small)_1758779673680.png" 
                alt="LeadsByNova" 
                className="w-4 h-4"
              />
              <p className="text-white/50 text-xs">
                Powered by LeadsByNova
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Main Workspace - Hidden on Mobile */}
        <div className="hidden md:flex flex-1 overflow-y-auto">
          <div className={activeTab === "calendar" ? "p-0 w-full" : "p-8"}>
            {renderWorkspaceContent()}
          </div>
        </div>
        
        {/* Mobile Full-Screen View */}
        <div className="md:hidden flex-1 overflow-y-auto">
          {showMobileFolderDialog ? (
            // Mobile folder content dialog
            <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
              {/* Mobile header with back button - Fixed/Sticky */}
              <div className="sticky top-0 z-20 p-4 border-b border-blue-400/30 flex items-center gap-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFolderDialog(false)}
                  className="!text-white hover:!bg-white/10"
                  data-testid="button-mobile-back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h1>
              </div>
              
              {/* Mobile content area - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  {renderWorkspaceContent()}
                </div>
              </div>
            </div>
          ) : (
            // Mobile folder grid
            <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
              {/* Mobile header */}
              <div className="p-3 border-b border-blue-400/30">
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lead Dashboard
                </h1>
                <p className="text-white/70 text-xs mt-0.5">Manage your real estate leads</p>
              </div>
              
              {/* Mobile folder grid */}
              <div className="p-3 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    
                    // Handle dropdown items differently for mobile
                    if (item.isDropdown && item.id === "agents") {
                      return (
                        <div key={item.id} className="col-span-2">
                          <div className="mb-2">
                            <h3 className="text-white/70 text-sm font-medium px-2">{item.label}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {agentOptions.map((agent) => (
                              <button
                                key={agent.id}
                                onClick={() => {
                                  setActiveTab(agent.id);
                                  setShowMobileFolderDialog(true);
                                }}
                                className="bg-white/10 border border-blue-400/30 rounded-lg p-4 text-white hover:bg-white/20 transition-colors"
                                data-testid={`mobile-nav-agent-${agent.id}`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Icon className="h-8 w-8" />
                                  <span className="text-sm font-medium text-center">{agent.label}</span>
                                  {agent.count > 0 && (
                                    <Badge className="!bg-blue-500 !text-white text-xs">
                                      {agent.count}
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileFolderDialog(true);
                        }}
                        className="bg-white/10 border border-blue-400/30 rounded-lg p-5 text-white hover:bg-white/20 transition-colors"
                        data-testid={`mobile-nav-${item.id}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Icon className="h-9 w-9" />
                          <span className="text-sm font-medium text-center">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <Badge className="!bg-blue-500 !text-white text-xs">
                              {item.count}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lead Details
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  View detailed information about this lead
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-lead-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                  <TabsTrigger value="info" className="text-white data-[state=active]:bg-blue-600">
                    Lead Information
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-white data-[state=active]:bg-blue-600">
                    Chat Details
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-white data-[state=active]:bg-blue-600">
                    Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white/70">Full Name</Label>
                            <p className="text-white font-medium">{selectedLead.fullName}</p>
                          </div>
                          <div>
                            <Label className="text-white/70">Email</Label>
                            <p className="text-white font-medium">{selectedLead.email}</p>
                          </div>
                          <div>
                            <Label className="text-white/70">Phone</Label>
                            <p className="text-white font-medium">{formatPhoneNumber(selectedLead.phone)}</p>
                          </div>
                          <div>
                            <Label className="text-white/70">Guide Type</Label>
                            <p className="text-white font-medium">{selectedLead.guideType}</p>
                          </div>
                          <div>
                            <Label className="text-white/70">Form Submitted</Label>
                            <p className="text-white font-medium">{formatDate(selectedLead.formTimestamp)}</p>
                          </div>
                          {selectedLead.assignedTo && (
                            <div>
                              <Label className="text-white/70">Assigned To</Label>
                              <p className="text-white font-medium">{selectedLead.assignedTo}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                  <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold text-lg mb-4">Chat Information</h3>
                      
                      {selectedLead.completedChat === "true" ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedLead.prequalified && (
                              <div>
                                <Label className="text-white/70">Pre-qualified</Label>
                                <p className="text-white font-medium">{selectedLead.prequalified}</p>
                              </div>
                            )}
                            {selectedLead.preQualificationRange && (
                              <div>
                                <Label className="text-white/70">Qualification Range</Label>
                                <p className="text-white font-medium">{selectedLead.preQualificationRange}</p>
                              </div>
                            )}
                            {selectedLead.moveTimeline && (
                              <div>
                                <Label className="text-white/70">Move Timeline</Label>
                                <p className="text-white font-medium">{selectedLead.moveTimeline}</p>
                              </div>
                            )}
                            {selectedLead.haveAgent && (
                              <div>
                                <Label className="text-white/70">Has Agent</Label>
                                <p className="text-white font-medium">{selectedLead.haveAgent}</p>
                              </div>
                            )}
                            {selectedLead.budgetRange && (
                              <div>
                                <Label className="text-white/70">Budget Range</Label>
                                <p className="text-white font-medium">{selectedLead.budgetRange}</p>
                              </div>
                            )}
                            {selectedLead.propertyType && (
                              <div>
                                <Label className="text-white/70">Property Type</Label>
                                <p className="text-white font-medium">{selectedLead.propertyType}</p>
                              </div>
                            )}
                          </div>
                          
                          {selectedLead.haveAgent && (
                            <div className="mt-4">
                              {getAgentStatusBadge(selectedLead.haveAgent)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-white/70">This lead has not completed the chat questionnaire yet.</p>
                          <Badge className="!bg-blue-500 !text-white mt-2">Form Only</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold text-lg mb-4">Notes</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white/70">Current Notes</Label>
                          <div className="mt-2 p-4 bg-black/20 rounded-lg border border-blue-400/30">
                            {selectedLead.notes && selectedLead.notes.length > 0 ? (
                              <div className="space-y-3">
                                {selectedLead.notes.map((note, index) => (
                                  <div key={index} className="border-l-2 border-blue-400 pl-3">
                                    <p className="text-white whitespace-pre-wrap">{note.content}</p>
                                    <p className="text-white/50 text-xs mt-1">{note.timestamp}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-white/50 italic">No notes added yet</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-white/70">Add/Update Notes</Label>
                          <Textarea
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            placeholder="Add notes about this lead..."
                            className="mt-2 bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                            rows={4}
                            data-testid="textarea-lead-notes"
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button
                            onClick={() => {
                              if (selectedLead.id) {
                                saveNotesMutation.mutate({
                                  leadId: selectedLead.id,
                                  noteContent: currentNote
                                });
                              }
                            }}
                            disabled={saveNotesMutation.isPending}
                            className="!bg-green-600 hover:!bg-green-700 !text-white"
                            data-testid="button-save-notes"
                          >
                            {saveNotesMutation.isPending ? "Saving..." : "Save Notes"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Lead Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white">Assign Lead</DialogTitle>
                <DialogDescription className="text-white/70">
                  Assign this lead to an agent
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssignModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-assign-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Select Agent</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="mt-2 bg-white/10 border-blue-400/30 text-white">
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent className="bg-blue-900 border-blue-400/30">
                  <SelectItem value="Sarah Johnson" className="text-white hover:bg-blue-800 focus:bg-blue-800 focus:text-white">Sarah Johnson</SelectItem>
                  <SelectItem value="Mitchell Young" className="text-white hover:bg-blue-800 focus:bg-blue-800 focus:text-white">Mitchell Young</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  if (leadToAssign?.id && selectedAssignee) {
                    assignLeadMutation.mutate({
                      leadId: leadToAssign.id,
                      assignedTo: selectedAssignee
                    });
                  }
                }}
                disabled={!selectedAssignee || assignLeadMutation.isPending}
                className="!bg-blue-600 hover:!bg-blue-700 !text-white flex-1"
                data-testid="button-confirm-assign"
              >
                {assignLeadMutation.isPending ? "Assigning..." : "Assign Lead"}
              </Button>
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setLeadToAssign(null);
                  setSelectedAssignee("");
                }}
                className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
                data-testid="button-cancel-assign"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white">
                  {activeTab === "trash" ? "Delete Lead" : "Move to Trash"}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {activeTab === "trash" 
                    ? "Are you sure you want to permanently delete this lead?"
                    : "Are you sure you want to move this lead to the Trash Bin?"
                  }
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-delete-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                if (leadToDelete?.id) {
                  if (activeTab === "trash") {
                    permanentDeleteMutation.mutate({ leadId: leadToDelete.id });
                  } else {
                    deleteLeadMutation.mutate({ leadId: leadToDelete.id });
                  }
                }
              }}
              disabled={activeTab === "trash" ? permanentDeleteMutation.isPending : deleteLeadMutation.isPending}
              className="!bg-red-600 hover:!bg-red-700 !text-white flex-1"
              data-testid="button-confirm-delete"
            >
              {activeTab === "trash" 
                ? (permanentDeleteMutation.isPending ? "Deleting..." : "Delete")
                : (deleteLeadMutation.isPending ? "Deleting..." : "Move to Trash")
              }
            </Button>
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setLeadToDelete(null);
              }}
              className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Calendar Popup */}
      <Dialog open={showDayPopup} onOpenChange={setShowDayPopup}>
        <DialogContent className="max-w-4xl h-[80vh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl">
                  {selectedDayPopup && format(selectedDayPopup, "EEEE, MMMM do, yyyy")}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Scheduled calls and events for this day
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDayPopup(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-day-popup"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {/* Hourly Schedule Grid */}
            <div className="bg-white/5 rounded-lg border border-blue-400/30 overflow-hidden h-full flex flex-col">
              {/* Time Header */}
              <div className="bg-white/10 p-4 border-b border-blue-400/20 flex-shrink-0 flex items-center justify-between">
                <h3 className="text-white font-semibold">Daily Schedule</h3>
                <Button
                  onClick={() => {
                    // Set the selected date to the popup date and open Add Event modal
                    if (selectedDayPopup) {
                      setSelectedDate(selectedDayPopup);
                      // Update the form date to match the selected day
                      addEventForm.setValue('date', format(selectedDayPopup, 'yyyy-MM-dd'));
                    }
                    // Close the daily popup to avoid stacked dialogs
                    setShowDayPopup(false);
                    setShowAddEventModal(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-400/30 bg-gradient-to-r from-blue-700/60 to-blue-600/50 text-white hover:from-blue-700/80 hover:to-blue-600/70"
                  data-testid="button-add-event-daily"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
              
              {/* Scrollable Time Slots */}
              <ScrollArea className="flex-1">
                <div className="space-y-0">
                  {[
                    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
                    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", 
                    "5:00 PM", "6:00 PM"
                  ].map((timeSlot, index) => (
                    <div key={timeSlot} className="flex border-b border-blue-400/20 last:border-b-0">
                      {/* Time Column */}
                      <div className="w-24 p-4 bg-white/5 border-r border-blue-400/20 flex items-start pt-4">
                        <span className="text-white/70 text-sm font-medium">{timeSlot}</span>
                      </div>
                      
                      {/* Content Column */}
                      <div className="flex-1 p-4 min-h-16 relative">
                        {/* Scheduled calls and events positioned with smart logic */}
                        {selectedDayPopup && (() => {
                          const dayLeads = getScheduledCallsForDate(selectedDayPopup);
                          const dayEvents = getEventsForDate(selectedDayPopup);
                          const timeSlotLeads = getLeadsForTimeSlot(selectedDayPopup, timeSlot, dayLeads);
                          const timeSlotEvents = getEventsForTimeSlot(selectedDayPopup, timeSlot, dayEvents);
                          
                          return (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
                              {/* Scheduled Calls */}
                              {timeSlotLeads.map((lead, leadIndex) => (
                                <div 
                                  key={lead.id}
                                  className="bg-blue-600 text-white p-3 rounded-lg shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setShowLeadDetailModal(true);
                                    setShowDayPopup(false);
                                  }}
                                >
                                  <div className="font-semibold text-sm">{lead.fullName}</div>
                                  <div className="text-white/90 text-xs mt-1">
                                    📞 {formatPhoneNumber(lead.phone)}
                                  </div>
                                  <div className="text-white/80 text-xs mt-1">
                                    {extractTimeFromDaySelected(lead.daySelected)}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Events */}
                              {timeSlotEvents.map(({ event, isStartSlot, isEndSlot }, eventIndex) => (
                                <div 
                                  key={`${event.id}-${timeSlot}-${eventIndex}`}
                                  onClick={() => {
                                    setEventToEdit(event);
                                    setShowEditEventModal(true);
                                  }}
                                  className={`bg-blue-600 text-white p-3 rounded-lg shadow-sm hover:bg-blue-700 transition-colors cursor-pointer ${
                                    isStartSlot ? 'border-l-4 border-blue-300' : ''
                                  } ${
                                    !isStartSlot ? 'opacity-75' : ''
                                  }`}
                                >
                                  <div className="font-semibold text-sm">{isStartSlot ? event.title : `↳ ${event.title}`}</div>
                                  <div className="text-white/90 text-xs mt-1">
                                    {isStartSlot ? `📅 ${formatTimeToAMPM(event.startTime)} - ${formatTimeToAMPM(event.endTime)}` : '⏰ continues'}
                                  </div>
                                  {isStartSlot && event.description && (
                                    <div className="text-white/80 text-xs mt-1">
                                      {event.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal (Simple) */}
      <Dialog open={showLeadDetailModal} onOpenChange={setShowLeadDetailModal}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Lead Details
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Contact information and status
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              <Card 
                className="bg-white/5 border-blue-400/30 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  setShowLeadDetailModal(false);
                  setShowLeadModal(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Name and Contact */}
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-4">{selectedLead.fullName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white/70">Email</Label>
                          <p className="text-white">{selectedLead.email}</p>
                        </div>
                        <div>
                          <Label className="text-white/70">Phone</Label>
                          <p className="text-white">{formatPhoneNumber(selectedLead.phone)}</p>
                        </div>
                        <div>
                          <Label className="text-white/70">Guide Type</Label>
                          <p className="text-white">{selectedLead.guideType}</p>
                        </div>
                        <div>
                          <Label className="text-white/70">Form Submitted</Label>
                          <p className="text-white">{formatDate(selectedLead.formTimestamp)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Call Info */}
                    {selectedLead.bookedCall && selectedLead.daySelected && (
                      <div className="border-t border-blue-400/20 pt-4">
                        <Label className="text-white/70">Scheduled Call</Label>
                        <div className="mt-2">
                          <div className="text-white">📅 {selectedLead.daySelected}</div>
                          <div className="text-white/90">☎️ {selectedLead.bookedCall}</div>
                        </div>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 border-t border-blue-400/20 pt-4">
                      {getStatusBadge(selectedLead)}
                      {getQualificationBadge(selectedLead.prequalified)}
                      {selectedLead.assignedTo && (
                        <Badge className="!bg-blue-600 !text-white">
                          Assigned to {selectedLead.assignedTo}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Click hint */}
                    <div className="text-center pt-2">
                      <p className="text-white/60 text-sm">Click to view detailed information</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Modal */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white">
                  {leadToArchive?.archived === "true" ? "Unarchive Lead" : "Archive Lead"}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {leadToArchive?.archived === "true" 
                    ? "Are you sure you want to move this lead to the Unassigned Leads folder?"
                    : "Are you sure you want to move this lead to the Archive Folder?"
                  }
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchiveModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-archive-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                if (leadToArchive?.id) {
                  const isUnarchiving = leadToArchive.archived === "true";
                  archiveLeadMutation.mutate({ 
                    leadId: leadToArchive.id, 
                    archived: leadToArchive.archived === "true" ? "false" : "true",
                    clearAssignment: isUnarchiving
                  });
                  setShowArchiveModal(false);
                  setLeadToArchive(null);
                }
              }}
              disabled={archiveLeadMutation.isPending}
              className="!bg-yellow-600 hover:!bg-yellow-700 !text-white flex-1"
              data-testid="button-confirm-archive"
            >
              {archiveLeadMutation.isPending 
                ? (leadToArchive?.archived === "true" ? "Unarchiving..." : "Archiving...")
                : (leadToArchive?.archived === "true" ? "Unarchive" : "Archive")
              }
            </Button>
            <Button
              onClick={() => {
                setShowArchiveModal(false);
                setLeadToArchive(null);
              }}
              className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
              data-testid="button-cancel-archive"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={showAddLeadModal} onOpenChange={setShowAddLeadModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/10 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Add New Lead
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {addLeadSection && `Adding lead to: ${addLeadSection}`}
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddLeadModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-add-lead-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <Form {...addLeadForm}>
            <form onSubmit={addLeadForm.handleSubmit((data) => 
              createLeadMutation.mutate({ ...data, section: addLeadSection })
            )} className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={addLeadForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                            placeholder="Enter full name"
                            data-testid="input-full-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addLeadForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                            placeholder="Enter email address"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addLeadForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                            placeholder="Enter phone number"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addLeadForm.control}
                    name="guideType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Guide Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-white/10 border-blue-400/30 text-white" data-testid="select-guide-type">
                              <SelectValue placeholder="Select guide type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Relocation Guide">Relocation Guide</SelectItem>
                              <SelectItem value="First Time Home Buyer Guide">First Time Home Buyer Guide</SelectItem>
                              <SelectItem value="Sellers Guide">Sellers Guide</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Additional Information (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={addLeadForm.control}
                    name="prequalified"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Pre-qualified?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Yes" id="prequalified-yes" />
                              <Label htmlFor="prequalified-yes" className="text-white/70">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="No" id="prequalified-no" />
                              <Label htmlFor="prequalified-no" className="text-white/70">No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="not_specified" id="prequalified-not-specified" />
                              <Label htmlFor="prequalified-not-specified" className="text-white/70">Not Specified</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addLeadForm.control}
                      name="budgetRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70">Budget Range</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                              placeholder="e.g., $200k - $300k"
                              data-testid="input-budget-range"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addLeadForm.control}
                      name="moveTimeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70">Move Timeline</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                              placeholder="e.g., 3-6 months"
                              data-testid="input-move-timeline"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addLeadForm.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Property Type</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                            placeholder="e.g., Single Family Home, Condo, etc."
                            data-testid="input-property-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createLeadMutation.isPending}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white flex-1"
                  data-testid="button-save-lead"
                >
                  {createLeadMutation.isPending ? "Creating Lead..." : "Create Lead"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddLeadModal(false);
                    setAddLeadSection("");
                    addLeadForm.reset();
                  }}
                  className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
                  data-testid="button-cancel-add-lead"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Event Modal */}
      <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Add New Event
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Create a new event for your calendar
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddEventModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-add-event-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <Form {...addEventForm}>
            <form onSubmit={addEventForm.handleSubmit((data) => createEventMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addEventForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Event Title</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter event title"
                        data-testid="input-event-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addEventForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter event description"
                        rows={3}
                        data-testid="input-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addEventForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Date</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        className="bg-white/10 border-blue-400/30 text-white"
                        data-testid="input-event-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addEventForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          className="bg-white/10 border-blue-400/30 text-white"
                          data-testid="input-event-start-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addEventForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">End Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          className="bg-white/10 border-blue-400/30 text-white"
                          data-testid="input-event-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white flex-1"
                  data-testid="button-save-event"
                >
                  {createEventMutation.isPending ? "Creating Event..." : "Create Event"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddEventModal(false);
                    addEventForm.reset();
                  }}
                  className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
                  data-testid="button-cancel-add-event"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={showEditEventModal} onOpenChange={setShowEditEventModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Edit Event
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Update your calendar event
                </DialogDescription>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditEventModal(false)}
                className="md:hidden !text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-edit-event-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <Form {...editEventForm}>
            <form onSubmit={editEventForm.handleSubmit((data) => updateEventMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editEventForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Event Title</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter event title"
                        data-testid="input-edit-event-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editEventForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter event description"
                        rows={3}
                        data-testid="input-edit-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editEventForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Date</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        type="date"
                        data-testid="input-edit-event-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editEventForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                          type="time"
                          data-testid="input-edit-event-start-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editEventForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">End Time</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                          type="time"
                          data-testid="input-edit-event-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateEventMutation.isPending}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white flex-1"
                  data-testid="button-update-event"
                >
                  {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditEventModal(false);
                    setEventToEdit(null);
                  }}
                  className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
                  data-testid="button-cancel-edit-event"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}