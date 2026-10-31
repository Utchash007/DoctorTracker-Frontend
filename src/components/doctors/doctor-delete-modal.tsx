"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

import { deleteDoctorAction } from "@/actions/doctors";
import type { ApiDoctor } from "@/lib/api/types";

interface DoctorDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  doctor: ApiDoctor | null;
}

export function DoctorDeleteModal({
  opened,
  onClose,
  doctor,
}: DoctorDeleteModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!doctor) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const result = await deleteDoctorAction(doctor.id);
      if (!result.ok) {
        setErrorMessage(result.message);
        setIsDeleting(false);
        if (result.refresh) {
          router.refresh();
        }
        return;
      }

      startTransition(() => {
        setIsDeleting(false);
        handleClose();
        router.refresh();
      });
    } catch {
      setErrorMessage("An unexpected error occurred while deleting the doctor.");
      setIsDeleting(false);
    }
  };

  const busy = isPending || isDeleting;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!busy) handleClose();
      }}
      title="Delete Doctor"
      closeOnClickOutside={!busy}
      closeOnEscape={!busy}
      centered
      size="sm"
    >
      <Stack gap="md">
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            title="Cannot Delete Doctor"
          >
            {errorMessage}
          </Alert>
        )}

        <Text size="sm">
          Are you sure you want to delete{" "}
          <Text span fw={600}>
            {doctor.name}
          </Text>
          ? This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={busy}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
