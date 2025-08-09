// src/app/booking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from "date-fns";
import { toast } from "sonner";

import 'react-phone-number-input/style.css'
import PhoneInputWithCountry from 'react-phone-number-input/react-hook-form';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, PartyPopper, Calendar as CalendarIcon, Upload } from 'lucide-react';

// --- Type Definitions ---
type Service = { id: string; title: string; category: 'MIND' | 'BODY' };
type Specialist = { id: string; name: string };
type Program = { id: string; name: string; description: string; features: string[]; price: number, sessions: number };
type Session = { date: Date; time: string };

// --- Zod Schema for Validation ---
const bookingSchema = z.object({
  category: z.enum(['MIND', 'BODY']),
  serviceId: z.string().min(1, "Please select a service."),
  specialistId: z.string().min(1, "Please select a specialist."),
  consultationType: z.enum(['ONLINE', 'OFFLINE']),
  programId: z.string().min(1, "Please select a program."),
  sessions: z.array(z.object({
      date: z.date({ required_error: "Please select a date." }),
      time: z.string().min(1, "Please select a time."),
  })).optional(),
  residentialMonth: z.string().optional(),
  residentialYear: z.string().optional(),
  patientName: z.string().min(2, "Name must be at least 2 characters."),
  patientAge: z.coerce.number().min(1, "Please enter a valid age.").max(120),
  patientGender: z.string().min(1, "Please select a gender."),
  patientMobile: z.string().min(10, "Please enter a valid phone number."),
  patientEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  medicalReport: z.any().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

// --- Main Component ---
const BookingPage = () => {
  // --- State for Data & UI ---
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allSpecialists, setAllSpecialists] = useState<Specialist[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // --- React Hook Form Setup ---
  const { control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { category: 'MIND', consultationType: 'OFFLINE', sessions: [], patientEmail: '' },
    mode: "onChange"
  });

  // --- Watch for changes ---
  const selectedProgramId = watch('programId');
  const selectedCategory = watch('category');
  const bookedSessions = watch('sessions') || [];
  const selectedProgram = allPrograms.find(p => p.id === selectedProgramId);

  // --- Fetch initial data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [servicesRes, specialistsRes, programsRes] = await Promise.all([
          fetch('http://localhost:5000/api/services'),
          fetch('http://localhost:5000/api/specialists'),
          fetch('http://localhost:5000/api/programs'),
        ]);
        setAllServices(await servicesRes.json());
        setAllSpecialists(await specialistsRes.json());
        setAllPrograms(await programsRes.json());
      } catch (error) { console.error("Failed to fetch booking data", error); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  // --- Form Submission Logic ---
const processBooking: SubmitHandler<BookingFormData> = async (data) => {
  // FormData is required to send files along with text data
  const formData = new FormData();

  // Append all the text fields
  formData.append('consultationType', data.consultationType);
  formData.append('programId', data.programId);
  formData.append('patientName', data.patientName);
  formData.append('patientAge', String(data.patientAge));
  formData.append('patientGender', data.patientGender);
  formData.append('patientMobile', data.patientMobile);
  formData.append('serviceId', data.serviceId);
  formData.append('specialistId', data.specialistId);

  if (data.patientEmail) formData.append('patientEmail', data.patientEmail);
  if (data.sessions) formData.append('sessions', JSON.stringify(data.sessions));
  if (data.residentialMonth) formData.append('residentialMonth', data.residentialMonth);
  if (data.residentialYear) formData.append('residentialYear', data.residentialYear);

  // Append the file if it exists
  if (data.medicalReport && data.medicalReport.length > 0) {
    formData.append('medicalReport', data.medicalReport[0]);
  }

  try {
    const response = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      // Do NOT set Content-Type header, the browser will do it for FormData
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Booking failed!');
    }

    toast.success('Appointment Booked Successfully!');
    setCurrentStep(5); // Move to success step
  } catch (error: any) {
    toast.error(error.message || 'Something went wrong. Please try again.');
  }
};

  // --- Helper variables and functions ---
  const filteredServices = allServices.filter(s => s.category === selectedCategory);
  const nextStep = async () => {
    let fieldsToValidate: (keyof BookingFormData)[] = [];
    if (currentStep === 1) fieldsToValidate = ['category', 'consultationType', 'serviceId', 'specialistId'];
    if (currentStep === 2) fieldsToValidate = ['programId'];
    if (currentStep === 3) {
        if (selectedProgram?.name === 'RESIDENTIAL PROGRAM') fieldsToValidate = ['residentialMonth', 'residentialYear'];
        else fieldsToValidate = ['sessions'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setCurrentStep(prev => prev + 1);
  };
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const timeSlots = ["09:30 AM", "10:30 AM", "11:30 AM", "02:30 PM", "03:30 PM", "04:30 PM"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  if (isLoading) return <p className="text-center p-24">Loading booking form...</p>;

  // --- RENDER ---
  return (
    <div className="bg-white">
      <section className="bg-green-50 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">Book an Appointment</h1>
        <p className="text-lg text-gray-600 mt-4">Take the first step towards your wellness journey.</p>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-3xl">
          <form onSubmit={handleSubmit(processBooking)}>
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <Card>
                <CardHeader><CardTitle>Step 1: Service & Specialist</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {/* Category & Consultation Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={control} name="category" render={({ field }) => (
                      <div><Label>Category</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="mt-2 grid grid-cols-2 gap-4">
                        <Label htmlFor="cat-mind" className={`flex items-center justify-center p-4 border-2 rounded-md cursor-pointer ${field.value === 'MIND' && 'border-primary'}`}>Mind</Label><RadioGroupItem value="MIND" id="cat-mind" className="sr-only" />
                        <Label htmlFor="cat-body" className={`flex items-center justify-center p-4 border-2 rounded-md cursor-pointer ${field.value === 'BODY' && 'border-primary'}`}>Body</Label><RadioGroupItem value="BODY" id="cat-body" className="sr-only" />
                      </RadioGroup></div>
                    )}/>
                    <Controller control={control} name="consultationType" render={({ field }) => (
                      <div><Label>Consultation</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="mt-2 grid grid-cols-2 gap-4">
                        <Label htmlFor="con-online" className={`flex items-center justify-center p-4 border-2 rounded-md cursor-pointer ${field.value === 'ONLINE' && 'border-primary'}`}>Online</Label><RadioGroupItem value="ONLINE" id="con-online" className="sr-only" />
                        <Label htmlFor="con-offline" className={`flex items-center justify-center p-4 border-2 rounded-md cursor-pointer ${field.value === 'OFFLINE' && 'border-primary'}`}>Offline</Label><RadioGroupItem value="OFFLINE" id="con-offline" className="sr-only" />
                      </RadioGroup></div>
                    )}/>
                  </div>
                  {/* Service & Specialist Selects */}
                  <Controller control={control} name="serviceId" render={({ field }) => (<div><Label>Specific Service</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger><SelectContent>{filteredServices.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent></Select>{errors.serviceId && <p className="text-red-500 text-sm mt-1">{errors.serviceId.message}</p>}</div>)} />
                  <Controller control={control} name="specialistId" render={({ field }) => (<div><Label>Preferred Specialist</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select a specialist" /></SelectTrigger><SelectContent>{allSpecialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>{errors.specialistId && <p className="text-red-500 text-sm mt-1">{errors.specialistId.message}</p>}</div>)} />
                </CardContent>
                <CardFooter className="flex justify-end"><Button type="button" onClick={nextStep}>Next</Button></CardFooter>
              </Card>
            )}

            {/* Step 2: Program Selection */}
            {currentStep === 2 && (
              <Card>
                <CardHeader><CardTitle>Step 2: Program</CardTitle></CardHeader>
                <CardContent>
                  <Controller control={control} name="programId" render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-4">
                      {allPrograms.map(p => (<Label key={p.id} htmlFor={p.id} className={`p-6 border-2 rounded-lg cursor-pointer transition-all block ${field.value === p.id ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}><RadioGroupItem value={p.id} id={p.id} className="sr-only" /><h3 className="font-bold">{p.name}</h3><p className="text-sm text-gray-600">{p.description}</p><ul className="mt-2 space-y-1">{p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500" />{f}</li>)}</ul><p className="text-right font-bold text-2xl mt-2">₹{p.price}</p></Label>))}
                    </RadioGroup>
                  )}/>
                  {errors.programId && <p className="text-red-500 text-sm mt-1">{errors.programId.message}</p>}
                </CardContent>
                <CardFooter className="flex justify-between"><Button type="button" variant="outline" onClick={prevStep}>Back</Button><Button type="button" onClick={nextStep}>Next</Button></CardFooter>
              </Card>
            )}

            {/* Step 3: Date & Time */}
            {currentStep === 3 && (
              <Card>
                <CardHeader><CardTitle>Step 3: Date & Time</CardTitle></CardHeader>
                <CardContent>
                  {/* Basic Program */}
                  {selectedProgram?.name === 'BASIC PROGRAM' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {bookedSessions[0]?.date ? format(bookedSessions[0].date, "PPP") + " at " + bookedSessions[0].time : <span>Pick a date and time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={bookedSessions[0]?.date} onSelect={(date) => setValue('sessions.0.date', date!, { shouldValidate: true })} initialFocus />
                        <div className="p-3 border-t"><Label>Time</Label><Select onValueChange={(time) => setValue('sessions.0.time', time, { shouldValidate: true })}><SelectTrigger><SelectValue placeholder="Select time"/></SelectTrigger><SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                      </PopoverContent>
                    </Popover>
                  )}
                  {/* Extended Program */}
                  {selectedProgram?.name === 'EXTENDED PROGRAM' && (
                    <div className="space-y-4">
                      {Array.from({ length: selectedProgram.sessions }).map((_, index) => {
                        const prevSessionDate = bookedSessions[index - 1]?.date;
                        const isDisabled = index > 0 && !prevSessionDate;
                        return (
                          <div key={index}>
                            <Label>Session {index + 1}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" disabled={isDisabled} className="w-full justify-start text-left font-normal mt-1">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {bookedSessions[index]?.date ? format(bookedSessions[index].date, "PPP") + " at " + bookedSessions[index].time : <span>Choose Date & Time</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={bookedSessions[index]?.date} onSelect={(date) => setValue(`sessions.${index}.date`, date!, { shouldValidate: true })} disabled={(date) => prevSessionDate ? (date <= addDays(prevSessionDate, 7) || date > addDays(prevSessionDate, 14)) : false} initialFocus />
                                <div className="p-3 border-t"><Label>Time</Label><Select onValueChange={(time) => setValue(`sessions.${index}.time`, time, { shouldValidate: true })}><SelectTrigger><SelectValue placeholder="Select time"/></SelectTrigger><SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Residential Program */}
                  {selectedProgram?.name === 'RESIDENTIAL PROGRAM' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Please choose the month and year you are interested in. We will contact you for further details and to confirm exact dates.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Controller control={control} name="residentialMonth" render={({ field }) => (<div><Label>Month</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select month"/></SelectTrigger><SelectContent>{months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>)} />
                        <Controller control={control} name="residentialYear" render={({ field }) => (<div><Label>Year</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select year"/></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div>)} />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between"><Button type="button" variant="outline" onClick={prevStep}>Back</Button><Button type="button" onClick={nextStep}>Next</Button></CardFooter>
              </Card>
            )}

            {/* Step 4: Personal Information */}
            {currentStep === 4 && (
              <Card>
                <CardHeader><CardTitle>Step 4: Your Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Controller name="patientName" control={control} render={({ field }) => (<div><Label>Full Name</Label><Input {...field} />{errors.patientName && <p className="text-red-500 text-sm mt-1">{errors.patientName.message}</p>}</div>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Controller name="patientAge" control={control} render={({ field }) => (<div><Label>Age</Label><Input type="number" {...field} />{errors.patientAge && <p className="text-red-500 text-sm mt-1">{errors.patientAge.message}</p>}</div>)} />
                    <Controller name="patientGender" control={control} render={({ field }) => (<div><Label>Gender</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>{errors.patientGender && <p className="text-red-500 text-sm mt-1">{errors.patientGender.message}</p>}</div>)} />
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <PhoneInputWithCountry name="patientMobile" control={control} rules={{ required: true }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                    {errors.patientMobile && <p className="text-red-500 text-sm mt-1">{errors.patientMobile.message}</p>}
                  </div>
                  <Controller name="patientEmail" control={control} render={({ field }) => (<div><Label>Email (Optional)</Label><Input type="email" {...field} />{errors.patientEmail && <p className="text-red-500 text-sm mt-1">{errors.patientEmail.message}</p>}</div>)} />
                  <div>
                    <Label htmlFor="medicalReport">Medical Report or Prescription (Optional)</Label>
                    <Input id="medicalReport" type="file" accept=".pdf,.jpeg,.jpg,.png" {...control.register('medicalReport')} className="file:text-green-700 hover:file:bg-green-100" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between"><Button type="button" variant="outline" onClick={prevStep}>Back</Button><Button type="submit">Confirm & Book</Button></CardFooter>
              </Card>
            )}

            {/* Step 5: Success */}
            {currentStep === 5 && (
              <div className="text-center p-12 bg-green-50 rounded-lg">
                <PartyPopper className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Booking Confirmed!</h2>
                <p className="mt-2 text-gray-600">Thank you for booking with us. You will receive a confirmation message shortly.</p>
                <Button onClick={() => window.location.reload()} className="mt-6">Book Another Appointment</Button>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default BookingPage;
