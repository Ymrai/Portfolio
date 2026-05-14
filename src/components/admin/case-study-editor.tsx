"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GalleryUpload } from "./gallery-upload";
import { CASE_STUDY_SECTIONS, type CaseStudy, type CaseStudySection } from "@/types";

interface CaseStudyEditorProps {
  value: CaseStudy;
  onChange: (cs: CaseStudy) => void;
  projectId?: string;
}

export function CaseStudyEditor({
  value,
  onChange,
  projectId,
}: CaseStudyEditorProps) {
  function updateSection(
    key: keyof CaseStudy,
    patch: Partial<CaseStudySection>
  ) {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  }

  return (
    <div className="space-y-8">
      {CASE_STUDY_SECTIONS.map(({ key, label }) => (
        <div key={key} className="space-y-3 p-4 border border-border rounded-lg">
          <h3 className="font-medium text-sm">{label}</h3>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Text</Label>
            <Textarea
              value={value[key].text}
              onChange={(e) => updateSection(key, { text: e.target.value })}
              placeholder={`Write the ${label.toLowerCase()} section…`}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Images (optional)
            </Label>
            <GalleryUpload
              value={value[key].images}
              onChange={(images) => updateSection(key, { images })}
              folder={`projects/${projectId ?? "new"}/case-study/${key}`}
              maxImages={8}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
