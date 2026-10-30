"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
} from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";

import { createDoctorAction, updateDoctorAction } from "@/actions/doctors";
import type { ApiDoctor } from "@/lib/api/types";

interface DoctorFormModalProps {
  opened: boolean;
  onClose: () => void;
  doctor: ApiDoctor | null;
}

interface FormValues {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

const PHONE_REGEX = /^[0-9+().\- ]{7,20}$/;

export function DoctorFormModal({
  opened,
  onClose,
  doctor,
}: DoctorFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = Boolean(doctor);

  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      name: doctor?.name ?? "",
      specialization: doctor?.specialization ?? "",
      hospital: doctor?.hospital ?? "",
      phone: doctor?.phone ?? "",
      email: doctor?.email ?? "",
    },
    validate: {
      name: (val) => {
        const trimmed = val.trim();
        if (trimmed.length < 2) return "Name must be at least 2 characters";
        if (trimmed.length > 100) return "Name must be at most 100 characters";
        return null;
      },
      specialization: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Specialization is required";
        if (trimmed.length > 100)
          return "Specialization must be at most 100 characters";
        return null;
      },
      hospital: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Hospital is required";
        if (trimmed.length > 150)
          return "Hospital must be at most 150 characters";
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
      email: isEmail("Enter a valid email"),
    },
  });

  const handleClose = () => {
    setServerError(null);
    form.reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);

    const trimmed = {
      name: values.name.trim(),
      specialization: values.specialization.trim(),
      hospital: values.hospital.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
    };

    if (isEdit && doctor) {
      // Send only changed fields per spec
      const changed: Partial<FormValues> = {};
      if (trimmed.name !== doctor.name) changed.name = trimmed.name;
      if (trimmed.specialization !== doctor.specialization)
        changed.specialization = trimmed.specialization;
      if (trimmed.hospital !== doctor.hospital)
        changed.hospital = trimmed.hospital;
      if (trimmed.phone !== doctor.phone) changed.phone = trimmed.phone;
      if (trimmed.email !== doctor.email) changed.email = trimmed.email;

      if (Object.keys(changed).length === 0) {
        handleClose();
        return;
      }

      const result = await updateDoctorAction(doctor.id, changed);
      if (!result.ok) {
        if (result.fields) {
          form.setErrors(result.fields);
        }
        setServerError(result.message);
        return;
      }
    } else {
      const result = await createDoctorAction(trimmed);
      if (!result.ok) {
        if (result.fields) {
          form.setErrors(result.fields);
        }
        setServerError(result.message);
        return;
      }
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
      title={isEdit ? "Edit Doctor" : "New Doctor"}
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
            placeholder="Dr. Jane Doe"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("name")}
            {...form.getInputProps("name")}
          />

          <TextInput
            label="Specialization"
            placeholder="Cardiology"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("specialization")}
            {...form.getInputProps("specialization")}
          />

          <TextInput
            label="Hospital"
            placeholder="City General Hospital"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("hospital")}
            {...form.getInputProps("hospital")}
          />

          <TextInput
            label="Phone Number"
            placeholder="+1 555 123 4567"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("phone")}
            {...form.getInputProps("phone")}
          />

          <TextInput
            label="Email Address"
            placeholder="doctor@example.com"
            withAsterisk
            disabled={isSubmitting}
            key={form.key("email")}
            {...form.getInputProps("email")}
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
              disabled={isSubmitting || (isEdit && !form.isDirty())}
            >
              {isEdit ? "Save Changes" : "Create Doctor"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
