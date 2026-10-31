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
import { IconAlertCircle, IconStethoscope } from "@tabler/icons-react";

import { addPatientAction } from "@/actions/patients";
import type { DoctorOption } from "@/components/patients/doctor-options";

interface PatientDirectoryAddModalProps {
  opened: boolean;
  onClose: () => void;
  doctorOptions: DoctorOption[];
  doctorsUnavailable: boolean;
}

interface FormValues {
  doctorId: string | null;
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

// Create rules mirror the backend validator exactly: trimmed name 2–100,
// required integer age 0–130, optional gender (omitted from the body when
// unset), required phone pattern, required condition up to 150. The API
// stays the source of truth behind the UI's pre-checks.
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

/**
 * Directory-level patient creation. Every patient must be assigned to a
 * doctor, so the doctor select is required and searchable — the payload goes
 * through the same `addPatientAction` factory the doctor-detail page uses,
 * keeping one create contract (patient + link) for both entry points.
 */
export function PatientDirectoryAddModal({
  opened,
  onClose,
  doctorOptions,
  doctorsUnavailable,
}: PatientDirectoryAddModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      doctorId: null,
      name: "",
      age: "",
      gender: "",
      phone: "",
      condition: "",
    },
    validate: {
      doctorId: (value) => {
        if (!value) return "Doctor is required";
        if (!doctorOptions.some((option) => option.id === value)) {
          return "Select a doctor from the list";
        }
        return null;
      },
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

  const handleClose = () => {
    setServerError(null);
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);

    const result = await addPatientAction(values.doctorId as string, {
      name: values.name.trim(),
      age: values.age,
      gender: values.gender || undefined,
      phone: values.phone.trim(),
      condition: values.condition.trim(),
    });

    if (!result.ok) {
      if (result.fields) {
        form.setErrors(result.fields);
      }
      if (result.refresh) {
        // NOT_FOUND: the chosen doctor disappeared mid-submit. Refresh so
        // this page's loader re-fetches both lists, and reject the stale
        // selection on the field instead of treating it as generic failure.
        form.setFieldError(
          "doctorId",
          "Selected doctor no longer exists — the list was refreshed",
        );
        router.refresh();
      }
      setServerError(result.message);
      return;
    }

    startTransition(() => {
      handleClose();
      router.refresh();
    });
  };

  const isSubmitting = isPending || form.submitting;
  const disabled =
    isSubmitting || doctorsUnavailable || doctorOptions.length === 0;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!isSubmitting) handleClose();
      }}
      title="Add Patient"
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

          {doctorsUnavailable ? (
            <Alert
              icon={<IconStethoscope size={16} />}
              color="orange"
              variant="light"
              title="Doctor list unavailable"
            >
              The doctor list could not be loaded, so a doctor cannot be
              assigned right now. Close this dialog and refresh the page.
            </Alert>
          ) : doctorOptions.length === 0 ? (
            <Alert
              icon={<IconStethoscope size={16} />}
              color="orange"
              variant="light"
              title="No doctors yet"
            >
              A patient must be assigned to a doctor, and no doctors exist
              yet. Create one on the Doctors page first.
            </Alert>
          ) : null}

          <Select
            label="Doctor"
            placeholder="Search and select a doctor"
            withAsterisk
            searchable
            clearable={false}
            maxDropdownHeight={280}
            nothingFoundMessage="No doctors match this search"
            leftSection={<IconStethoscope size={16} />}
            data={doctorOptions.map((option) => ({
              value: option.id,
              label: option.detail
                ? `${option.name} — ${option.detail}`
                : option.name,
            }))}
            disabled={isSubmitting || doctorsUnavailable || doctorOptions.length === 0}
            key={form.key("doctorId")}
            {...form.getInputProps("doctorId")}
          />

          <TextInput
            label="Full Name"
            placeholder="Ashley Stone"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("name")}
            {...form.getInputProps("name")}
          />

          <NumberInput
            label="Age (years)"
            placeholder="34"
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
            placeholder="Select gender"
            data={GENDER_OPTIONS}
            clearable
            disabled={isSubmitting}
            key={form.key("gender")}
            {...form.getInputProps("gender")}
          />

          <TextInput
            label="Phone Number"
            placeholder="+1 555 210 4587"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("phone")}
            {...form.getInputProps("phone")}
          />

          <TextInput
            label="Condition"
            placeholder="Hypertension"
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
            <Button type="submit" loading={isSubmitting} disabled={disabled}>
              Add Patient
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
