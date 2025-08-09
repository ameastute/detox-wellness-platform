// src/app/(admin)/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { CalendarCheck, Users, IndianRupee, PlusCircle } from 'lucide-react';

// Define a more specific type for the recent appointments
type RecentAppointment = {
  id: string;
  patientName: string;
  createdAt: string;
  service: { title: string };
  practitioner: { name: string }; // Changed from specialist
};

type Stats = {
  todaysAppointments: number;
  totalRevenue: number;
  recentAppointments: RecentAppointment[];
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Appointment
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaysAppointments}</div>
            <p className="text-xs text-muted-foreground">Total appointments scheduled for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">From all completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* FIX: Changed title from Specialists to Practitioners */}
            <CardTitle className="text-sm font-medium">Active Practitioners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* This is a placeholder value, we can update it later */}
            <div className="text-2xl font-bold">{stats?.recentAppointments.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently available for booking</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                {/* FIX: Changed header from Specialist to Practitioner */}
                <TableHead>Practitioner</TableHead>
                <TableHead>Booked On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentAppointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell className="font-medium">{appt.patientName}</TableCell>
                  <TableCell>{appt.service.title}</TableCell>
                  {/* FIX: Changed data access from appt.specialist.name to appt.practitioner.name */}
                  <TableCell>{appt.practitioner.name}</TableCell>
                  <TableCell>{format(new Date(appt.createdAt), 'PPP')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
