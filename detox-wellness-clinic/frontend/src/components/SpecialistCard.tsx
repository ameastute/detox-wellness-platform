// src/components/SpecialistCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the props that this component will accept
type SpecialistCardProps = {
  name: string;
  credentials: string;
  experience: number;
};

const SpecialistCard = ({ name, credentials, experience }: SpecialistCardProps) => {
  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-md text-gray-600">{credentials}</p>
        <p className="text-sm text-gray-500 mt-2">{experience} years of experience</p>
      </CardContent>
    </Card>
  );
};

export default SpecialistCard;