
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileDown, Mail, Settings } from "lucide-react";
import { Group } from "@/types/database";
import { format } from "date-fns";
import { parseDateString } from "@/lib/utils";

interface GroupDetailNavbarProps {
  group: Group;
  onExport: () => void;
  onEdit: () => void;
  onSendEmail: () => void;
}

const GroupDetailNavbar = ({ group, onExport, onEdit, onSendEmail }: GroupDetailNavbarProps) => {
  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);

  return (
    <header className="bg-background border-b px-4 sm:px-6 lg:px-8 sticky top-0 z-50">
      <div className="container mx-auto flex flex-col md:flex-row h-auto md:h-16 items-start md:items-center justify-between gap-2 md:gap-4 py-2 md:py-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end md:justify-start">
          <Button variant="outline" onClick={onEdit}>
            <Settings className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" onClick={onSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar
          </Button>
          <Button onClick={onExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar excel
          </Button>
        </div>
      </div>
    </header>
  );
};

export default GroupDetailNavbar;
