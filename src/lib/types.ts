export type ControlType = "button" | "slider" | "textInput";

export interface ControlComponent {
  id: string;
  type: ControlType;
  label: string;
}

export interface ControlProfile {
  name: string;
  controls: ControlComponent[];
}
