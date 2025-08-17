export const UI_CONFIG = {
  CLOSE_BUTTON_SIZE: 40,
  CLOSE_ICON_SIZE: 24,
  INFO_ICON_SIZE: 16,
  CLOSE_BUTTON_RADIUS: 20,
  SAVE_BUTTON_RADIUS: 20,
  FIELD_BORDER_RADIUS: 8,
  CONTAINER_BORDER_RADIUS: 12,
  TEXT_AREA_MIN_HEIGHT: 100,
  TEXT_AREA_LINES: 4,
} as const;

export const SPACING = {
  HEADER_HORIZONTAL: 16,
  HEADER_VERTICAL: 12,
  CLOSE_BUTTON_MARGIN: 12,
  CONTENT_PADDING: 16,
  FIELD_CONTAINER_MARGIN: 16,
  FIELD_CONTAINER_PADDING: 16,
  FIELD_LABEL_MARGIN: 8,
  TEXT_INPUT_HORIZONTAL: 12,
  TEXT_INPUT_VERTICAL: 10,
  INFO_TITLE_MARGIN: 12,
  INFO_ROW_MARGIN: 8,
  INFO_ROW_GAP: 8,
  SAVE_BUTTON_HORIZONTAL: 16,
  SAVE_BUTTON_VERTICAL: 8,
} as const;

export const LABELS = {
  EDIT_EVENT: "Edit Event",
  SAVE: "Save",
  SAVING: "...",
  TITLE_LABEL: "Title",
  TITLE_REQUIRED: "Title *",
  TITLE_PLACEHOLDER: "Event title",
  DESCRIPTION_LABEL: "Description",
  DESCRIPTION_PLACEHOLDER: "Event description",
  EVENT_INFO_TITLE: "Event Information",
  ERROR_TITLE: "Error",
  TITLE_REQUIRED_ERROR: "Title is required",
  SAVE_FAILED_ERROR: "Could not save changes",
} as const;

export const ICONS = {
  CLOSE: "close" as const,
  CALENDAR: "calendar" as const,
  TIME: "time" as const,
  FLAG: "flag" as const,
} as const;

export const COLORS = {
  WHITE: "white",
  TRANSPARENT: "transparent",
} as const;

export const ANIMATION = {
  SLIDE: "slide" as const,
} as const;

export const PRESENTATION_STYLE = {
  PAGE_SHEET: "pageSheet" as const,
} as const;
