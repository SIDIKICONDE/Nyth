import { useCallback } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { ExportFormat } from "../types";

interface UseFormatHandlerProps {
  isProResSelected: boolean;
  setExportFormat: (format: ExportFormat) => void;
  setWarningMessage?: (message: string | null) => void;
}

export const useFormatHandler = ({
  isProResSelected,
  setExportFormat,
  setWarningMessage,
}: UseFormatHandlerProps) => {
  const { t } = useTranslation();

  const handleFormatChange = useCallback(
    (newFormat: ExportFormat) => {
      // Si ProRes est sélectionné, forcer MOV
      if (isProResSelected && newFormat === "mp4") {
        setWarningMessage?.(
          t(
            "exportOptions.format.proResRequiresMovFormat",
            "⚠️ ProRes requires MOV format"
          )
        );
        return;
      }

      setWarningMessage?.(null);
      setExportFormat(newFormat);
    },
    [isProResSelected, setExportFormat, setWarningMessage, t]
  );

  return { handleFormatChange };
};
