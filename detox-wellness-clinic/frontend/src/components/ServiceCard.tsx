// src/components/ServiceCard.tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, HeartPulse } from 'lucide-react'; // Icons for categories

type ServiceCardProps = {
  title: string;
  description: string;
  category: 'MIND' | 'BODY';
};

const ServiceCard = ({ title, description, category }: ServiceCardProps) => {
  const Icon = category === 'MIND' ? Brain : HeartPulse;
  return (
    <Card className="flex flex-col h-full hover:bg-gray-50 transition-colors">
      <CardHeader>
        <div className="mb-4">
          <Icon className="w-10 h-10 text-green-600" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default ServiceCard;