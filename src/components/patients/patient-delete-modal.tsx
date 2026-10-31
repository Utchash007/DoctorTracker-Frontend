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

import { deletePatientAction } from "@/actions/patients";
import type { ApiPatient } from "@/lib/api/types";

interface PatientDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  patient: ApiPatient | null;
}

/**
 * Delete confirmation for the patients directory. The wording states plainly
 * that BOTH the patient record and their doctor-patient link are deleted —
 * the backend performs that atomically in one transaction (Backend B4).
 */
export function PatientDeleteModal({
  opened,
  onClose,
  patient,
}: PatientDeleteModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!patient) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setIsDeleting(false);
    onClose();
  };

  const handleDelete = async () => {
    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const result = await deletePatientAction(patient.id);
      if (!result.ok) {
        setErrorMessage(result.message);
        setIsDeleting(false);
        if (result.refresh) {
          // A stale id (patient or their doctor deleted elsewhere): refresh
          // the list and let the loader reconcile.
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
      setErrorMessage("An unexpected error occurred while deleting the patient.");
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
      title="Delete patient"
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
            title="Cannot Delete Patient"
          >
            {errorMessage}
          </Alert>
        )}

        <Text size="sm">
          Are you sure you want to permanently delete{" "}
          <Text span fw={600}>
            {patient.name}
          </Text>
          ? This deletes the patient record{" "}
          <Text span fw={600}>
            and
          </Text>{" "}
          their link to their assigned doctor. This action cannot be undone.
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
