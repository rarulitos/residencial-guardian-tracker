
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface WorkerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, position: string, faena: string) => void;
}

const WorkerFormDialog: React.FC<WorkerFormDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [faena, setFaena] = useState('');

  const handleSubmit = () => {
    if (name.trim() && position.trim() && faena.trim()) {
      onSave(name.trim(), position.trim(), faena.trim());
      setName('');
      setPosition('');
      setFaena('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Trabajador</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Nombre del trabajador" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Cargo
            </Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="col-span-3" placeholder="Cargo o especialidad" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="faena" className="text-right">
              Faena
            </Label>
            <Input id="faena" value={faena} onChange={(e) => setFaena(e.target.value)} className="col-span-3" placeholder="Nombre de la faena" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerFormDialog;
