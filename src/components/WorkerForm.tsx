
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkerFormProps {
  onAddWorker: (name: string, position: string, faena: string) => void;
}

const WorkerForm = ({ onAddWorker }: WorkerFormProps) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [faena, setFaena] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && position.trim() && faena.trim()) {
      onAddWorker(name.trim(), position.trim(), faena.trim());
      setName('');
      setPosition('');
      setFaena('');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Agregar Trabajador</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="name">Nombre y apellido</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del trabajador"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Cargo o especialidad"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="faena">Faena</Label>
            <Input
              id="faena"
              value={faena}
              onChange={(e) => setFaena(e.target.value)}
              placeholder="Nombre de la faena"
            />
          </div>
          <Button type="submit">Agregar</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkerForm;
