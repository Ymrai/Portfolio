"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TagInput } from "@/components/admin/tag-input";
import { saveAboutMe } from "@/app/actions/about-me";
import { createClient } from "@/lib/supabase/client";
import {
  parseExperience,
  parseEducation,
  type ExperienceEntry,
  type EducationEntry,
} from "@/types";
import { Plus, Trash2 } from "lucide-react";

export default function AdminAboutPage() {
  const [pending, startTransition] = useTransition();

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("about_me")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setBio(data.bio ?? "");
        setSkills(data.skills ?? []);
        setInterests(data.interests ?? []);
        setExperience(parseExperience(data.experience));
        setEducation(parseEducation(data.education));
      });
  }, []);

  function addExperience() {
    setExperience([
      ...experience,
      { company: "", role: "", start_date: "", end_date: null, description: "" },
    ]);
  }

  function updateExp(idx: number, patch: Partial<ExperienceEntry>) {
    setExperience(experience.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function addEducation() {
    setEducation([
      ...education,
      { institution: "", degree: "", field: "", graduation_year: new Date().getFullYear() },
    ]);
  }

  function updateEdu(idx: number, patch: Partial<EducationEntry>) {
    setEducation(education.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function handleSave() {
    startTransition(async () => {
      const { error } = await saveAboutMe({
        bio: bio || undefined,
        skills,
        interests,
        experience,
        education,
      });
      if (error) { toast.error(error); return; }
      toast.success("About Me saved");
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">About Me</h1>
          <p className="text-sm text-muted-foreground mt-1">Bio, skills, and experience</p>
        </div>
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell your story…"
          rows={6}
        />
      </div>

      <Separator />

      {/* Skills */}
      <div className="space-y-1.5">
        <Label>Skills</Label>
        <TagInput value={skills} onChange={setSkills} placeholder="React, Figma, Python… (Enter)" />
      </div>

      {/* Interests */}
      <div className="space-y-1.5">
        <Label>Interests</Label>
        <TagInput value={interests} onChange={setInterests} placeholder="Photography, Music… (Enter)" />
      </div>

      <Separator />

      {/* Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Experience</Label>
          <Button type="button" variant="outline" size="sm" onClick={addExperience}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        {experience.map((exp, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <Input value={exp.company} onChange={(e) => updateExp(idx, { company: e.target.value })} placeholder="Acme Inc." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Input value={exp.role} onChange={(e) => updateExp(idx, { role: e.target.value })} placeholder="Senior Designer" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input value={exp.start_date} onChange={(e) => updateExp(idx, { start_date: e.target.value })} placeholder="Jan 2022" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input value={exp.end_date ?? ""} onChange={(e) => updateExp(idx, { end_date: e.target.value || null })} placeholder="Present" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={exp.description} onChange={(e) => updateExp(idx, { description: e.target.value })} rows={2} placeholder="What you did…" />
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Education</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        {education.map((edu, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setEducation(education.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Institution</Label>
                <Input value={edu.institution} onChange={(e) => updateEdu(idx, { institution: e.target.value })} placeholder="MIT" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Degree</Label>
                <Input value={edu.degree} onChange={(e) => updateEdu(idx, { degree: e.target.value })} placeholder="B.Sc." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Field</Label>
                <Input value={edu.field} onChange={(e) => updateEdu(idx, { field: e.target.value })} placeholder="Computer Science" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Graduation Year</Label>
                <Input type="number" value={edu.graduation_year} onChange={(e) => updateEdu(idx, { graduation_year: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
