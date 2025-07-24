
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileDown, Settings } from "lucide-react";
import { Group } from "@/types/database";
import { format } from "date-fns";
import { parseDateString } from "@/lib/utils";

interface GroupDetailNavbarProps {
  group: Group;
  onExport: () => void;
  onEdit: () => void;
}

const GroupDetailNavbar = ({ group, onExport, onEdit }: GroupDetailNavbarProps) => {
  const startDate = parseDateString(group.start_date);
  const endDate = parseDateString(group.end_date);

  return (
    <header className="bg-background border-b px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          <Button onClick={onExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Settings className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>
    </header>
  );
};

export default GroupDetailNavbar;
