"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";

import { updatePatientAction } from "@/actions/patients";
import type { ApiPatient } from "@/lib/api/types";

interface PatientEditModalProps {
  opened: boolean;
  onClose: () => void;
  patient: ApiPatient | null;
}

interface FormValues {
  name: string;
  age: number | string;
  gender: string;
  phone: string;
  condition: string;
}

const PHONE_REGEX = /^[0-9+().\- ]{7,20}$/;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// Edit rules mirror the backend PATCH validator: integer age 0–130 when the
// field is present, trimmed name/phone/condition, enum gender. Clearing a
// supplied gender is unsupported by the API — this Select is clearable={false}
// so a set gender can only be changed, never nulled from the UI.
function validateAge(value: number | string): string | null {
  const raw = typeof value === "string" ? value.trim() : String(value);
  if (raw === "") return "Age is required";
  if (!/^-?\d+$/.test(raw)) return "Age must be a whole number";
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) return "Age must be a whole number";
  if (parsed < 0) return "Age must be 0 or greater";
  if (parsed > 130) return "Age must be at most 130";
  return null;
}

export function PatientEditModal({
  opened,
  onClose,
  patient,
}: PatientEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Hooks stay unconditional; a null patient only renders nothing (the
  // listing remounts this modal per record via its key, so initialValues
  // re-capture the freshly opened record — "reset each opened record").
  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      name: patient?.name ?? "",
      age: patient?.age ?? "",
      gender: patient?.gender ?? "",
      phone: patient?.phone ?? "",
      condition: patient?.condition ?? "",
    },
    validate: {
      name: (val) => {
        const trimmed = val.trim();
        if (trimmed.length < 2) return "Name must be at least 2 characters";
        if (trimmed.length > 100) return "Name must be at most 100 characters";
        return null;
      },
      age: validateAge,
      gender: (val) => {
        if (!val) return null;
        if (!GENDER_OPTIONS.some((option) => option.value === val)) {
          return "Gender must be male, female or other";
        }
        return null;
      },
      phone: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Phone is required";
        if (!PHONE_REGEX.test(trimmed)) {
          return "Phone must be 7-20 characters using digits, spaces, + ( ) . -";
        }
        return null;
      },
      condition: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Condition is required";
        if (trimmed.length > 150)
          return "Condition must be at most 150 characters";
        return null;
      },
    },
  });

  if (!patient) return null;

  const handleClose = () => {
    setServerError(null);
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);

    // Send only the changed fields (spec F7); the API stays the source of
    // truth for per-field rules behind the UI's pre-checks.
    const name = values.name.trim();
    const numericAge =
      typeof values.age === "number"
        ? values.age
        : Number(values.age.trim());
    const phone = values.phone.trim();
    const condition = values.condition.trim();

    const changed: Partial<{
      name: string;
      age: number;
      gender: "male" | "female" | "other";
      phone: string;
      condition: string;
    }> = {};

    if (name !== patient.name) changed.name = name;
    if (numericAge !== patient.age) changed.age = numericAge;

    // An existing unset gender simply stays omitted (""); a changed pick
    // replaces it. Clearing a set gender is impossible by design.
    const gender = values.gender || "";
    if (gender !== (patient.gender ?? "")) {
      changed.gender = gender as "male" | "female" | "other";
    }

    if (phone !== patient.phone) changed.phone = phone;
    if (condition !== patient.condition) changed.condition = condition;

    if (Object.keys(changed).length === 0) {
      handleClose();
      return;
    }

    const result = await updatePatientAction(patient.id, changed);
    if (!result.ok) {
      if (result.fields) {
        form.setErrors(result.fields);
      }
      setServerError(result.message);
      if (result.refresh) {
        // Stale record (deleted elsewhere): refresh the list — do not treat
        // this as a validation outcome.
        router.refresh();
      }
      return;
    }

    startTransition(() => {
      handleClose();
      router.refresh();
    });
  };

  const isSubmitting = isPending || form.submitting;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!isSubmitting) handleClose();
      }}
      title="Edit Patient"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {serverError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              title="Error"
            >
              {serverError}
            </Alert>
          )}

          <TextInput
            label="Full Name"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("name")}
            {...form.getInputProps("name")}
          />

          <NumberInput
            label="Age (years)"
            min={0}
            max={130}
            allowDecimal={false}
            withAsterisk
            disabled={isSubmitting}
            key={form.key("age")}
            {...form.getInputProps("age")}
          />

          <Select
            label="Gender"
            placeholder="Not set"
            data={GENDER_OPTIONS}
            clearable={false}
            disabled={isSubmitting}
            key={form.key("gender")}
            {...form.getInputProps("gender")}
          />

          <TextInput
            label="Phone Number"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("phone")}
            {...form.getInputProps("phone")}
          />

          <TextInput
            label="Condition"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("condition")}
            {...form.getInputProps("condition")}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !form.isDirty()}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
