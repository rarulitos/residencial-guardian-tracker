import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Worker } from "@/types/database";
import { useState, useEffect } from "react";

interface WorkerEditDialogProps {
  worker: Worker | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (worker: Worker) => void;
}

export function WorkerEditDialog({ worker, isOpen, onClose, onSave }: WorkerEditDialogProps) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [faena, setFaena] = useState("");

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setPosition(worker.position);
      setFaena(worker.faena);
    }
  }, [worker]);

  const handleSave = () => {
    if (worker) {
      onSave({ ...worker, name, position, faena });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Trabajador</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Cargo
            </Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="faena" className="text-right">
              Faena
            </Label>
            <Input id="faena" value={faena} onChange={(e) => setFaena(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}