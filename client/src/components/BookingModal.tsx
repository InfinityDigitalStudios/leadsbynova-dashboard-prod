import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { format, addDays, isWeekend, isSameDay } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ open, onOpenChange }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Convert 24-hour time to AM/PM format
  const formatTimeAMPM = (time: string): string => {
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  // Format phone number as (000) 000-0000
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setContactPhone(formatted);
  };

  // Calculate next 10 business days
  const getNext10BusinessDays = (): Date[] => {
    const businessDays: Date[] = [];
    let currentDate = addDays(new Date(), 1); // Start from tomorrow
    
    while (businessDays.length < 10) {
      if (!isWeekend(currentDate)) {
        businessDays.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return businessDays;
  };

  const businessDays = getNext10BusinessDays();

  // Generate time slots from 10AM to 4PM ET (2-hour blocks)
  const timeSlots = [
    "10:00",
    "12:00",
    "14:00",
    "16:00"
  ];

  // Fetch available slots for all business days
  const { data: allAvailability } = useQuery({
    queryKey: ['/api/booking/availability/all', businessDays.map(d => d.toISOString()).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        businessDays.map(async (date) => {
          const response = await fetch(`/api/booking/availability?date=${date.toISOString()}`, {
            credentials: 'include',
          });
          if (!response.ok) return { date: date.toISOString(), bookedSlots: [] };
          const data = await response.json();
          return { date: date.toISOString(), bookedSlots: data.bookedSlots || [] };
        })
      );
      return results;
    },
  });

  // Fetch available slots for selected date
  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['/api/booking/availability', selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return { bookedSlots: [] };
      const response = await fetch(`/api/booking/availability?date=${selectedDate.toISOString()}`, {
        credentials: 'include',
      });
      if (!response.ok) return { bookedSlots: [] };
      return response.json();
    },
    enabled: !!selectedDate,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: { date: string; startTime: string; endTime: string; title: string; description: string; contactName: string; contactEmail: string; contactPhone: string }) => {
      const response = await fetch('/api/booking/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Booking failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booking/availability'] });
      toast({
        title: "Demo Scheduled!",
        description: `Your demo is scheduled for ${format(selectedDate!, 'MMMM d, yyyy')} at ${formatTimeAMPM(selectedTime!)} ET`,
      });
      onOpenChange(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to schedule demo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all contact information fields.",
        variant: "destructive",
      });
      return;
    }

    const [hours] = selectedTime.split(':');
    const endHours = (parseInt(hours) + 2).toString().padStart(2, '0');
    const endTime = `${endHours}:00`;

    createBookingMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTime,
      endTime: endTime,
      title: "Demo Call - LeadsByNova™",
      description: "Zoom demo call scheduled from /guide page",
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim()
    });
  };

  const handleBack = () => {
    setSelectedDate(null);
    setSelectedTime(null);
  };

  // Check if a time slot is at least 48 hours from now
  const isAtLeast48HoursAway = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    return slotDateTime >= fortyEightHoursFromNow;
  };

  const isSlotAvailable = (time: string): boolean => {
    if (!selectedDate) return false;
    
    // Check if slot is at least 48 hours away
    if (!isAtLeast48HoursAway(selectedDate, time)) {
      return false;
    }
    
    // Check if slot is already booked
    if (!availableSlots) return true;
    const slots = availableSlots as { bookedSlots?: string[] };
    return !slots.bookedSlots?.includes(time);
  };

  const isSlotBooked = (time: string): boolean => {
    if (!selectedDate || !availableSlots) return false;
    const slots = availableSlots as { bookedSlots?: string[] };
    return slots.bookedSlots?.includes(time) || false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-booking-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#1e40af]">
            {selectedDate ? "Select a Time" : "Select a Date"}
          </DialogTitle>
        </DialogHeader>

        {!selectedDate ? (
          <div className="py-4">
            <p className="text-gray-600 mb-6">Choose a date for your demo call (Monday-Friday)</p>
            <div className="grid grid-cols-2 gap-3">
              {businessDays.map((day, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start hover:border-[#1e40af] hover:bg-blue-50"
                    onClick={() => setSelectedDate(day)}
                    data-testid={`button-select-date-${index}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-[#1e40af]" />
                      <span className="font-semibold text-[#1e40af]">
                        {format(day, 'EEEE')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {format(day, 'MMMM d, yyyy')}
                    </span>
                  </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 text-[#1e40af]"
              data-testid="button-back-to-dates"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dates
            </Button>
            
            <p className="text-gray-600 mb-4">
              Selected: <span className="font-semibold text-[#1e40af]">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              All times are in Eastern Time (ET).
            </p>

            {isLoadingSlots ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {timeSlots.map((time) => {
                  const available = isSlotAvailable(time);
                  const booked = isSlotBooked(time);
                  const [hours] = time.split(':');
                  const endHours = (parseInt(hours) + 2).toString().padStart(2, '0');
                  
                  return (
                    <div key={time} className="relative">
                      <Button
                        variant={selectedTime === time ? "default" : "outline"}
                        className={`h-auto py-4 flex flex-col w-full ${
                          selectedTime === time 
                            ? 'bg-[#1e40af] text-white' 
                            : available 
                              ? 'hover:border-[#1e40af] hover:bg-blue-50' 
                              : 'opacity-40 cursor-not-allowed'
                        }`}
                        onClick={() => available && handleTimeSelect(time)}
                        disabled={!available}
                        data-testid={`button-select-time-${time}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{formatTimeAMPM(time)} - {formatTimeAMPM(`${endHours}:00`)} ET</span>
                        </div>
                        {!available && !booked && (
                          <span className="text-xs">Unavailable</span>
                        )}
                      </Button>
                      {booked && (
                        <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center rounded-md pointer-events-none">
                          <span className="text-white font-semibold text-sm">Booked</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedTime && (
              <div className="space-y-4 mb-6">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-4">Your Contact Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700">
                        Name *
                      </Label>
                      <Input
                        id="contact-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="mt-1"
                        data-testid="input-contact-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
                        Email *
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="Enter your email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="mt-1"
                        data-testid="input-contact-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact-phone" className="text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="(000) 000-0000"
                        value={contactPhone}
                        onChange={handlePhoneChange}
                        className="mt-1"
                        data-testid="input-contact-phone"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Zoom Demo Call</strong> - We'll send you a Zoom link before the scheduled time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleConfirmBooking}
              disabled={!selectedTime || createBookingMutation.isPending}
              className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              data-testid="button-confirm-booking"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              We set aside two full hours for discovery calls, so you'll have plenty of time to ask questions and dive into every detail.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
