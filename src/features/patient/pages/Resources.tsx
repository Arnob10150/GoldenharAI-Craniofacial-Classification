import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Download, Hospital, MapPinned } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { DISTRICT_OPTIONS } from "@/shared/lib/types";
import { faqBn, faqEn, resourceSectionsBn, resourceSectionsEn, specialistCenters } from "@/shared/lib/mock-data";

const downloadChecklist = (isBangla: boolean) => {
  const doc = new jsPDF();
  const lines = isBangla
    ? [
        "GoldenScope AI ????? ????????",
        "1. ??????? ??????? ????? ???",
        "2. ?????, ????? ?? ????? ?????? ????? ????? ???? ???",
        "3. ?????, ???????????, ???????? ????????? ???? ????????? ?????",
      ]
    : [
        "GoldenScope AI Emergency Checklist",
        "1. Bring the latest scan report.",
        "2. Seek urgent care for worsening breathing, feeding, or eye exposure issues.",
        "3. Tell the team about hearing, cardiac, or vertebral concerns.",
      ];
  doc.setFontSize(16);
  doc.text(lines[0], 14, 18);
  doc.setFontSize(11);
  lines.slice(1).forEach((line, index) => doc.text(line, 14, 35 + index * 10));
  doc.save(`goldenscope-emergency-checklist-${isBangla ? "bn" : "en"}.pdf`);
};

export default function Resources() {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";
  const [district, setDistrict] = useState<string>("all");

  const sections = useMemo(() => (isBangla ? resourceSectionsBn : resourceSectionsEn), [isBangla]);
  const faqs = useMemo(() => (isBangla ? faqBn : faqEn), [isBangla]);
  const centers = specialistCenters.filter((center) => district === "all" || center.district === district);

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={isBangla ? "??????? ???????" : "Resource center"}
        description={isBangla ? "?????????? ????????, ???????? ????????, ???????? ??????? ??? ????? ????????? ???????? ????????? ?????" : "Bilingual guidance on Goldenhar Syndrome, surgery timing, specialist centers, and emergency preparedness."}
        actions={<Button className="gap-2" onClick={() => downloadChecklist(isBangla)}><Download className="size-4" /> {isBangla ? "???????? PDF" : "Checklist PDF"}</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.id} className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-2xl bg-muted/40 px-4 py-3">{bullet}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isBangla ? "????????? ???????? ???????" : "Specialist centers in Bangladesh"}</CardTitle>
              <CardDescription>{isBangla ? "???? ??????? ??????? ??? ???????? ??????? ??????? ??????" : "Filter by district to identify likely referral destinations."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isBangla ? "????" : "District"}</label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger><SelectValue placeholder={isBangla ? "???? ???????? ????" : "Select district"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isBangla ? "?? ????" : "All districts"}</SelectItem>
                    {DISTRICT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                {centers.map((center) => (
                  <div key={`${center.name}-${center.specialty}`} className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-semibold"><Hospital className="size-4 text-primary" /> {center.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{center.address}</div>
                      </div>
                      <Badge>{center.specialty}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><MapPinned className="size-4" /> {center.district} · {center.phone}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isBangla ? "?????? ????????" : "Frequently asked questions"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-6 text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
