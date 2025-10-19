import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { useAuth } from "@/hooks/useAuth";
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
  X,
  LogOut,
  Shield,
  UserCheck,
  Settings,
  Menu,
  FileText,
  HelpCircle,
  Send,
  Loader2,
  Search,
  Download
} from "lucide-react";
import html2pdf from 'html2pdf.js';
import { format, addDays, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import { type Lead, insertEventSchema, type Event, type Agent, type Note, insertNoteSchema, type PipelineResponse, createManualLeadSchema } from "@shared/schema";
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

// Reusable Help Tooltip Component
const HelpTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 ml-2 text-white/50 hover:text-white/80 cursor-pointer"
        onClick={(e) => {
          // On mobile, prevent the button default behavior and let the tooltip handle the click
          e.preventDefault();
        }}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs" side="bottom" align="center">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);

// Consent Records View Component
const ConsentRecordsView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch consent records with optional search
  const { data: consentRecords = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/consent-records', searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/api/consent-records?search=${encodeURIComponent(searchTerm)}` : '/api/consent-records';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch consent records');
      return response.json();
    },
  });

  // Delete all consent records mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/consent-records/all', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete consent records');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consent-records'] });
      toast({
        title: "Success",
        description: "All consent records have been deleted",
      });
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete consent records",
      });
    },
  });

  const handlePrint = (record: any) => {
    setSelectedRecord(record);
    setShowPrintDialog(true);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-content');
    if (!element) return;
    
    const opt = {
      margin: 0.5,
      filename: `consent-receipt-${selectedRecord?.fullName?.replace(/\s+/g, '-') || 'record'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const printableReceipt = selectedRecord && (
    <div className="p-8 bg-white text-black max-w-2xl mx-auto">
      <div className="border-2 border-black p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">CONSENT RECORD RECEIPT</h1>
        
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Contact Information</h2>
          <p><strong>Full Name:</strong> {selectedRecord.fullName}</p>
          <p><strong>Email:</strong> {selectedRecord.email}</p>
          <p><strong>Phone:</strong> {selectedRecord.phone}</p>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Submission Details</h2>
          <p><strong>Guide Requested:</strong> {selectedRecord.guideType}</p>
          <p><strong>Sender:</strong> {selectedRecord.senderName || 'LeadsByNova™'}</p>
          <p><strong>Channels Consented:</strong> {selectedRecord.channelsConsented || 'Email, SMS'}</p>
          <p><strong>Source URL:</strong> {selectedRecord.sourceUrl || 'N/A'}</p>
          <p><strong>Timestamp (UTC):</strong> {new Date(selectedRecord.formTimestamp).toISOString()}</p>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Consent Statement</h2>
          <div className="border border-gray-400 p-4 bg-gray-50">
            <p className="italic whitespace-pre-wrap">{selectedRecord.consentText}</p>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p><strong>Disclosure Version:</strong> {selectedRecord.disclosureVersion || 'N/A'}</p>
            <p><strong>Disclosure Hash (SHA-256):</strong> {selectedRecord.disclosureHash || 'N/A'}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Technical Verification</h2>
          <p className="text-sm"><strong>IP Address:</strong> {selectedRecord.ipAddress || 'Not captured'}</p>
          <p className="text-sm"><strong>User Agent:</strong> {selectedRecord.userAgent || 'Not captured'}</p>
          <p className="text-sm"><strong>Record Created:</strong> {new Date(selectedRecord.createdAt).toISOString()}</p>
          <p className="text-sm"><strong>Record ID:</strong> {selectedRecord.id}</p>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-400 text-sm text-gray-600">
          <p className="font-semibold mb-2">Compliance Notice:</p>
          <p>This record serves as tamper-resistant proof of opt-in consent for marketing communications. The SHA-256 hash verifies the integrity of the disclosure text shown at the time of submission. This documentation is maintained for TCPA and carrier compliance requirements.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Consent Records
          </h2>
          <HelpTooltip content="Consent Records provides an immutable compliance log of all opt-in submissions. Each record captures the exact moment a prospect gave consent to receive communications, including their contact information, IP address, and user agent. This information is crucial for proving compliance with anti-spam laws and regulations. Use the search bar to find specific records by name, email, or phone number. Click 'Print Receipt' to generate a formal proof of consent for your records. These records are preserved even if the associated lead is deleted, ensuring you maintain compliance documentation." />
        </div>
      </div>

      {/* Search Bar and Actions */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-white/50" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-white/10 border border-blue-400/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-testid="input-search-consent-records"
          />
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            data-testid="button-delete-all-consent-records"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Records Count */}
      <p className="text-white/70">{consentRecords.length} consent record(s) found</p>

      {/* Records List */}
      {isLoading ? (
        <div className="text-center py-12 text-white/70">Loading consent records...</div>
      ) : consentRecords.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 p-12 text-center">
          <Shield className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 text-lg">No consent records found</p>
          <p className="text-white/50 text-sm mt-2">Consent records will appear here when forms are submitted</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {consentRecords.map((record: any) => (
            <Card key={record.id} className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {record.fullName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-white/90">
                  <p className="text-sm"><strong>Email:</strong> {record.email}</p>
                  <p className="text-sm"><strong>Phone:</strong> {record.phone}</p>
                  <p className="text-sm"><strong>Guide:</strong> {record.guideType}</p>
                </div>
                <div className="text-white/70 text-xs pt-2 border-t border-blue-400/20">
                  <p><strong>Submitted:</strong> {new Date(record.formTimestamp).toLocaleString()}</p>
                  <p><strong>IP:</strong> {record.ipAddress || 'N/A'}</p>
                </div>
                <Button
                  onClick={() => handlePrint(record)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid={`button-print-${record.id}`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consent Receipt</DialogTitle>
          </DialogHeader>
          <div id="printable-content">
            {printableReceipt}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              onClick={() => {
                window.print();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-print-confirm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Consent Records?</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="font-bold text-red-600 mb-2">This action is HIGHLY DISCOURAGED</p>
              <p>This will permanently delete all {consentRecords.length} consent record(s) from the database. This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteAllMutation.isPending}
              data-testid="button-confirm-delete-all"
            >
              {deleteAllMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Manual Lead Entry Modal Component
const ManualLeadEntryModal = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bookCall, setBookCall] = useState(false);
  
  // Fetch all events to check for conflicts
  const { data: allEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    enabled: open && bookCall,
  });

  // Phone number formatter
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (000) 000-0000
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  // Helper to convert AM/PM time to 24-hour format for comparison
  const timeToHour24 = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours;
  };

  // Check if a time slot is available (considering 2-hour demo call duration)
  const isTimeSlotAvailable = (timeSlot: string, selectedDate: string | undefined): boolean => {
    if (!selectedDate || !allEvents) return true;
    
    const slotHour = timeToHour24(timeSlot);
    const slotEnd = slotHour + 2; // 2-hour duration
    
    // Check all events on the selected date
    const dayEvents = allEvents.filter(event => event.date === selectedDate);
    
    for (const event of dayEvents) {
      if (!event.startTime || !event.endTime) continue;
      
      const eventStart = parseInt(event.startTime.split(':')[0]);
      const eventEnd = parseInt(event.endTime.split(':')[0]);
      
      // Check for overlap: new slot overlaps if it starts before event ends AND ends after event starts
      if (slotHour < eventEnd && slotEnd > eventStart) {
        return false;
      }
    }
    
    return true;
  };

  const form = useForm<z.infer<typeof createManualLeadSchema>>({
    resolver: zodResolver(createManualLeadSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      bookCall: false,
      callDate: undefined,
      callTime: undefined,
    },
  });

  const manualLeadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createManualLeadSchema>) => {
      const response = await fetch('/api/leads/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create manual lead');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success",
        description: "Manual lead has been created successfully",
      });
      form.reset();
      setBookCall(false);
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create manual lead",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof createManualLeadSchema>) => {
    manualLeadMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Manual Lead</DialogTitle>
          <DialogDescription>
            Enter the lead's contact information. Optionally book a call for them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} data-testid="input-manual-lead-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} data-testid="input-manual-lead-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(555) 123-4567" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      data-testid="input-manual-lead-phone" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bookCall"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        setBookCall(e.target.checked);
                        if (!e.target.checked) {
                          form.setValue("callDate", undefined);
                          form.setValue("callTime", undefined);
                        }
                      }}
                      className="h-4 w-4"
                      data-testid="checkbox-book-call"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">Book a call for this lead</FormLabel>
                </FormItem>
              )}
            />

            {bookCall && (
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                <FormField
                  control={form.control}
                  name="callDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-call-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="callTime"
                  render={({ field }) => {
                    const selectedDate = form.watch("callDate");
                    const timeSlots = [
                      "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
                      "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
                    ];
                    
                    return (
                      <FormItem>
                        <FormLabel>Call Time * (2-hour demo call)</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-call-time">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((timeSlot) => {
                                const isAvailable = isTimeSlotAvailable(timeSlot, selectedDate);
                                return (
                                  <SelectItem 
                                    key={timeSlot}
                                    value={timeSlot} 
                                    disabled={!isAvailable}
                                  >
                                    {timeSlot} {!isAvailable ? "(Booked)" : ""}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setBookCall(false);
                  onOpenChange(false);
                }}
                data-testid="button-cancel-manual-lead"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={manualLeadMutation.isPending}
                data-testid="button-submit-manual-lead"
              >
                {manualLeadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lead'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function Dashboard() {
  // LeadsByNova unified pipeline status options
  const statusOptions = [
    "New",
    "Contacted",
    "Zoom Booked",
    "Demo Prep",
    "2nd Zoom Scheduled",
    "Under Contract",
    "Testing",
    "Finalized and Delivered",
    "Nurture",
    "Lost"
  ];
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [modalTabValue, setModalTabValue] = useState<"info" | "chat" | "notes">("info");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);
  const [currentNote, setCurrentNote] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "archived" | "trash">("active");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [leadToArchive, setLeadToArchive] = useState<Lead | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showViewNoteModal, setShowViewNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [addLeadSection, setAddLeadSection] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [leadsSearchTerm, setLeadsSearchTerm] = useState("");
  
  // Daily calendar popup state
  const [showDayPopup, setShowDayPopup] = useState(false);
  const [selectedDayPopup, setSelectedDayPopup] = useState<Date | null>(null);
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
  const [showComprehensiveLeadModal, setShowComprehensiveLeadModal] = useState(false);
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  
  // Mobile-specific state
  const [showMobileFolderDialog, setShowMobileFolderDialog] = useState(false);
  
  

  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // Helper function to generate initials from agent name
  const getAgentInitials = (agentName: string): string => {
    if (!agentName || agentName.trim() === '') return '';
    
    // Split by spaces and take first letter of each word
    const words = agentName.trim().split(/\s+/);
    if (words.length === 1) {
      // Single word: take first letter and first letter of second part if it contains numbers
      const word = words[0];
      const match = word.match(/^([A-Za-z]+)(\d*)/);
      if (match) {
        const [, letters, numbers] = match;
        return letters.charAt(0).toUpperCase() + (numbers ? numbers.charAt(0) : letters.charAt(1) || '').toUpperCase();
      }
      return word.charAt(0).toUpperCase() + (word.charAt(1) || '').toUpperCase();
    }
    
    // Multiple words: take first letter of first two words
    return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  };
  const [, setLocation] = useLocation();
  
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

  const addNoteForm = useForm<z.infer<typeof insertNoteSchema>>({
    resolver: zodResolver(insertNoteSchema),
    defaultValues: {
      headline: "",
      content: "",
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

  const { data: allNotes, isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });

  const notes = allNotes || [];

  // Load agent data dynamically
  // Only load agents for admin roles (superadmin, owner, admin)
  const canAccessAgents = user?.role && ['superadmin', 'owner', 'admin'].includes(user.role);
  const { data: allAgents = [], isLoading: agentsLoading, isError: agentsError } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    enabled: canAccessAgents, // Only run query if user has permission
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
      // Dynamic agent filtering - check if tab matches any agent ID
      default:
        // First check if it's an agent tab
        const agent = allAgents.find(a => a.id === tab);
        if (agent) {
          return allLeads.filter(lead => 
            lead.archived === "false" && 
            lead.deletedAt === null && 
            lead.assignedTo === agent.name
          );
        }
        // Otherwise return all active leads
        return allLeads.filter(lead => lead.archived === "false" && lead.deletedAt === null);
    }
  };

  // Calculate stats
  const activeLeads = allLeads?.filter(lead => lead.archived === "false" && lead.deletedAt === null) || [];
  const unassignedLeads = activeLeads.filter(lead => !lead.assignedTo);
  const archivedLeads = allLeads?.filter(lead => lead.archived === "true" && lead.deletedAt === null) || [];
  const trashedLeads = allLeads?.filter(lead => lead.deletedAt !== null) || [];
  
  // Dynamic agent lead calculations
  const getAgentLeads = (agentName: string) => {
    return activeLeads.filter(lead => lead.assignedTo === agentName);
  };

  // Mutations
  const saveNotesMutation = useMutation({
    mutationFn: async ({ leadId, noteContent }: { leadId: string; noteContent: string }) => {
      return apiRequest('PUT', `/api/leads/${leadId}/notes`, { notes: noteContent });
    },
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lead status", variant: "destructive" });
    },
  });

  const updateSalesFunnelMutation = useMutation({
    mutationFn: async ({ leadId, salesFunnelStatus }: { leadId: string; salesFunnelStatus: string }) => {
      return apiRequest('PUT', `/api/leads/${leadId}`, { salesFunnelStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update sales funnel status", variant: "destructive" });
    },
  });


  const deleteLeadMutation = useMutation({
    mutationFn: async ({ leadId }: { leadId: string }) => {
      return apiRequest('PUT', `/api/leads/${leadId}/delete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowDeleteModal(false);
      setLeadToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to permanently delete lead", variant: "destructive" });
    },
  });

  const deleteAllTrashedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/leads/trash/all`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowDeleteAllModal(false);
      toast({ 
        title: "Success", 
        description: `${data.count} trashed leads deleted permanently` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete all trashed leads", variant: "destructive" });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: AddLeadFormData & { section: string }) => {
      let assignedTo = null;
      // Dynamic agent assignment - find agent by ID or name
      const agent = allAgents.find(a => a.id === leadData.section || a.name === leadData.section);
      if (agent) {
        assignedTo = agent.name;
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
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowEditEventModal(false);
      setEventToEdit(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update event", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventToEdit) throw new Error('No event selected for deletion');
      return apiRequest('DELETE', `/api/events/${eventToEdit.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowEditEventModal(false);
      setEventToEdit(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: z.infer<typeof insertNoteSchema>) => {
      return apiRequest('POST', '/api/notes', noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setShowAddNoteModal(false);
      addNoteForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest('DELETE', `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    },
  });

  const onAddNoteSubmit = (data: z.infer<typeof insertNoteSchema>) => {
    createNoteMutation.mutate(data);
  };

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
    
    // Filter leads that match this specific time slot
    const matchingLeads = allDayLeads.filter(lead => {
      const leadTime = lead.daySelected?.toLowerCase() || '';
      
      // Check for specific time match (e.g., "1:00 PM", "2:00 PM")
      // Format: "Tuesday, Oct 7th at 1:00 PM Eastern Time"
      const timeMatch = leadTime.match(/at\s+(\d{1,2}):00\s+(am|pm)/i);
      if (timeMatch) {
        const leadHour = parseInt(timeMatch[1]);
        const leadPeriod = timeMatch[2].toLowerCase();
        const leadHour24 = leadPeriod === 'pm' && leadHour !== 12 ? leadHour + 12 : 
                          (leadPeriod === 'am' && leadHour === 12 ? 0 : leadHour);
        
        if (leadHour24 === hour24) {
          return true;
        }
      }
      
      // Also check for time range keywords (Morning, Mid-Day, Afternoon)
      if (leadTime.includes('morning') && hour24 >= 9 && hour24 < 12) return true;
      if (leadTime.includes('mid-day') && hour24 >= 12 && hour24 < 15) return true;
      if (leadTime.includes('afternoon') && hour24 >= 15 && hour24 < 18) return true;
      
      return false;
    });
    
    return matchingLeads;
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
      // They have an agent but confirmed no exclusive agreement
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-md">
          Has not signed an agreement
        </span>
      );
    } else if (haveAgent.includes("don't know") || haveAgent.includes("unknown")) {
      // They're unsure about exclusive agreement status
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-yellow-500 rounded-md">
          Doesn't know if they have signed an agreement. Follow up.
        </span>
      );
    } else if (haveAgent === "Yes" || haveAgent.includes("Exclusive")) {
      // Plain "Yes" or mentions exclusive agreement - assume they have one
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md">
          Currently has signed agreement! Do NOT contact!
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
      <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 text-white h-full min-h-[650px] hover:bg-gradient-to-br hover:from-slate-800 hover:via-blue-800 hover:to-slate-800 transition-colors">
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
              <a 
                href={`mailto:${lead.email}`}
                style={{ 
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
                data-testid={`link-lead-email-${lead.id}`}
              >
                {lead.email}
              </a>
            </div>
            <div>
              <span className="font-semibold">Phone: </span>
              <a 
                href={`tel:${lead.phone}`}
                className="md:pointer-events-none"
                style={{ 
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
                data-testid={`link-lead-phone-${lead.id}`}
              >
                <span className="md:text-white md:no-underline">{formatPhoneNumber(lead.phone)}</span>
              </a>
            </div>
            <div>
              <span className="font-semibold">Account Type: </span>
              <span data-testid={`text-lead-guide-${lead.id}`}>
                {lead.guideType}
              </span>
            </div>
            <div>
              <span className="font-semibold">Call Type: </span>
              <span data-testid={`text-call-type-${lead.id}`}>
                Zoom
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current Status: </span>
                <Select 
                  value={lead.salesFunnelStatus || "New"} 
                  onValueChange={(value) => {
                    updateSalesFunnelMutation.mutate({ 
                      leadId: lead.id!, 
                      salesFunnelStatus: value 
                    });
                  }}
                >
                  <SelectTrigger className="inline-flex w-auto bg-white/10 border-blue-400/30 text-white h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-blue-400/30">
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-white hover:bg-blue-800 focus:bg-blue-800">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Notes Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalTabValue("notes");
                  setSelectedLead(lead);
                  setShowLeadModal(true);
                }}
                className="border-blue-400/30 bg-blue-600/20 text-white hover:bg-blue-600/40 h-8 px-3"
                data-testid={`button-view-notes-${lead.id}`}
              >
                <FileText className="h-4 w-4 mr-1" />
                Notes
              </Button>
            </div>
          </div>

          {/* White Separator Line */}
          <div className="h-px bg-white/30 my-6"></div>

          {/* Chat Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Chat Information</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">User Type: </span>
                <span data-testid={`text-chat-user-type-${lead.id}`}>{lead.userType || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Main Goal: </span>
                <span data-testid={`text-chat-main-goal-${lead.id}`}>{lead.mainGoal || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Current Lead Management: </span>
                <span data-testid={`text-chat-lead-management-${lead.id}`}>{lead.leadManagement || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Timeline: </span>
                <span data-testid={`text-chat-timeline-${lead.id}`}>{lead.timeline || 'Not specified'}</span>
              </div>
              
              <div>
                <span className="font-semibold">Communication Preference: </span>
                <span data-testid={`text-chat-communication-preference-${lead.id}`}>{lead.communicationPreference || 'Not specified'}</span>
              </div>

              {agentStatus && (
                <div className="mt-2">
                  <Badge className={`${agentStatus.color} text-white text-xs`} data-testid={`badge-agent-status-${lead.id}`}>
                    {agentStatus.text}
                  </Badge>
                </div>
              )}

              {lead.bookedCall && (() => {
                // Find associated calendar event
                const leadEvent = allEvents?.find(event => 
                  event.title.includes(lead.fullName) && event.title.includes("Demo Call")
                );
                
                if (leadEvent) {
                  // Parse date string to avoid timezone issues (YYYY-MM-DD format)
                  const [year, month, day] = leadEvent.date.split('-').map(Number);
                  const eventDate = new Date(year, month - 1, day);
                  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
                  const formattedTime = `${formatTimeToAMPM(leadEvent.startTime)} - ${formatTimeToAMPM(leadEvent.endTime)} ET`;
                  
                  return (
                    <div className="mt-4">
                      <span className="font-semibold">Call Details: </span>
                      <div className="mt-1 text-sm text-white/90">
                        <div>📅 {formattedDate}</div>
                        <div>🕐 {formattedTime}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
          
          {/* Click for detailed information button */}
          <div className="mt-3 pt-3 border-t border-blue-400/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setModalTabValue("info");
                setSelectedLead(lead);
                setShowLeadModal(true);
              }}
              className="w-full text-white/60 hover:text-white hover:bg-white/10"
            >
              Click Here for Detailed Information
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LeadCard = ({ lead, showActions = true }: { lead: Lead; showActions?: boolean }) => (
    <Card className="bg-white/10 border-blue-400/30 hover:bg-white/15 transition-colors cursor-pointer h-full min-h-[650px]"
          onClick={() => {
            setSelectedLead(lead);
            setShowLeadModal(true);
          }}
          data-testid={`card-lead-${lead.id}`}>
      <CardContent className="p-4 h-full flex flex-col">
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
              <span data-testid={`text-lead-guide-${lead.id}`}>
                {lead.guideType === "Demo Booking" 
                  ? "Demo Booking (Zoom)"
                  : lead.guideType}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <User className="h-4 w-4" />
            <span className="text-white/70 text-sm mr-2">Status:</span>
            <Select 
              value={lead.salesFunnelStatus || "New"} 
              onValueChange={(value) => {
                updateSalesFunnelMutation.mutate({ 
                  leadId: lead.id!, 
                  salesFunnelStatus: value 
                });
              }}
            >
              <SelectTrigger className="w-auto bg-white/10 border-blue-400/30 text-white h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-blue-400/30">
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option} className="text-white hover:bg-blue-800 focus:bg-blue-800 text-xs">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          <div className="flex gap-2 mt-auto pt-4" onClick={(e) => e.stopPropagation()}>
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

  // Agent options for dropdown - dynamically generated from database
  const agentOptions = allAgents.map(agent => ({
    id: agent.id,
    label: agent.name,
    count: getAgentLeads(agent.name).length
  }));

  // Sidebar Navigation Items
  const allNavItems = [
    { id: "overview", label: "Daily Planner", icon: Clock },
    { id: "pipeline", label: "Pipeline View", icon: BarChart3 },
    { id: "agents", label: "Agents", icon: Users, isDropdown: true, adminOnly: true },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "new", label: "New Leads", icon: UserPlus, count: unassignedLeads.length, adminOnly: true },
    { id: "unassigned", label: "Unassigned Leads", icon: FolderOpen, count: unassignedLeads.length, adminOnly: true },
    { id: "active", label: "Active Leads", icon: Eye, count: activeLeads.length },
    { id: "archived", label: "Archived", icon: Archive, count: archivedLeads.length },
    { id: "trash", label: "Trash", icon: Trash2, count: trashedLeads.length },
    { id: "consent-records", label: "Consent Records", icon: Shield, ownerSuperadminOnly: true },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter((item: any) => {
    if (item.adminOnly && user?.role === "agent") {
      return false; // Hide admin-only items from agents
    }
    if (item.ownerSuperadminOnly && user?.role !== "superadmin" && user?.role !== "owner") {
      return false; // Hide owner/superadmin-only items from agents
    }
    return true;
  });

  // Mobile navigation items (different order and filtering)
  const allMobileNavItems = [
    { id: "overview", label: "Daily Planner", icon: Clock },
    { id: "pipeline", label: "Pipeline", icon: BarChart3 },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "agents", label: "Agents", icon: Users, isDropdown: true, adminOnly: true },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "new", label: "New Leads", icon: UserPlus, count: unassignedLeads.length, adminOnly: true },
    { id: "unassigned", label: "Unassigned Leads", icon: FolderOpen, count: unassignedLeads.length, adminOnly: true },
    { id: "active", label: "Active Leads", icon: Eye, count: activeLeads.length },
  ];

  // Filter mobile navigation items based on user role
  const mobileNavItems = allMobileNavItems.filter((item: any) => {
    if (item.adminOnly && user?.role === "agent") {
      return false; // Hide admin-only items from agents
    }
    if (item.ownerSuperadminOnly && user?.role !== "superadmin" && user?.role !== "owner") {
      return false; // Hide owner/superadmin-only items from agents
    }
    return true;
  });

  // Mobile-optimized Pipeline View
  const MobilePipelineView = () => {
    const [selectedPipeline, setSelectedPipeline] = useState<'leads'>('leads');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<{
      found: boolean;
      pipeline?: 'leads';
      stage?: string;
      leadId?: string;
    }>({ found: false });
    const [showStageModal, setShowStageModal] = useState(false);
    const [selectedStageData, setSelectedStageData] = useState<{stage: string, leads: Lead[]}>({stage: '', leads: []});
    
    // Fetch pipeline data
    const { data: pipelineData, isLoading: pipelineLoading } = useQuery<PipelineResponse>({
      queryKey: ['/api/leads/pipeline'],
    });

    // Handler for updating lead status
    const updateLeadStatus = useMutation({
      mutationFn: async ({ leadId, newStatus }: { leadId: string; newStatus: string }) => {
        return apiRequest('PUT', `/api/leads/${leadId}`, { salesFunnelStatus: newStatus });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
        toast({ title: "Success", description: "Lead status updated" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update lead status", variant: "destructive" });
      },
    });

    const handleStatusChange = (leadId: string, newStatus: string) => {
      updateLeadStatus.mutate({ leadId, newStatus });
    };

    // Search functionality - now opens stage modal when found
    const handleSearch = (term: string) => {
      setSearchTerm(term);
      
      if (!term.trim() || !pipelineData) {
        setSearchResults({ found: false });
        setHighlightedLeadId(null);
        return;
      }

      const searchLower = term.toLowerCase().trim();
      
      // Search across leads pipeline
      const pipeline = pipelineData.leads;
      
      for (const stage of pipeline.stageOrder) {
        const stageLeads = pipeline.stages[stage] || [];
        
        for (const lead of stageLeads) {
          if (lead.fullName.toLowerCase().includes(searchLower)) {
            setHighlightedLeadId(lead.id);
            setSearchResults({
              found: true,
              pipeline: 'leads',
              stage,
              leadId: lead.id
            });
            
            // Open stage modal with found lead
            setSelectedStageData({ stage, leads: stageLeads });
            setShowStageModal(true);
            
            setTimeout(() => {
              setHighlightedLeadId(null);
            }, 3000);
            
            return;
          }
        }
      }
      
      setSearchResults({ found: false });
      setHighlightedLeadId(null);
    };

    // Handle stage card click
    const handleStageClick = (stage: string, leads: Lead[]) => {
      setSelectedStageData({ stage, leads });
      setShowStageModal(true);
    };

    // Mobile lead card renderer
    const renderMobileLeadCard = (lead: Lead) => (
      <div
        key={lead.id}
        className={`
          bg-white/10 border border-blue-400/30 rounded-lg p-4 cursor-pointer 
          hover:bg-white/20 transition-all duration-200 
          ${highlightedLeadId === lead.id ? 'ring-2 ring-yellow-400 bg-yellow-400/20' : ''}
        `}
        onClick={() => {
          setSelectedLead(lead);
          setShowStageModal(false); // Close the stage modal first
          setShowComprehensiveLeadModal(true); // Open the comprehensive lead modal
        }}
        data-testid={`mobile-pipeline-lead-${lead.id}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-lg truncate">{lead.fullName}</h3>
            <a 
              href={`mailto:${lead.email}`} 
              className="text-white/70 hover:text-white text-sm block md:pointer-events-none md:cursor-default"
              data-testid={`link-email-${lead.id}`}
            >
              {lead.email}
            </a>
            <a 
              href={`tel:${lead.phone}`} 
              className="text-white/70 hover:text-white text-sm block md:pointer-events-none md:cursor-default"
              data-testid={`link-phone-${lead.id}`}
            >
              {lead.phone}
            </a>
          </div>
          {lead.assignedTo && (
            <div className="ml-2 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {getAgentInitials(lead.assignedTo)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-blue-600/80 text-white text-xs">
            {lead.guideType === "Demo Booking" 
              ? "Demo Booking (Zoom)"
              : lead.guideType || 'Unknown'}
          </Badge>
          <Badge className="bg-green-600/80 text-white text-xs">
            {lead.salesFunnelStatus}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50">
          {!lead.assignedTo && <span>Unassigned</span>}
          <span className="ml-auto">{format(new Date(lead.createdAt), 'MMM d')}</span>
        </div>
      </div>
    );

    if (pipelineLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/70">Loading pipeline...</div>
        </div>
      );
    }

    if (!pipelineData) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white/70 text-center">
            Failed to load pipeline data. Please refresh the page.
          </div>
        </div>
      );
    }

    const currentPipeline = pipelineData.leads;

    return (
      <>
        <div className="h-full flex flex-col pt-3">
          {/* Mobile Header */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Pipeline
            </h2>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 focus:border-blue-400"
                data-testid="mobile-pipeline-search"
              />
            </div>
            
            {searchTerm && !searchResults.found && (
              <div className="text-red-300 text-sm">No leads found matching "{searchTerm}"</div>
            )}
            {searchResults.found && (
              <div className="text-green-300 text-sm">
                Found "{searchTerm}" in {searchResults.pipeline} pipeline → {searchResults.stage}
              </div>
            )}
            
            {/* Pipeline Type Toggle */}
            <div className="flex justify-center">
              <Button
                onClick={() => setSelectedPipeline('leads')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                data-testid="mobile-pipeline-leads"
              >
                Leads ({pipelineData.leads.totalLeads})
              </Button>
            </div>
          </div>

          {/* Stage Cards Grid - 2 columns */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {currentPipeline.stageOrder.map((stage: string) => {
                const stageLeads = currentPipeline.stages[stage] || [];
                return (
                  <div
                    key={stage}
                    onClick={() => handleStageClick(stage, stageLeads)}
                    className="bg-white/10 border border-blue-400/30 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-all duration-200 min-h-[100px] flex flex-col justify-between"
                    data-testid={`mobile-stage-card-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div>
                      <h3 className="text-white font-medium text-sm leading-tight mb-2">
                        {stage}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-600/80 text-white text-xs">
                        {stageLeads.length} leads
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-white/50" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage Modal */}
        <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
          <DialogContent className="max-w-md max-h-[90vh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 p-0">
            <DialogHeader className="p-4 border-b border-blue-400/30">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-white text-lg">
                  {selectedStageData.stage} ({selectedStageData.leads.length} leads)
                </DialogTitle>
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStageModal(false)}
                  className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
                  data-testid="button-close-stage-modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {selectedStageData.leads.length > 0 ? (
                <ScrollArea className="h-[60vh] p-4">
                  <div className="space-y-3">
                    {selectedStageData.leads.map((lead) => renderMobileLeadCard(lead))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-white/50 text-lg mb-2">No leads in {selectedStageData.stage}</div>
                  <div className="text-white/30 text-sm">
                    Leads will appear here when they reach this stage
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  // Render workspace content based on active tab
  const renderWorkspaceContent = () => {
    const leads = getLeadsForTab(activeTab);

    switch (activeTab) {
      case "overview":
        return (
          <div className="h-full flex flex-col md:pl-6">
            {/* Container for Daily Schedule and Notes side by side */}
            <div className="h-full flex flex-col md:flex-row gap-4">
              {/* Daily Schedule Container */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 overflow-hidden w-full md:w-2/5 h-[calc(100vh-200px)] md:h-[768px] shadow-lg flex flex-col">
              <div className="bg-gradient-to-r from-slate-800/80 via-blue-800/60 to-slate-800/80 p-4 border-b border-blue-400/30">
                <div className="space-y-3">
                  {/* Top row: Centered title */}
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Daily Schedule
                      </h3>
                      <HelpTooltip content="View and manage your daily appointments and tasks. Click the + button to add new events, use arrow buttons to navigate between days, and click on any event to view or edit details." />
                    </div>
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
              
              <div className="overflow-y-auto" style={{ height: 'calc(10 * 64px)' }}>
                <div className="space-y-0 relative">
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    
                    let timeSlots = [];
                    let currentTimeSlotIndex = -1;
                    
                    // Always show fixed business hours 5am - 11pm (19 hours)
                    const fixedHours = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]; // 5am to 11pm in 24h format (23 = 11PM)
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
              
              {/* Notes Container */}
              <div className="hidden md:flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 overflow-hidden w-full md:w-2/5 h-96 md:h-[768px] shadow-lg flex-col">
                <div className="bg-gradient-to-r from-slate-800/80 via-blue-800/60 to-slate-800/80 p-4 border-b border-blue-400/30">
                  <div className="space-y-3">
                    {/* Top row: Centered title */}
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Notes
                        </h3>
                        <HelpTooltip content="Create and organize notes for your daily tasks. Add quick notes, reminders, and important information. Click 'Add Note' to create a new note with a headline and detailed content." />
                      </div>
                    </div>
                    
                    {/* Bottom row: Add Note button */}
                    <div className="flex items-center justify-center">
                      <Button
                        onClick={() => setShowAddNoteModal(true)}
                        variant="outline"
                        size="sm"
                        className="border-blue-400/30 bg-gradient-to-r from-blue-700/60 to-blue-600/50 text-white hover:from-blue-700/80 hover:to-blue-600/70"
                        data-testid="button-add-note"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Notes Content */}
                <div className="overflow-y-auto" style={{ height: 'calc(10 * 64px)' }}>
                  <div className="space-y-2 p-4">
                    {notesLoading ? (
                      <div className="text-white/70 text-center py-8">Loading notes...</div>
                    ) : notes.length === 0 ? (
                      <div className="text-white/70 text-center py-8">No notes yet. Click "Add Note" to create your first note.</div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => {
                            setSelectedNote(note);
                            setShowViewNoteModal(true);
                          }}
                          className="bg-slate-800/50 hover:bg-slate-700/50 border border-blue-400/30 rounded p-3 cursor-pointer transition-colors"
                          data-testid={`note-item-${note.id}`}
                        >
                          <div className="text-white font-medium truncate" data-testid={`note-headline-${note.id}`}>
                            {note.headline}
                          </div>
                          <div className="text-white/70 text-xs mt-1">
                            {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Dynamic Agent Cards */}
              {agentsLoading ? (
                // Loading state for agents
                Array.from({ length: 2 }).map((_, index) => (
                  <Card key={`loading-${index}`} className="h-full bg-white/10 border-blue-400/30">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 animate-pulse" />
                        <div>
                          <div className="h-5 w-32 bg-white/20 rounded animate-pulse mb-2" />
                          <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-white/10 rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))
              ) : allAgents.length === 0 ? (
                // Empty state
                <Card className="h-full bg-white/10 border-blue-400/30 col-span-full">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-white/50 mx-auto mb-4" />
                      <p className="text-white/70 text-lg">No agents found</p>
                      <p className="text-white/50 text-sm mt-2">Agents will appear here once they're added to the system</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                allAgents.map(agent => {
                  const agentLeads = getAgentLeads(agent.name);
                  return (
                    <Card key={agent.id} className="h-full bg-white/10 border-blue-400/30">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <img 
                            src={agent.headshotUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23e5e7eb"/><text x="24" y="28" font-family="Arial" font-size="10" text-anchor="middle" fill="%23374151">Agent</text></svg>'} 
                            alt={agent.name} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <CardTitle className="text-white">{agent.name}</CardTitle>
                            <p className="text-white/70 text-sm">{agentLeads.length} active leads</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4 items-stretch">
                          {agentLeads.slice(0, 1).map(lead => (
                            <DetailedLeadCard key={lead.id} lead={lead} />
                          ))}
                          {agentLeads.length === 0 && (
                            <p className="text-white/70 text-center py-4">No assigned leads</p>
                          )}
                          {agentLeads.length > 1 && (
                            <Button 
                              className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white"
                              onClick={() => setActiveTab(agent.id)}
                            >
                              View All {agentLeads.length} Leads
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
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
          <div className="w-full max-w-[430px] mx-auto px-3 md:max-w-none md:px-4">
            <div className="h-full flex flex-col md:min-h-[100dvh] w-full">
              {/* Calendar Header */}
              <div className="space-y-4 mb-6 w-full">
              {/* Mobile: Stack title and controls vertically */}
              <div className="md:hidden pt-3">
                <div className="flex items-center mb-3">
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {monthName}
                  </h2>
                  <HelpTooltip content="The Calendar view helps you manage your scheduled calls and events across different dates. Navigate between months using the left and right arrow buttons, or click 'Today' to return to the current month. Click 'Add' to create new appointments or events for any date. Each day cell shows your scheduled calls (blue boxes) with client names and assigned agent initials in blue circles. Click on any day to see more details or add events for that specific date. Calls display the client's name and assigned agent, helping you track your team's daily schedule and appointments." />
                </div>
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
                <div className="flex items-center">
                  <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {monthName}
                  </h2>
                  <HelpTooltip content="The Calendar view helps you manage your scheduled calls and events across different dates. Navigate between months using the left and right arrow buttons, or click 'Today' to return to the current month. Click 'Add Event' to create new appointments or events for any date. Each day cell shows your scheduled calls (blue boxes) with client names and assigned agent initials in blue circles. Click on any day to see more details or add events for that specific date. Calls display the client's name and assigned agent, helping you track your team's daily schedule and appointments." />
                </div>
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
              <div className="flex-1 w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 overflow-hidden shadow-lg max-h-[calc(100vh-120px)] md:min-h-[calc(100vh-200px)]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gradient-to-r from-slate-800/80 via-blue-800/60 to-slate-800/80 border-b border-blue-400/30">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 md:p-4 text-center text-blue-200/90 font-medium border-r border-blue-400/30 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Weeks */}
              <div className="grid grid-rows-6 flex-1">
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
                            relative p-1 md:p-3 border-r border-blue-400/30 last:border-r-0 cursor-pointer min-h-[60px] md:min-h-[120px]
                            bg-slate-800/40 hover:bg-slate-700/60 transition-colors flex-1
                            ${isSelected ? 'bg-blue-600/40 hover:bg-blue-600/50' : ''}
                            ${isToday ? 'bg-blue-500/30 hover:bg-blue-500/40' : ''}
                          `}
                          onClick={() => {
                            setSelectedDayPopup(date);
                            setShowDayPopup(true);
                          }}
                        >
                          <div className={`
                            text-base md:text-sm font-semibold md:font-medium mb-1 md:mb-2
                            ${isCurrentMonth ? 'text-white' : 'text-blue-200/40'}
                            ${isToday ? 'text-blue-300 font-bold' : ''}
                          `}>
                            {date.getDate()}
                          </div>
                          
                          {/* Calendar Events */}
                          {isCurrentMonth && (() => {
                            const eventsForDate = getEventsForDate(date);
                            
                            if (eventsForDate.length === 0) return null;
                            
                            // Show up to 3 events
                            const maxItems = 3;
                            const eventsToShow = Math.min(maxItems, eventsForDate.length);
                            const moreCount = eventsForDate.length - eventsToShow;
                            
                            return (
                              <div className="absolute top-6 md:top-8 left-1 md:left-2 right-1 md:right-2 space-y-0.5 md:space-y-1">
                                {/* Display events */}
                                {eventsForDate.slice(0, eventsToShow).map((event) => (
                                  <div key={event.id} className="bg-blue-600/90 text-white text-[10px] md:text-xs px-1 py-0.5 rounded truncate">
                                    <span className="md:hidden">{event.title}</span>
                                    <span className="hidden md:inline">{formatTimeToAMPM(event.startTime)}: {event.title}</span>
                                  </div>
                                ))}
                                
                                {/* Show "more" indicator if needed */}
                                {moreCount > 0 && (
                                  <div className="text-white/70 text-[10px] md:text-xs px-1">
                                    +{moreCount}
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
          </div>
        );

      case "notes":
        return (
          <div className="w-full max-w-[430px] mx-auto px-3 md:max-w-none md:px-4">
            <div className="h-[100vh] flex flex-col md:min-h-[100dvh] w-full">
              {/* Notes Header */}
              <div className="space-y-4 mb-6 w-full">
                <div className="md:hidden pt-3">
                  <div className="flex items-center mb-3">
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Notes
                    </h2>
                    <HelpTooltip content="Create and organize notes for your real estate business. Add quick notes, reminders, and important information. Click 'Add Note' to create a new note with a headline and detailed content." />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      onClick={() => setShowAddNoteModal(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-400/30 bg-blue-600 text-white hover:bg-blue-700"
                      data-testid="button-mobile-add-note"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes Content */}
              <div className="flex-1 w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 overflow-hidden shadow-lg h-[calc(100vh-200px)] md:min-h-[calc(100vh-200px)]">
                <div className="p-4 h-full">
                  {notesLoading ? (
                    <div className="text-white/70 text-center py-8">Loading notes...</div>
                  ) : notes && notes.length > 0 ? (
                    <ScrollArea className="h-full">
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => {
                              setSelectedNote(note);
                              setShowViewNoteModal(true);
                            }}
                            className="bg-white/10 border border-blue-400/30 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
                            data-testid={`note-card-${note.id}`}
                          >
                            <h3 className="text-white font-medium mb-2">{note.headline}</h3>
                            <p className="text-white/70 text-sm line-clamp-2">{note.content}</p>
                            <div className="mt-2 text-white/50 text-xs">
                              {format(new Date(note.createdAt), 'MMM d, yyyy • h:mm a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-white/70 text-center py-8">
                      No notes yet. Click "Add Note" to create your first note.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "pipeline":
        // Mobile-optimized Pipeline View
        return (
          <div className="w-full max-w-[430px] mx-auto px-3 md:max-w-none md:px-4 h-[100vh] flex flex-col">
            <div className="md:hidden">
              <MobilePipelineView />
            </div>
            <div className="hidden md:block">
              <PipelineView />
            </div>
          </div>
        );

      default:
        // Check if activeTab is an agent ID, if so show agent-specific view
        const agent = allAgents.find(a => a.id === activeTab);
        
        if (agent) {
          // Agent-specific view with full interface
          const agentLeads = getAgentLeads(agent.name);
          const agentImage = agent.headshotUrl || "/images/generic-silhouette.png";
          
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img 
                  src={agentImage} 
                  alt={agent.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {agent.name}
                  </h2>
                  <p className="text-white/70">{agentLeads.length} active leads</p>
                </div>
                <Button
                  className="ml-auto !bg-blue-600 hover:!bg-blue-700 !text-white"
                  onClick={() => {
                    setAddLeadSection(agent.name);
                    setShowAddLeadModal(true);
                  }}
                  data-testid={`button-add-lead-${activeTab}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
                {agentLeads.map((lead: Lead) => (
                  <DetailedLeadCard key={lead.id} lead={lead} />
                ))}
                {agentLeads.length === 0 && (
                  <div className="col-span-2">
                    <p className="text-white/70 text-center py-8">No leads assigned to {agent.name}</p>
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        // Consent Records view (superadmin and owner only)
        if (activeTab === "consent-records") {
          return <ConsentRecordsView />;
        }
        
        // Non-agent category view
        const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        
        // Filter leads by search term for active tab
        const filteredLeads = activeTab === "active" && leadsSearchTerm
          ? leads.filter(lead => {
              const searchLower = leadsSearchTerm.toLowerCase();
              const fullName = lead.fullName?.toLowerCase() || '';
              const email = lead.email?.toLowerCase() || '';
              const phone = lead.phone?.toLowerCase() || '';
              
              return fullName.includes(searchLower) || 
                     email.includes(searchLower) || 
                     phone.includes(searchLower);
            })
          : leads;
        
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {tabName} Leads
                </h2>
                {activeTab === "new" && (
                  <HelpTooltip content="New Leads shows potential clients who have recently submitted forms or requested information but haven't been assigned to an agent yet. These leads require prompt attention and should be reviewed quickly to assess their needs and timeline. Use this section to evaluate new prospects, determine their qualification level, and assign them to the appropriate agent based on their location and requirements. Click on any lead card to view detailed information including their submitted form data, chat responses, and contact preferences." />
                )}
                {activeTab === "unassigned" && (
                  <HelpTooltip content="Unassigned Leads contains prospects who have expressed interest but are not currently assigned to a specific agent. These leads may be new submissions waiting for assignment, or leads that were previously assigned but need reassignment due to agent availability or location changes. Review these leads to ensure proper distribution among your team members based on geographic areas, expertise, and current workload. Assign leads promptly to maintain good response times and client satisfaction." />
                )}
                {activeTab === "active" && (
                  <HelpTooltip content="Active Leads displays all current prospects who are actively engaged in your sales process. This includes leads at various stages - from initial contact through qualified prospects who are actively working with your agents. These leads are not archived or deleted, representing your current pipeline of potential clients. Use this comprehensive view to monitor overall lead activity, track progress across all stages, and ensure no prospects fall through the cracks. Each lead card shows their current status, assigned agent, and key information to help you manage the entire client journey effectively." />
                )}
                {activeTab === "archived" && (
                  <HelpTooltip content="Archived Leads contains prospects that have been moved out of your active pipeline for various reasons. This may include leads that have gone cold, decided not to proceed, purchased through another entity, or are no longer actively pursuing your products or services. These leads are preserved for record-keeping and potential future reactivation. Use this section to review past prospects and occasionally check if any archived leads might be ready to re-engage. You can unarchive leads to move them back to your active pipeline if circumstances change and they become viable prospects again." />
                )}
                {activeTab === "trash" && (
                  <HelpTooltip content="Trash Leads contains prospects that have been permanently deleted from your system. These are leads that you no longer need to track, such as duplicates, test entries, spam submissions, or prospects that are completely irrelevant to your business. Leads in the trash are marked for permanent removal and are not included in any active or archived searches. Use this section to review deleted leads before they are permanently purged from the system. Be cautious when deleting leads as this action may be irreversible depending on your system settings." />
                )}
              </div>
              {activeTab === "new" && (
                <Button
                  onClick={() => setShowAddLeadModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
                  data-testid="button-add-manual-lead"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              )}
              {activeTab === "trash" && trashedLeads.length > 0 && (
                <Button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white mt-2"
                  data-testid="button-delete-all-trash"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              )}
            </div>

            {/* Search Bar for Active Leads */}
            {activeTab === "active" && (
              <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg border border-blue-400/30 p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={leadsSearchTerm}
                    onChange={(e) => setLeadsSearchTerm(e.target.value)}
                    className="flex-1 bg-white/10 border border-blue-400/30 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    data-testid="input-search-active-leads"
                  />
                  {leadsSearchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeadsSearchTerm("")}
                      className="text-white/70 hover:text-white"
                      data-testid="button-clear-search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
              {filteredLeads.map(lead => (
                <DetailedLeadCard key={lead.id} lead={lead} />
              ))}
              {filteredLeads.length === 0 && (
                <div className="col-span-2">
                  <p className="text-white/70 text-center py-8">
                    {leadsSearchTerm && activeTab === "active" 
                      ? `No leads found matching "${leadsSearchTerm}"`
                      : `No ${tabName.toLowerCase()} leads found`
                    }
                  </p>
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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-4 h-4" />;
      case 'owner':
        return <UserCheck className="w-4 h-4" />;
      case 'agent':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-600';
      case 'owner':
        return 'bg-blue-600';
      case 'agent':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };


  const PipelineView = () => {
    const [selectedPipeline, setSelectedPipeline] = useState<'leads'>('leads');
    const [selectedStage, setSelectedStage] = useState<string>('New');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<{
      found: boolean;
      pipeline?: 'leads';
      stage?: string;
      leadId?: string;
    }>({ found: false });
    
    // Fetch pipeline data
    const { data: pipelineData, isLoading: pipelineLoading } = useQuery<PipelineResponse>({
      queryKey: ['/api/leads/pipeline'],
    });

    // Update selected stage when pipeline changes
    useEffect(() => {
      if (pipelineData) {
        const currentPipeline = pipelineData.leads;
        if (currentPipeline.stageOrder.length > 0) {
          setSelectedStage(currentPipeline.stageOrder[0]);
        }
      }
    }, [selectedPipeline, pipelineData]);

    // Handler for updating lead status
    const updateLeadStatus = useMutation({
      mutationFn: async ({ leadId, newStatus }: { leadId: string; newStatus: string }) => {
        return apiRequest('PUT', `/api/leads/${leadId}`, { salesFunnelStatus: newStatus });
      },
      onSuccess: () => {
        // Invalidate both pipeline and regular leads queries
        queryClient.invalidateQueries({ queryKey: ['/api/leads/pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
        toast({ title: "Success", description: "Lead status updated" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update lead status", variant: "destructive" });
      },
    });

    const handleStatusChange = (leadId: string, newStatus: string) => {
      updateLeadStatus.mutate({ leadId, newStatus });
    };

    // Search functionality
    const handleSearch = (term: string) => {
      setSearchTerm(term);
      
      if (!term.trim() || !pipelineData) {
        setSearchResults({ found: false });
        setHighlightedLeadId(null);
        return;
      }

      const searchLower = term.toLowerCase().trim();
      
      // Search across leads pipeline
      const pipeline = pipelineData.leads;
      
      for (const stage of pipeline.stageOrder) {
        const stageLeads = pipeline.stages[stage] || [];
        
        for (const lead of stageLeads) {
          if (lead.fullName.toLowerCase().includes(searchLower)) {
            // Found the lead - navigate to it
            setSelectedStage(stage);
            setHighlightedLeadId(lead.id);
            setSearchResults({
              found: true,
              pipeline: 'leads',
              stage,
              leadId: lead.id
            });
            
            // Clear highlight after 3 seconds
            setTimeout(() => {
              setHighlightedLeadId(null);
            }, 3000);
            
            return;
          }
        }
      }
      
      // No results found
      setSearchResults({ found: false });
      setHighlightedLeadId(null);
    };

    // Render lead card for the body area
    const renderLeadCard = (lead: Lead) => (
      <div
        key={lead.id}
        className={`bg-white/10 border border-blue-400/20 rounded-lg p-4 hover:bg-white/15 transition-colors cursor-pointer group ${
          highlightedLeadId === lead.id ? 'animate-pulse bg-yellow-400/30 border-yellow-400/60' : ''
        }`}
        data-testid={`pipeline-lead-card-${lead.id}`}
        onClick={() => {
          setSelectedLead(lead);
          setShowComprehensiveLeadModal(true);
        }}
      >
        {/* Lead Name & Contact */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-base truncate">{lead.fullName}</h4>
            <a 
              href={`mailto:${lead.email}`} 
              className="text-white/70 hover:text-white text-sm block truncate md:pointer-events-none md:cursor-default"
              data-testid={`link-email-${lead.id}`}
            >
              {lead.email}
            </a>
            <a 
              href={`tel:${lead.phone}`} 
              className="text-white/70 hover:text-white text-sm block truncate md:pointer-events-none md:cursor-default"
              data-testid={`link-phone-${lead.id}`}
            >
              {lead.phone}
            </a>
          </div>
          
          {/* Agent initials */}
          {lead.assignedTo && (
            <div className="flex-shrink-0 ml-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getAgentInitials(lead.assignedTo)}
              </div>
            </div>
          )}
        </div>

        {/* Guide type badge */}
        <div className="flex items-center justify-start mb-3">
          <Badge 
            variant="secondary" 
            className="text-sm bg-blue-600/20 text-blue-200 border-blue-400/30"
          >
            {lead.guideType === "Demo Booking" 
              ? "Demo Booking (Zoom)"
              : lead.guideType}
          </Badge>
        </div>
        
        {/* Timeline info */}
        <div className="text-white/50 text-sm">
          Created: {format(new Date(lead.createdAt), 'MMM d, yyyy')}
        </div>
      </div>
    );

    if (pipelineLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      );
    }

    if (!pipelineData) {
      return (
        <div className="text-white/70 text-center py-8">
          Failed to load pipeline data. Please refresh the page.
        </div>
      );
    }

    const currentPipeline = pipelineData.leads;
    const selectedStageLeads = currentPipeline.stages[selectedStage] || [];
    
    return (
      <div className="h-full flex flex-col">
        {/* Pipeline Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Pipeline View
            </h2>
            <HelpTooltip content="The Pipeline View helps you track and manage leads through different stages of your sales process. Search for specific leads by name using the search bar. The Leads button shows the total count of all leads in your pipeline. Use the stage tabs (New, Contacted, Zoom Booked, Demo Prep, etc.) to view leads in each phase - the numbers next to each tab show how many leads are in that stage. Click on any lead card to view detailed information and update their status. This visual pipeline helps you see where leads are in your sales funnel and take appropriate next steps to move them forward." />
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Search leads by name..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 focus:border-blue-400"
                data-testid="pipeline-search-input"
              />
            </div>
            {searchTerm && !searchResults.found && (
              <div className="mt-2 text-red-300 text-sm">
                No leads found matching "{searchTerm}"
              </div>
            )}
            {searchResults.found && (
              <div className="mt-2 text-green-300 text-sm">
                Found "{searchTerm}" in {searchResults.pipeline} pipeline → {searchResults.stage}
              </div>
            )}
          </div>

          {/* Pipeline Type Button */}
          <div className="flex justify-start mb-6">
            <Button
              onClick={() => setSelectedPipeline('leads')}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium px-8"
            >
              Leads ({pipelineData.leads.totalLeads})
            </Button>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="mb-6">
          <Tabs value={selectedStage} onValueChange={setSelectedStage}>
            <TabsList className="">
              {currentPipeline.stageOrder.map((stage: string) => (
                <TabsTrigger 
                  key={stage}
                  value={stage}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  data-testid={`stage-tab-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {stage} ({(currentPipeline.stages[stage] || []).length})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Body Area with Lead Cards */}
        <div className="flex-1">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">
              {selectedStage} Stage
            </h3>
          </div>

          {/* Lead Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedStageLeads.map((lead: Lead) => renderLeadCard(lead))}
          </div>

          {/* Empty State */}
          {selectedStageLeads.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white/50 text-lg mb-2">No leads in {selectedStage}</div>
              <div className="text-white/30 text-sm">
                Leads will appear here when they reach this stage
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dashboard-isolated">
      {/* User Header */}
      <div className="bg-black/20 border-b border-blue-400/30 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getRoleIcon(user?.role || 'agent')}
              <span className="text-white font-medium">
                {user ? user.email : 'Unknown User'}
              </span>
            </div>
            <Badge className={`${getRoleBadgeColor(user?.role || 'agent')} text-white font-medium`}>
              {user?.role === 'owner' ? 'Admin' : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Agent')}
            </Badge>
            {user?.agentName && (
              <Badge className="bg-gray-600 text-white font-medium">
                {user.agentName}
              </Badge>
            )}
          </div>
          
          {/* Desktop Logout Button */}
          <Button
            onClick={handleLogout}
            size="sm"
            className="hidden md:flex bg-blue-600 text-white hover:bg-blue-700"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          
          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <DropdownMenu open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-blue-400/30">
                <DropdownMenuItem 
                  onClick={() => setLocation('/settings')}
                  className="text-white hover:bg-blue-800 focus:bg-blue-800 cursor-pointer"
                  data-testid="menu-item-settings"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-white hover:bg-blue-800 focus:bg-blue-800 cursor-pointer"
                  data-testid="menu-item-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex h-full min-h-0">
        {/* Desktop Sidebar - Hidden on Mobile - Extended Height */}
        <div className="hidden md:flex w-64 bg-black/20 border-r border-blue-400/30 flex-col min-h-[calc(100vh-80px)]">
          <div className="p-6 border-b border-blue-400/30">
            <h1 className="text-xl font-bold text-white text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dashboard
            </h1>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.isDropdown && allAgents.some(agent => agent.id === activeTab));
                
                
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
                        {agentsLoading ? (
                          // Loading state for dropdown
                          Array.from({ length: 2 }).map((_, index) => (
                            <DropdownMenuItem key={`loading-${index}`} className="text-white cursor-default">
                              <div className="flex items-center justify-between w-full">
                                <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                                <div className="h-4 w-8 bg-white/20 rounded animate-pulse" />
                              </div>
                            </DropdownMenuItem>
                          ))
                        ) : allAgents.length === 0 ? (
                          <DropdownMenuItem className="text-white/70 cursor-default">
                            <span>No agents available</span>
                          </DropdownMenuItem>
                        ) : (
                          agentOptions.map((agent) => (
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
                          ))
                        )}
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
                      ${item.id === 'new' && item.count && item.count > 0 ? 'animate-pulse' : ''}
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

          {/* Bottom Action Buttons Section */}
          <div className="p-4 space-y-3 border-t border-blue-400/30">
            {/* Configuration Info Section - Only show for superadmins and owners */}
            {user && (user.role === "superadmin" || user.role === "owner") && (
              <div>
                <div className="text-white/60 text-sm leading-relaxed text-center">
                  Click Configuration to Add/Delete Sales Agents and/or Change Passwords
                </div>
              </div>
            )}

            {/* Configuration Section - Only show for superadmins and owners */}
            {user && (user.role === "superadmin" || user.role === "owner") && (
              <div>
                <Button
                  onClick={() => setLocation('/config')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                  data-testid="sidebar-configuration"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </Button>
              </div>
            )}

            {/* Settings Section - Only show for agents */}
            {user && user.role === "agent" && (
              <div>
                <Button
                  onClick={() => setLocation('/settings')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                  data-testid="sidebar-settings"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-blue-400/30">
            <div className="flex items-center justify-center gap-2">
              <img 
                src="/attached_assets/LeadsByNova Favicon_White Transparent (Small)_1758779673680.png" 
                alt="LeadsByNova™" 
                className="w-4 h-4"
              />
              <p className="text-white/50 text-xs">
                Powered by LeadsByNova™
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Main Workspace - Hidden on Mobile */}
        <div className="hidden md:flex flex-1 overflow-y-auto">
          <div className={activeTab === "calendar" || activeTab === "overview" ? "p-0 w-full overflow-x-auto" : "p-8"}>
            {renderWorkspaceContent()}
          </div>
        </div>
        
        {/* Mobile Full-Screen View */}
        <div className={`md:hidden flex-1 ${activeTab === 'calendar' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
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
              
              {/* Mobile content area */}
              <div className={`flex-1 ${activeTab === 'calendar' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                <div className={activeTab === 'calendar' ? '' : 'p-4'}>
                  {renderWorkspaceContent()}
                </div>
              </div>
            </div>
          ) : (
            // Mobile folder grid
            <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
              {/* Mobile header */}
              <div className="p-3 border-b border-blue-400/30">
                <h1 className="text-lg font-bold text-white text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Dashboard
                </h1>
              </div>
              
              {/* Mobile folder grid */}
              <div className="p-3 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {mobileNavItems.map((item) => {
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
                        className={`bg-white/10 border border-blue-400/30 rounded-lg p-5 text-white hover:bg-white/20 transition-colors ${item.id === 'new' && item.count && item.count > 0 ? 'animate-pulse' : ''}`}
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
      <Dialog open={showLeadModal} modal={false}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 border-blue-400/30 before:fixed before:inset-0 before:bg-black/70 before:z-[-1]">
          <DialogHeader>
            <div className="flex items-center justify-end">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadModal(false)}
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-lead-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              <Tabs value={modalTabValue} onValueChange={(value) => setModalTabValue(value as "info" | "chat" | "notes")} className="w-full">
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
                            <Label className="text-white/70">Account Type</Label>
                            <p className="text-white font-medium">
                              {selectedLead.guideType}
                            </p>
                          </div>
                          <div>
                            <Label className="text-white/70">Call Type</Label>
                            <p className="text-white font-medium">Zoom</p>
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
                            {selectedLead.userType && (
                              <div>
                                <Label className="text-white/70">User Type</Label>
                                <p className="text-white font-medium">{selectedLead.userType}</p>
                              </div>
                            )}
                            {selectedLead.mainGoal && (
                              <div>
                                <Label className="text-white/70">Main Goal</Label>
                                <p className="text-white font-medium">{selectedLead.mainGoal}</p>
                              </div>
                            )}
                            {selectedLead.leadManagement && (
                              <div>
                                <Label className="text-white/70">Current Lead Management</Label>
                                <p className="text-white font-medium">{selectedLead.leadManagement}</p>
                              </div>
                            )}
                            {selectedLead.timeline && (
                              <div>
                                <Label className="text-white/70">Timeline</Label>
                                <p className="text-white font-medium">{selectedLead.timeline}</p>
                              </div>
                            )}
                            {selectedLead.communicationPreference && (
                              <div>
                                <Label className="text-white/70">Communication Preference</Label>
                                <p className="text-white font-medium">{selectedLead.communicationPreference}</p>
                              </div>
                            )}
                            {selectedLead.bookedCall && (() => {
                              const leadEvent = allEvents?.find(event => 
                                event.title.includes(selectedLead.fullName) && event.title.includes("Demo Call")
                              );
                              
                              if (leadEvent) {
                                const [year, month, day] = leadEvent.date.split('-').map(Number);
                                const eventDate = new Date(year, month - 1, day);
                                const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
                                const formattedTime = `${formatTimeToAMPM(leadEvent.startTime)} - ${formatTimeToAMPM(leadEvent.endTime)} ET`;
                                
                                return (
                                  <div>
                                    <Label className="text-white/70">Call Details</Label>
                                    <p className="text-white font-medium">
                                      📅 {formattedDate}<br />
                                      🕐 {formattedTime}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
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
      <Dialog open={showAssignModal} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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
                  {allAgents.map((agent) => (
                    <SelectItem 
                      key={agent.id} 
                      value={agent.name} 
                      className="text-white hover:bg-blue-800 focus:bg-blue-800 focus:text-white"
                    >
                      {agent.name}
                    </SelectItem>
                  ))}
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
      <Dialog open={showDeleteModal} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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

      {/* Delete All Trashed Leads Confirmation Modal */}
      <Dialog open={showDeleteAllModal} onOpenChange={setShowDeleteAllModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <DialogTitle className="text-white">Delete All Trashed Leads</DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure you want to permanently delete all {trashedLeads.length} trashed leads? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => deleteAllTrashedMutation.mutate()}
              disabled={deleteAllTrashedMutation.isPending}
              className="!bg-red-600 hover:!bg-red-700 !text-white flex-1"
              data-testid="button-confirm-delete-all"
            >
              {deleteAllTrashedMutation.isPending ? "Deleting..." : "Delete All"}
            </Button>
            <Button
              onClick={() => setShowDeleteAllModal(false)}
              className="!bg-green-600 hover:!bg-green-700 !text-white flex-1"
              data-testid="button-cancel-delete-all"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Calendar Popup */}
      <Dialog open={showDayPopup} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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
                        {/* Calendar events only */}
                        {selectedDayPopup && (() => {
                          const dayEvents = getEventsForDate(selectedDayPopup);
                          const timeSlotEvents = getEventsForTimeSlot(selectedDayPopup, timeSlot, dayEvents);
                          
                          return (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
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
      <Dialog open={showLeadDetailModal} modal={false}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 before:fixed before:inset-0 before:bg-black/70 before:z-[-1]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl">
                  Lead Details
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Contact information and status
                </DialogDescription>
              </div>
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadDetailModal(false)}
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-lead-detail-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
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
                          <Label className="text-white/70">Account Type</Label>
                          <p className="text-white">
                            {selectedLead.guideType}
                          </p>
                        </div>
                        <div>
                          <Label className="text-white/70">Call Type</Label>
                          <p className="text-white">Zoom</p>
                        </div>
                        <div>
                          <Label className="text-white/70">Form Submitted</Label>
                          <p className="text-white">{formatDate(selectedLead.formTimestamp)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Call Info */}
                    {selectedLead.bookedCall && (() => {
                      const leadEvent = allEvents?.find(event => 
                        event.title.includes(selectedLead.fullName) && event.title.includes("Demo Call")
                      );
                      
                      if (leadEvent) {
                        const [year, month, day] = leadEvent.date.split('-').map(Number);
                        const eventDate = new Date(year, month - 1, day);
                        const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
                        const formattedTime = `${formatTimeToAMPM(leadEvent.startTime)} - ${formatTimeToAMPM(leadEvent.endTime)} ET`;
                        
                        return (
                          <div className="border-t border-blue-400/20 pt-4">
                            <Label className="text-white/70">Scheduled Call</Label>
                            <div className="mt-2">
                              <div className="text-white">📅 {formattedDate}</div>
                              <div className="text-white">🕐 {formattedTime}</div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

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

      {/* Comprehensive Lead Modal */}
      <Dialog open={showComprehensiveLeadModal} modal={false}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30 before:fixed before:inset-0 before:bg-black/70 before:z-[-1]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-white text-xl">
                  Lead Details
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Comprehensive lead information and actions
                </DialogDescription>
              </div>
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComprehensiveLeadModal(false)}
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
                data-testid="button-close-comprehensive-lead-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 text-white">
              {/* Top Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedLead.assignedTo && (
                  <Badge className="!bg-blue-800 !text-white font-medium" data-testid={`badge-assigned-to-${selectedLead.id}`}>
                    {selectedLead.assignedTo}
                  </Badge>
                )}
                {selectedLead.formTimestamp && (
                  <Badge className="!bg-green-600 !text-white font-medium" data-testid={`badge-form-completed-${selectedLead.id}`}>
                    Form Completed
                  </Badge>
                )}
                {selectedLead.completedChat === "true" && (
                  <Badge className="!bg-blue-700 !text-white font-medium" data-testid={`badge-chat-completed-${selectedLead.id}`}>
                    Chat Completed
                  </Badge>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Name: </span>
                  <span data-testid={`text-lead-name-${selectedLead.id}`}>{selectedLead.fullName}</span>
                </div>
                <div>
                  <span className="font-semibold">Email: </span>
                  <a 
                    href={`mailto:${selectedLead.email}`}
                    style={{ 
                      color: '#60a5fa',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
                    data-testid={`link-lead-email-${selectedLead.id}`}
                  >
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <span className="font-semibold">Phone: </span>
                  <a 
                    href={`tel:${selectedLead.phone}`}
                    style={{ 
                      color: '#60a5fa',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
                    data-testid={`link-lead-phone-${selectedLead.id}`}
                  >
                    {formatPhoneNumber(selectedLead.phone)}
                  </a>
                </div>
                <div>
                  <span className="font-semibold">Account Type: </span>
                  <span data-testid={`text-lead-guide-${selectedLead.id}`}>{selectedLead.guideType}</span>
                </div>
                <div>
                  <span className="font-semibold">Call Type: </span>
                  <span data-testid={`text-call-type-${selectedLead.id}`}>Zoom</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Status: </span>
                  <Select 
                    value={selectedLead.salesFunnelStatus || "New"} 
                    onValueChange={(value) => {
                      updateSalesFunnelMutation.mutate({ 
                        leadId: selectedLead.id!, 
                        salesFunnelStatus: value 
                      });
                    }}
                  >
                    <SelectTrigger className="inline-flex w-auto bg-white/10 border-blue-400/30 text-white h-8 text-sm ml-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-blue-400/30">
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-white hover:bg-blue-800 focus:bg-blue-800 text-sm">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chat Information */}
              {selectedLead.completedChat === "true" && (
                <div className="border-t border-blue-400/30 pt-4">
                  <h3 className="text-lg font-semibold mb-4">Chat Information</h3>
                  
                  <div className="space-y-3 text-sm">
                    {selectedLead.userType && (
                      <div>
                        <span className="font-semibold">User Type: </span>
                        <span>{selectedLead.userType}</span>
                      </div>
                    )}
                    {selectedLead.mainGoal && (
                      <div>
                        <span className="font-semibold">Main Goal: </span>
                        <span>{selectedLead.mainGoal}</span>
                      </div>
                    )}
                    {selectedLead.leadManagement && (
                      <div>
                        <span className="font-semibold">Current Lead Management: </span>
                        <span>{selectedLead.leadManagement}</span>
                      </div>
                    )}
                    {selectedLead.timeline && (
                      <div>
                        <span className="font-semibold">Timeline: </span>
                        <span>{selectedLead.timeline}</span>
                      </div>
                    )}
                    {selectedLead.communicationPreference && (
                      <div>
                        <span className="font-semibold">Communication Preference: </span>
                        <span>{selectedLead.communicationPreference}</span>
                      </div>
                    )}
                    {selectedLead.daySelected && (
                      <div>
                        <span className="font-semibold">Call Time: </span>
                        <span>{selectedLead.daySelected}</span>
                      </div>
                    )}
                    {selectedLead.bookedCall && (() => {
                      const leadEvent = allEvents?.find(event => 
                        event.title.includes(selectedLead.fullName) && event.title.includes("Demo Call")
                      );
                      
                      if (leadEvent) {
                        const [year, month, day] = leadEvent.date.split('-').map(Number);
                        const eventDate = new Date(year, month - 1, day);
                        const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
                        const formattedTime = `${formatTimeToAMPM(leadEvent.startTime)} - ${formatTimeToAMPM(leadEvent.endTime)} ET`;
                        
                        return (
                          <div className="border-t border-blue-400/20 pt-3 mt-3">
                            <span className="font-semibold">Call Details: </span>
                            <div className="mt-1">
                              <div>📅 {formattedDate}</div>
                              <div>🕐 {formattedTime}</div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-blue-400/30">
                {!selectedLead.assignedTo && (
                  <Button 
                    size="sm" 
                    className="!bg-green-600 hover:!bg-green-700 !text-white"
                    onClick={() => {
                      setLeadToAssign(selectedLead);
                      setShowAssignModal(true);
                      setShowComprehensiveLeadModal(false);
                    }}
                    data-testid={`button-assign-${selectedLead.id}`}
                  >
                    Assign
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  className="!bg-yellow-600 hover:!bg-yellow-700 !text-white"
                  onClick={() => {
                    setLeadToArchive(selectedLead);
                    setShowArchiveModal(true);
                    setShowComprehensiveLeadModal(false);
                  }}
                  data-testid={`button-archive-${selectedLead.id}`}
                >
                  {selectedLead.archived === "true" ? "Unarchive" : "Archive"}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => {
                    setLeadToDelete(selectedLead);
                    setShowDeleteModal(true);
                    setShowComprehensiveLeadModal(false);
                  }}
                  data-testid={`button-delete-${selectedLead.id}`}
                >
                  {selectedLead.deletedAt !== null ? "Delete" : "Move to Trash"}
                </Button>
              </div>

              {/* Click hint for accessing tabbed modal */}
              <div className="text-center pt-2 border-t border-blue-400/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowComprehensiveLeadModal(false);
                    setShowLeadModal(true);
                  }}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  Click Here for Detailed Information
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Modal */}
      <Dialog open={showArchiveModal} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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
      <Dialog open={showAddLeadModal} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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
                        <FormLabel className="text-white/70">Account Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="bg-white/10 border-blue-400/30 text-white" data-testid="select-guide-type">
                              <SelectValue placeholder="Select account type" />
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
      <Dialog open={showAddEventModal} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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
                        className="bg-white/10 border-blue-400/30 text-white [&::-webkit-calendar-picker-indicator]:invert"
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
                          className="bg-white/10 border-blue-400/30 text-white [&::-webkit-calendar-picker-indicator]:invert"
                          data-testid="input-event-start-time"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-adjust end time to be 1 hour after start time
                            const startTime = e.target.value;
                            const currentEndTime = addEventForm.getValues('endTime');
                            
                            if (startTime && (!currentEndTime || currentEndTime <= startTime)) {
                              const [hours, minutes] = startTime.split(':');
                              const startHour = parseInt(hours);
                              const startMinutes = parseInt(minutes);
                              
                              // Add 60 minutes with proper overflow handling
                              let totalMinutes = startHour * 60 + startMinutes + 60;
                              
                              // Handle overflow past 23:59 by clamping to 23:59
                              if (totalMinutes >= 24 * 60) {
                                totalMinutes = 23 * 60 + 59; // 23:59
                              }
                              
                              const endHour = Math.floor(totalMinutes / 60);
                              const endMin = totalMinutes % 60;
                              const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
                              addEventForm.setValue('endTime', endTime);
                            }
                          }}
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
                          className="bg-white/10 border-blue-400/30 text-white [&::-webkit-calendar-picker-indicator]:invert"
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
      <Dialog open={showEditEventModal} modal={false}>
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
                className="!text-white hover:!bg-white/10 h-8 w-8 p-0"
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

              {/* Delete button - separate row for emphasis */}
              <div className="flex pt-2">
                <Button 
                  type="button"
                  variant="destructive"
                  disabled={deleteEventMutation.isPending}
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="!bg-red-600 hover:!bg-red-700 !text-white w-full"
                  data-testid="button-delete-event"
                >
                  Delete Event
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent data-testid="dialog-delete-event-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-event-title">
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-event-description">
              Are you sure you want to delete <strong>"{eventToEdit?.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-event-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteEventMutation.mutate();
                setShowDeleteConfirmation(false);
              }}
              disabled={deleteEventMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              data-testid="button-delete-event-confirm"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Note Modal */}
      <Dialog open={showAddNoteModal} modal={false}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <DialogTitle className="text-white text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Add New Note
            </DialogTitle>
          </DialogHeader>
          <Form {...addNoteForm}>
            <form onSubmit={addNoteForm.handleSubmit(onAddNoteSubmit)} className="space-y-4">
              <FormField
                control={addNoteForm.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Headline</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50"
                        placeholder="Enter a headline for your note..."
                        data-testid="input-note-headline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addNoteForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-white/10 border-blue-400/30 text-white placeholder:text-white/50 min-h-[120px]"
                        placeholder="Enter your note content..."
                        data-testid="textarea-note-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createNoteMutation.isPending}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white flex-1"
                  data-testid="button-save-note"
                >
                  {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddNoteModal(false)}
                  className="border-blue-400/30 bg-white/10 text-white hover:bg-white/20 flex-1"
                  data-testid="button-cancel-note"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Note Modal */}
      <Dialog open={showViewNoteModal} modal={false}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-xl flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {selectedNote?.headline}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowViewNoteModal(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedNote && (
              <div className="text-white/70 text-sm">
                Created {format(new Date(selectedNote.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 border border-blue-400/20">
              <div className="text-white whitespace-pre-wrap">
                {selectedNote?.content}
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  // TODO: Implement edit functionality
                  setShowViewNoteModal(false);
                }}
                className="!bg-blue-600 hover:!bg-blue-700 !text-white"
                data-testid="button-edit-note"
              >
                Edit Note
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (selectedNote) {
                    deleteNoteMutation.mutate(selectedNote.id);
                    setShowViewNoteModal(false);
                  }
                }}
                className="!bg-red-600 hover:!bg-red-700 !text-white"
                data-testid="button-delete-note"
              >
                Delete Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Lead Entry Modal */}
      <ManualLeadEntryModal 
        open={showAddLeadModal} 
        onOpenChange={setShowAddLeadModal}
        onSuccess={() => {
          // Refresh leads and switch to new tab after successful creation
          setActiveTab("new");
        }}
      />

    </div>
    </TooltipProvider>
  );
}