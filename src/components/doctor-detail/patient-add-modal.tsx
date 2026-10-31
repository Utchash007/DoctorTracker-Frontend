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

import { addPatientAction } from "@/actions/patients";

interface PatientAddModalProps {
  opened: boolean;
  onClose: () => void;
  doctorId: string;
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

// Create rules mirror the API (02-pages-and-data.md): trimmed name 2–100,
// required integer age 0–130, optional gender (omitted from the body when
// unset), required phone pattern, required condition up to 150.
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

export function PatientAddModal({
  opened,
  onClose,
  doctorId,
}: PatientAddModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      name: "",
      age: "",
      gender: "",
      phone: "",
      condition: "",
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

  const handleClose = () => {
    setServerError(null);
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);

    const result = await addPatientAction(doctorId, {
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
      setServerError(result.message);
      if (result.refresh) {
        // The doctor disappeared mid-edit; refresh the list/panel feedback.
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
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              Add Patient
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
