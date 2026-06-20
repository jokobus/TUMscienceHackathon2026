import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export type ProfilePerson = {
  name: string;
  role?: string;
  avatarTone?: "red" | "ink";
  badge?: { label: string; tone: "green" | "amber" | "neutral" | "red" };
  details?: { label: string; value: string }[];
};

export type ProfileAction = {
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  onPress: () => void;
};

/** Bottom half-sheet showing a compact account overview + optional primary action. */
export function ProfileSheet({
  person,
  onClose,
  action,
}: {
  person: ProfilePerson | null;
  onClose: () => void;
  action?: ProfileAction;
}) {
  return (
    <BottomSheet open={!!person} onClose={onClose}>
      {person ? (
        <View>
          <View className="items-center">
            <Avatar name={person.name} size="xl" tone={person.avatarTone ?? "red"} />
            <Text className="mt-3 text-xl font-bold text-wuerth-ink">{person.name}</Text>
            {person.role ? <Text className="mt-0.5 text-sm text-wuerth-mute">{person.role}</Text> : null}
            {person.badge ? (
              <Chip tone={person.badge.tone} className="mt-2.5">
                {person.badge.label}
              </Chip>
            ) : null}
          </View>

          {person.details && person.details.length > 0 ? (
            <View className="mt-5 rounded-2xl bg-zinc-50 px-4">
              {person.details.map((d, i) => (
                <View
                  key={d.label}
                  className={cnRow(i)}
                >
                  <Text className="text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
                    {d.label}
                  </Text>
                  <Text className="flex-1 text-right text-sm font-medium text-wuerth-ink">
                    {d.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {action ? (
            <Button
              block
              className="mt-5"
              loading={action.loading}
              onPress={action.onPress}
              icon={action.icon}
            >
              {action.label}
            </Button>
          ) : null}
        </View>
      ) : null}
    </BottomSheet>
  );
}

function cnRow(i: number) {
  return `flex-row items-center justify-between gap-4 py-3 ${i > 0 ? "border-t border-wuerth-line" : ""}`;
}
