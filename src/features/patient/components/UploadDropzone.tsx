import { UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

interface UploadDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export const UploadDropzone = ({ value, onChange }: UploadDropzoneProps) => {
  const { t } = useTranslation();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      onChange(acceptedFiles[0] ?? null);
    },
    onDropRejected: () => {
      toast.error(t("uploadDropzone.uploadError"));
    },
  });

  return (
    <Card className={cn("border-dashed transition-colors", isDragActive && "border-primary bg-primary/5")}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-10 text-center"
        >
          <input {...getInputProps()} />
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t("uploadDropzone.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("uploadDropzone.description")}</p>
          </div>
          <Button type="button" variant="outline">{t("uploadDropzone.chooseFile")}</Button>
        </div>
        {value ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{value.name}</div>
              <div className="text-muted-foreground">{Math.round(value.size / 1024)} KB</div>
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => onChange(null)}>
              <X className="size-4" />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
