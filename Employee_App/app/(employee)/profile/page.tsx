"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Camera, LogOut, MapPin, Pencil } from "lucide-react";
import type { EmployeeProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { employee, logout, setEmployee } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName);
      setSurname(employee.surname);
      setAvatarUrl(employee.avatarUrl ?? "");
    }
  }, [employee]);

  async function save() {
    setSaving(true);
    const updated: EmployeeProfile = await api.updateProfile({
      firstName,
      surname,
      avatarUrl: avatarUrl.trim() || undefined,
    });
    setEmployee(updated);
    setSaving(false);
    setEditOpen(false);
    toast("Profile updated ✓");
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (!employee) return null;

  return (
    <div className="h-full overflow-y-auto pb-28">
      <TopAppBar title="Profile" />

      {/* Profile header */}
      <div className="bg-white px-5 pb-6 pt-7 shadow-card">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar name={employee.displayName} src={employee.avatarUrl} size="xl" />
            <button
              onClick={() => setEditOpen(true)}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-wuerth-red text-white ring-2 ring-white"
              aria-label="Change picture"
            >
              <Camera size={15} />
            </button>
          </div>
          <h1 className="mt-3.5 text-xl font-bold text-wuerth-ink">{employee.displayName}</h1>
          <p className="text-sm text-wuerth-mute">{employee.email}</p>

          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditOpen(true)}>
            <Pencil size={14} /> Edit profile
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pt-5">
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-wuerth-mute">
          Details
        </h2>
        <div className="space-y-2.5">
          <DetailRow icon={Briefcase} label="Seniority" value={employee.seniority ?? "—"} />
          <DetailRow icon={MapPin} label="Branch / office" value={employee.branchOffice ?? "—"} />
        </div>
      </div>

      <div className="px-4 pt-6">
        <Button variant="danger" block onClick={onLogout}>
          <LogOut size={16} /> Log out
        </Button>
      </div>

      {/* Edit sheet */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <div className="mb-4 flex justify-center">
          <Avatar name={`${firstName} ${surname}`} src={avatarUrl.trim() || undefined} size="xl" />
        </div>
        <div className="space-y-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
          <Input
            label="Picture URL (optional)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
          <Button block onClick={save} loading={saving} disabled={!firstName.trim() || !surname.trim()}>
            Save changes
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-wuerth-slate">
        <Icon size={18} />
      </span>
      <div>
        <div className="text-xs text-wuerth-mute">{label}</div>
        <div className="text-sm font-semibold text-wuerth-ink">{value}</div>
      </div>
    </Card>
  );
}
