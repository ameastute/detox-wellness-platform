// src/app/(admin)/admin/appointments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- FIX: Updated type definitions ---
type Appointment = {
  id: string;
  appointmentDate: string;
  patientName: string;
  patientMobile: string;
  status: string;
  service: { title: string };
  practitioner: { name: string }; // Changed from specialist
};
type Practitioner = { id: string; name: string }; // Changed from Specialist
type Service = { id: string; title: string };

const AppointmentsManagementPage = () => {
  // State for data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]); // Changed from specialists
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: '',
    practitionerId: '', // Changed from specialistId
    serviceId: '',
  });

  // Fetch initial data for filters and appointments
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== '')
        );
        const query = new URLSearchParams(activeFilters).toString();
        
        const [apptsRes, practitionersRes, servicesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/appointments?${query}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/practitioners', { headers: { 'Authorization': `Bearer ${token}` } }), // Changed from specialists
          fetch('http://localhost:5000/api/services', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (!apptsRes.ok || !practitionersRes.ok || !servicesRes.ok) {
            throw new Error('Failed to fetch data');
        }

        setAppointments(await apptsRes.json());
        setPractitioners(await practitionersRes.json()); // Changed from setSpecialists
        setServices(await servicesRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: newValue }));
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Appointment Management</h1>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by Patient Name or Mobile..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="md:w-1/3"
          />
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.practitionerId} onValueChange={(value) => handleFilterChange('practitionerId', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Practitioner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Practitioners</SelectItem>
              {practitioners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.serviceId} onValueChange={(value) => handleFilterChange('serviceId', value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader><CardTitle>All Appointments</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? ( <p>Loading appointments...</p> ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Practitioner</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length > 0 ? appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">{appt.patientName}</TableCell>
                    <TableCell>{appt.patientMobile}</TableCell>
                    <TableCell>{format(new Date(appt.appointmentDate), 'PPP p')}</TableCell>
                    <TableCell>{appt.service.title}</TableCell>
                    <TableCell>{appt.practitioner.name}</TableCell>
                    <TableCell><Badge>{appt.status}</Badge></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No appointments found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsManagementPage;
