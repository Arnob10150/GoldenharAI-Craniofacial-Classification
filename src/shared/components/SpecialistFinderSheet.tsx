import { Hospital, Phone, MapPinned } from "lucide-react";
import { districtPoints, specialistCenters } from "@/shared/lib/mock-data";
import type { Specialty } from "@/shared/lib/types";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";

interface SpecialistFinderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  district?: string | null;
  specialty?: Specialty | null;
}

export const SpecialistFinderSheet = ({ open, onOpenChange, district, specialty }: SpecialistFinderSheetProps) => {
  const matches = specialistCenters.filter((center) => {
    const districtMatch = district ? center.district === district : true;
    const specialtyMatch = specialty ? center.specialty === specialty : true;
    return districtMatch && specialtyMatch;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <span />
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xl">
        <SheetHeader>
          <SheetTitle>Specialist centers</SheetTitle>
          <SheetDescription>
            Recommended centers near {district || "your region"} for Goldenhar-related follow-up.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            {district ? <Badge variant="secondary">{district}</Badge> : null}
            {specialty ? <Badge variant="secondary">{specialty}</Badge> : null}
            <Badge variant="outline">{matches.length} centers</Badge>
          </div>
          {matches.length ? (
            matches.map((center) => (
              <div key={`${center.name}-${center.specialty}`} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Hospital className="size-4 text-primary" />
                      {center.name}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{center.specialty} · {center.district}</div>
                  </div>
                  <Badge>{center.specialty}</Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPinned className="size-4" />
                    {center.address}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4" />
                    {center.phone}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No centers match the current district filter. Try Dhaka, Chattogram, or remove the specialty filter.
            </div>
          )}
          <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
            District coordinates loaded for {districtPoints.length} Bangladesh districts. This list can be connected to live referral directories later.
          </div>
          <Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
