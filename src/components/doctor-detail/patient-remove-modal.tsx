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

import { removePatientAction } from "@/actions/patients";
import type { ApiDoctorPatient } from "@/lib/api/types";

interface PatientRemoveModalProps {
  opened: boolean;
  onClose: () => void;
  doctorId: string;
  patient: ApiDoctorPatient | null;
}

/**
 * Remove confirmation for a doctor's detail page. The wording plainly states
 * that BOTH the patient record and the doctor-patient link are deleted; the
 * backend performs that atomically (Backend B4).
 */
export function PatientRemoveModal({
  opened,
  onClose,
  doctorId,
  patient,
}: PatientRemoveModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!patient) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setIsRemoving(false);
    onClose();
  };

  const handleRemove = async () => {
    setErrorMessage(null);
    setIsRemoving(true);

    try {
      const result = await removePatientAction(doctorId, patient.id);
      if (!result.ok) {
        setErrorMessage(result.message);
        setIsRemoving(false);
        if (result.refresh) {
          // A stale id (patient or doctor removed elsewhere): refresh the
          // list and let the loader reconcile; this is not proof of rollback.
          router.refresh();
        }
        return;
      }

      startTransition(() => {
        setIsRemoving(false);
        handleClose();
        router.refresh();
      });
    } catch {
      setErrorMessage("An unexpected error occurred while removing the patient.");
      setIsRemoving(false);
    }
  };

  const busy = isPending || isRemoving;

  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (!busy) handleClose();
      }}
      title="Remove patient"
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
            title="Cannot Remove Patient"
          >
            {errorMessage}
          </Alert>
        )}

        <Text size="sm">
          Are you sure you want to remove{" "}
          <Text span fw={600}>
            {patient.name}
          </Text>
          ? This permanently deletes the patient{" "}
          <Text span fw={600}>
            and
          </Text>{" "}
          the link to this doctor. This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button color="red" onClick={handleRemove} loading={busy}>
            Remove
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
