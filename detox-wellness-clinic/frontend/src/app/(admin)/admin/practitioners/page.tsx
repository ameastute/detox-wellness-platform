// src/app/(admin)/admin/practitioners/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';

// UI Components & Icons
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, User as UserIcon, Shield, ShieldOff } from 'lucide-react';

// --- Constants ---
const API_BASE_URL = 'http://localhost:5000';

// --- Helper Functions ---
const getImageUrl = (photoUrl: string | null | undefined): string | undefined => {
  if (!photoUrl) return undefined;
  // If it's already a full URL, return as is
  if (photoUrl.startsWith('http')) return photoUrl;
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}/${photoUrl}`;
};

// --- Type Definitions ---
type Service = { id: string; title: string; category: 'MIND' | 'BODY' };
type Practitioner = {
  id: string; title: 'MR' | 'MRS' | 'DR'; name: string; email: string;
  role: 'DOCTOR' | 'THERAPIST' | 'COUNSELOR' | 'CONSULTANT';
  status: 'ACTIVE' | 'BLOCKED'; contactPrimary: string; credentials: string;
  photoUrl?: string | null; services: Service[]; languages: string[];
  certifications: string[]; education?: string | null; bio?: string | null;
  philosophy?: string | null; experienceInYears: number;
  consultationType: 'ONLINE' | 'OFFLINE' | 'BOTH';
};

const practitionerSchema = z.object({
  title: z.enum(['MR', 'MRS', 'DR']),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  role: z.enum(['DOCTOR', 'THERAPIST', 'COUNSELOR', 'CONSULTANT']),
  contactPrimary: z.string().min(10, 'A valid primary contact number is required'),
  contactSecondary: z.string().optional(),
  credentials: z.string().min(2, 'Credentials are required'),
  experienceInYears: z.coerce.number().min(0, 'Experience must be positive'),
  languages: z.string().min(2, 'Languages are required (comma-separated)'),
  education: z.string().optional(),
  certifications: z.string().min(2, 'Certifications are required (comma-separated)'),
  consultationType: z.enum(['ONLINE', 'OFFLINE', 'BOTH']),
  bio: z.string().optional(),
  philosophy: z.string().optional(),
  photo: z.any().optional(),
  serviceIds: z.array(z.string()).min(1, "Select at least one service"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type PractitionerFormData = z.infer<typeof practitionerSchema>;

type DialogState = { type: 'ADD' | 'EDIT' | 'DELETE' | 'TOGGLE_STATUS' | null; data: Practitioner | null; }

const PractitionersManagementPage = () => {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({ type: null, data: null });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<PractitionerFormData>({
    resolver: zodResolver(practitionerSchema),
  });

  const isEditing = dialogState.type === 'EDIT';

  const fetchAllData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const [practitionersRes, servicesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/practitioners`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${API_BASE_URL}/api/services`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);
      setPractitioners(await practitionersRes.json());
      setAllServices(await servicesRes.json());
    } catch (error) { 
      console.error('Error fetching data:', error);
      toast.error('Failed to load data.'); 
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleOpenDialog = (type: 'ADD' | 'EDIT', practitioner: Practitioner | null = null) => {
    setDialogState({ type, data: practitioner });
    
    if (practitioner) {
      // Set photo preview for editing
      const imageUrl = getImageUrl(practitioner.photoUrl);
      setPhotoPreview(imageUrl || null);
      
      const categories = Array.from(new Set(practitioner.services.map(s => s.category)));
      setSelectedCategories(categories);
      reset({
        ...practitioner,
        languages: practitioner.languages.join(', '),
        certifications: practitioner.certifications.join(', '),
        serviceIds: practitioner.services.map(s => s.id),
        password: '', // Clear password for editing
        confirmPassword: '', // Clear confirm password for editing
      });
    } else {
      // Reset for new practitioner
      setPhotoPreview(null);
      setSelectedCategories([]);
      reset({ 
        title: 'DR', 
        name: '', 
        email: '', 
        password: '',
        confirmPassword: '',
        role: 'DOCTOR', 
        contactPrimary: '', 
        credentials: '', 
        experienceInYears: 0, 
        languages: '', 
        certifications: '', 
        consultationType: 'BOTH', 
        serviceIds: [] 
      });
    }
  };
  
  const closeDialogs = () => {
    setDialogState({ type: null, data: null });
    setPhotoPreview(null);
    setSelectedCategories([]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } else {
      setPhotoPreview(null);
    }
  };

  const onSubmit = async (data: PractitionerFormData) => {
    // For "Add New", password is required
    if (!isEditing && !data.password) {
        toast.error("Password is required for new practitioners.");
        return;
    }

    const token = localStorage.getItem('authToken');
    const url = isEditing ? `${API_BASE_URL}/api/practitioners/${dialogState.data?.id}` : `${API_BASE_URL}/api/practitioners`;
    const method = isEditing ? 'PUT' : 'POST';

    const formData = new FormData();
    // Dynamically append all form data
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'serviceIds' && Array.isArray(value)) {
            formData.append('services', JSON.stringify(value));
        } else if (key === 'photo' && value && value.length > 0) {
            formData.append('photo', value[0]);
        } else if (key === 'password' && !value) {
            return; // Don't send empty password on edit
        } else if (key !== 'confirmPassword' && value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    try {
      const response = await fetch(url, { 
        method, 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} practitioner`);
      }
      
      toast.success(`Practitioner ${isEditing ? 'updated' : 'created'} successfully!`);
      closeDialogs();
      fetchAllData();
    } catch (error: any) { 
      console.error('Error submitting form:', error);
      toast.error(error.message); 
    }
  };
  
  const handleToggleStatus = async () => {
    if (dialogState.type !== 'TOGGLE_STATUS' || !dialogState.data) return;
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${API_BASE_URL}/api/practitioners/${dialogState.data.id}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to update status');
        toast.success('Practitioner status updated successfully!');
        closeDialogs();
        fetchAllData();
    } catch (error: any) {
        toast.error(error.message);
    }
  };
  
  const handleDelete = async () => {
    if (dialogState.type !== 'DELETE' || !dialogState.data) return;
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${API_BASE_URL}/api/practitioners/${dialogState.data.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete practitioner');
        toast.success('Practitioner deleted successfully!');
        closeDialogs();
        fetchAllData();
    } catch (error: any) {
        toast.error(error.message);
    }
  };
  
  const filteredServices = allServices.filter(s => selectedCategories.includes(s.category));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Practitioners</h1>
        <Button onClick={() => handleOpenDialog('ADD')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Practitioner
        </Button>
      </div>
      
      <Card>
        <CardHeader><CardTitle>All Practitioners</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {practitioners.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium flex items-center gap-4">
                      <Avatar>
                        <AvatarImage 
                          src={getImageUrl(p.photoUrl)} 
                          alt={`${p.name} photo`}
                        />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                      </Avatar>
                      {p.title}. {p.name}
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleOpenDialog('EDIT', p)}>
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {p.status === 'ACTIVE' ? (
                            <DropdownMenuItem 
                              onSelect={() => setDialogState({ type: 'TOGGLE_STATUS', data: p })} 
                              className="text-orange-600"
                            >
                              <ShieldOff className="mr-2 h-4 w-4" /> Block
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onSelect={() => setDialogState({ type: 'TOGGLE_STATUS', data: p })} 
                              className="text-green-600"
                            >
                              <Shield className="mr-2 h-4 w-4" /> Unblock
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onSelect={() => setDialogState({ type: 'DELETE', data: p })} 
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogState.type === 'ADD' || dialogState.type === 'EDIT'} onOpenChange={(isOpen) => !isOpen && closeDialogs()}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Practitioner Profile' : 'Add New Practitioner'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Controller 
                  name="title" 
                  control={control} 
                  render={({ field }) => (
                    <div>
                      <Label>Title</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MR">Mr.</SelectItem>
                          <SelectItem value="MRS">Mrs.</SelectItem>
                          <SelectItem value="DR">Dr.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )} 
                />
                <div className="md:col-span-2">
                  <Label>Full Name</Label>
                  <Input placeholder="e.g., Anjali Sharma" {...register('name')} />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller 
                name="role" 
                control={control} 
                render={({ field }) => (
                  <div>
                    <Label>Role / Designation</Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="THERAPIST">Therapist</SelectItem>
                        <SelectItem value="COUNSELOR">Counselor</SelectItem>
                        <SelectItem value="CONSULTANT">Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )} 
              />
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="e.g., name@example.com" {...register('email')} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
            </div>
            
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="Enter new password" {...register('password')} />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="Confirm new password" {...register('confirmPassword')} />
                  {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            )}
            
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>New Password (Optional)</Label>
                  <Input type="password" placeholder="Leave blank to keep current password" {...register('password')} />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" {...register('confirmPassword')} />
                  {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Primary Contact</Label>
                  <Input placeholder="e.g., +919876543210" {...register('contactPrimary')} />
                  {errors.contactPrimary && <p className="text-red-500 text-sm">{errors.contactPrimary.message}</p>}
                </div>
                <div>
                  <Label>Secondary Contact (Optional)</Label>
                  <Input placeholder="e.g., +919123456789" {...register('contactSecondary')} />
                </div>
            </div>
            
            <div>
              <Label>Credentials</Label>
              <Input placeholder="e.g., MBBS, MD (Psychiatry)" {...register('credentials')} />
              {errors.credentials && <p className="text-red-500 text-sm">{errors.credentials.message}</p>}
            </div>
            
            <div>
              <Label>Education</Label>
              <Textarea placeholder="e.g., MD in Psychiatry from NIMHANS, Bangalore" {...register('education')} />
            </div>
            
            <div>
              <Label>Certifications (comma-separated)</Label>
              <Input placeholder="e.g., Indian Psychiatric Society Certified" {...register('certifications')} />
              {errors.certifications && <p className="text-red-500 text-sm">{errors.certifications.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience (Years)</Label>
                  <Input type="number" placeholder="e.g., 12" {...register('experienceInYears')} />
                  {errors.experienceInYears && <p className="text-red-500 text-sm">{errors.experienceInYears.message}</p>}
                </div>
                <Controller 
                  name="consultationType" 
                  control={control} 
                  render={({ field }) => (
                    <div>
                      <Label>Consultation Type</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONLINE">Online</SelectItem>
                          <SelectItem value="OFFLINE">Offline</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )} 
                />
            </div>
            
            <div>
              <Label>Languages (comma-separated)</Label>
              <Input placeholder="e.g., English, Malayalam, Hindi" {...register('languages')} />
              {errors.languages && <p className="text-red-500 text-sm">{errors.languages.message}</p>}
            </div>
            
            <div>
              <Label>Bio</Label>
              <Textarea placeholder="A brief biography of the practitioner..." {...register('bio')} />
            </div>
            
            <div>
              <Label>Philosophy (Optional)</Label>
              <Textarea placeholder="The practitioner's approach to treatment..." {...register('philosophy')} />
            </div>
            
            <div>
              <Label>Specialized In (Categories)</Label>
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-md mt-2">
                  {['MIND', 'BODY'].map(category => (
                      <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cat-${category}`} 
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => setSelectedCategories(prev => 
                          checked ? [...prev, category] : prev.filter(c => c !== category)
                        )} 
                      />
                      <Label htmlFor={`cat-${category}`} className="font-normal">
                        {category} Services
                      </Label>
                      </div>
                  ))}
              </div>
            </div>
            
            {selectedCategories.length > 0 && (
              <div>
                <Label>Services</Label>
                <Controller 
                  name="serviceIds" 
                  control={control} 
                  render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2 p-4 border rounded-md mt-2">
                      {filteredServices.map(service => (
                          <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={service.id} 
                            checked={field.value?.includes(service.id)}
                            onCheckedChange={(checked) => {
                                return checked 
                                  ? field.onChange([...(field.value || []), service.id]) 
                                  : field.onChange((field.value || []).filter(id => id !== service.id))
                            }} 
                          />
                          <Label htmlFor={service.id} className="font-normal">
                            {service.title}
                          </Label>
                          </div>
                      ))}
                      </div>
                  )} 
                />
                {errors.serviceIds && <p className="text-red-500 text-sm">{errors.serviceIds.message}</p>}
              </div>
            )}
            
            <div>
              <Label>Photo</Label>
              <Input 
                type="file" 
                accept="image/*" 
                {...register('photo')} 
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <div className="mt-2">
                  <Image 
                    src={photoPreview} 
                    alt="Preview" 
                    width={100} 
                    height={100} 
                    className="rounded-md object-cover border"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Profile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={dialogState.type === 'DELETE' || dialogState.type === 'TOGGLE_STATUS'} onOpenChange={(isOpen) => !isOpen && closeDialogs()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'DELETE' 
                ? `This will permanently delete practitioner ${dialogState.data?.name}.` 
                : `This will ${dialogState.data?.status === 'ACTIVE' ? 'block' : 'unblock'} ${dialogState.data?.name}.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={dialogState.type === 'DELETE' ? handleDelete : handleToggleStatus}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PractitionersManagementPage;